module.exports = async (event, context) => {
    const headers = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const billingId = event.queryStringParameters.id;
        if (!billingId) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Falta o ID da cobrança.' }) };
        }

        const abacateKey = process.env.ABACATEPAY_API_KEY;
        const abacateRes = await fetch(`https://api.abacatepay.com/v2/checkouts/get?id=${billingId}`, {
            headers: {
                'Authorization': `Bearer ${abacateKey}`
            }
        });

        if (!abacateRes.ok) {
            const errText = await abacateRes.text();
            console.error('Erro ao verificar status no AbacatePay (get):', errText);
            return { statusCode: 500, headers, body: JSON.stringify({ error: 'Erro ao verificar no AbacatePay.' }) };
        }

        const abacateData = await abacateRes.json();
        const transaction = abacateData.data;

        let status = 'PENDING';
        if (transaction) {
            status = transaction.status; // e.g. "PAID", "PENDING"
        }

        // If status is PAID (or equivalent, check both uppercase and lowercase),
        // we trigger the firebase update just like the webhook, in case webhook didn't do it yet!
        if (status === 'PAID' || status === 'CONFIRMED' || status === 'paid') {
            const pendingUrl = `https://cha-leo-isa-default-rtdb.firebaseio.com/casamento/pending_payments/${billingId}.json`;
            const pendingRes = await fetch(pendingUrl);
            if (pendingRes.ok) {
                const paymentData = await pendingRes.json();
                if (paymentData && paymentData.status === 'pending') {
                    const { name, phone, companions, giftIds, giftNames } = paymentData;

                    // 1. Mark payment as paid in Firebase
                    await fetch(pendingUrl, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'paid' })
                    });

                    // 2. Reserve gifts in /casamento/guests
                    const guestsUrl = `https://cha-leo-isa-default-rtdb.firebaseio.com/casamento/guests.json`;
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

                    // 3. Increment stock count in /casamento/reserved
                    for (const id of giftIds) {
                        const reservedItemUrl = `https://cha-leo-isa-default-rtdb.firebaseio.com/casamento/reserved/${id}.json`;
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
                    const rsvpQueryUrl = `https://cha-leo-isa-default-rtdb.firebaseio.com/casamento/rsvp.json`;
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
                }
            }
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ status })
        };
    } catch (err) {
        console.error('Erro na checagem de pagamento:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erro interno no servidor.', details: err.message })
        };
    }
};
