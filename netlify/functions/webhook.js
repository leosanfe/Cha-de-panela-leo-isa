const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

exports.handler = async (event, context) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const payload = JSON.parse(event.body || '{}');
        console.log('Webhook recebido:', JSON.stringify(payload));

        const { event: abacateEvent, data } = payload;

        if (abacateEvent === 'billing.paid' && data && data.id) {
            const billingId = data.id;

            // Fetch pending payment from Firebase
            const pendingUrl = `https://cha-leo-isa-default-rtdb.firebaseio.com/pending_payments/${billingId}.json`;
            const pendingRes = await fetch(pendingUrl);
            
            if (!pendingRes.ok) {
                console.error(`Erro ao buscar pending_payment para ${billingId}`);
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({ error: 'Erro ao buscar pagamento pendente.' })
                };
            }

            const paymentData = await pendingRes.json();

            if (paymentData && paymentData.status === 'pending') {
                const { name, phone, companions, giftIds, giftNames } = paymentData;

                // 1. Mark payment as paid in Firebase
                await fetch(pendingUrl, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: 'paid' })
                });

                // 2. Reserve gifts in /guests
                const guestsUrl = `https://cha-leo-isa-default-rtdb.firebaseio.com/guests.json`;
                await fetch(guestsUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name,
                        gifts: giftNames,
                        giftIds,
                        date: new Date().toISOString()
                    })
                });

                // 3. Increment stock count in /reserved
                for (const id of giftIds) {
                    const reservedItemUrl = `https://cha-leo-isa-default-rtdb.firebaseio.com/reserved/${id}.json`;
                    const currentRes = await fetch(reservedItemUrl);
                    let currentCount = 0;
                    if (currentRes.ok) {
                        const countVal = await currentRes.json();
                        if (countVal !== null) {
                            currentCount = parseInt(countVal, 10) || 0;
                        }
                    }
                    await fetch(reservedItemUrl, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(currentCount + 1)
                    });
                }

                // 4. Write RSVP backup (if not already written)
                const rsvpQueryUrl = `https://cha-leo-isa-default-rtdb.firebaseio.com/rsvp.json`;
                const rsvpRes = await fetch(rsvpQueryUrl);
                let alreadyRsvped = false;
                if (rsvpRes.ok) {
                    const allRsvp = await rsvpRes.json();
                    if (allRsvp) {
                        alreadyRsvped = Object.values(allRsvp).some(
                            r => r.name && r.name.trim().toLowerCase() === name.trim().toLowerCase()
                        );
                    }
                }

                if (!alreadyRsvped) {
                    await fetch(rsvpQueryUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name,
                            phone,
                            companions: companions || [],
                            status: 'confirmed',
                            date: new Date().toISOString()
                        })
                    });
                }

                console.log(`Pagamento do billingId ${billingId} processado e gravado com sucesso.`);
            } else {
                console.log(`billingId ${billingId} não estava pendente ou não foi encontrado.`);
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true })
        };
    } catch (err) {
        console.error('Erro no processamento do webhook:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erro interno no webhook.', details: err.message })
        };
    }
};
