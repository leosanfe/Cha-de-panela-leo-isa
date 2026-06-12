const { GIFTS, getGiftPriceInCents } = require('./gifts');

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json'
};

function generateCPF() {
    const num = () => Math.floor(Math.random() * 9);
    const n = Array.from({length: 9}, num);
    let d1 = n.reduce((acc, val, idx) => acc + val * (10 - idx), 0);
    d1 = 11 - (d1 % 11);
    if (d1 >= 10) d1 = 0;
    let d2 = d1 * 2 + n.reduce((acc, val, idx) => acc + val * (11 - idx), 0);
    d2 = 11 - (d2 % 11);
    if (d2 >= 10) d2 = 0;
    const raw = [...n, d1, d2].join('');
    return `${raw.substring(0,3)}.${raw.substring(3,6)}.${raw.substring(6,9)}-${raw.substring(9,11)}`;
}

function formatCellphone(phoneStr) {
    const digits = (phoneStr || '').replace(/\D/g, '');
    if (digits.length === 11) {
        return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
    } else if (digits.length === 10) {
        return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
    }
    return '(21) 99508-0295'; // fallback
}

exports.handler = async (event, context) => {
    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { name, email, phone, companions, giftIds, method } = JSON.parse(event.body || '{}');

        if (!name || !giftIds || !Array.isArray(giftIds) || giftIds.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Faltam dados obrigatórios (name, giftIds).' })
            };
        }

        // Look up prices
        let totalCents = 0;
        const giftNames = [];
        const validGiftIds = [];

        giftIds.forEach(id => {
            const gift = GIFTS.find(g => g.id === id);
            if (gift) {
                totalCents += getGiftPriceInCents(gift.price);
                giftNames.push(gift.name);
                validGiftIds.push(id);
            }
        });

        if (validGiftIds.length === 0) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ error: 'Nenhum presente válido selecionado.' })
            };
        }

        const productNamesText = giftNames.join(', ');

        const abacateKey = process.env.ABACATEPAY_API_KEY;
        if (!abacateKey) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Chave do AbacatePay não configurada no servidor.' })
            };
        }

        const siteUrl = process.env.SITE_URL || 'http://localhost:8000';
        const successRedirectUrl = `${siteUrl}/?payment_success=true&name=${encodeURIComponent(name)}&gifts=${encodeURIComponent(validGiftIds.join(','))}`;

        const cleanPhone = (phone || '').replace(/\D/g, '');
        const formattedPhone = formatCellphone(cleanPhone);

        // 1. Create/find customer in AbacatePay (V2)
        const customerRes = await fetch('https://api.abacatepay.com/v2/customers/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${abacateKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: name,
                email: email
            })
        });

        if (!customerRes.ok) {
            const errBody = await customerRes.text();
            console.error('Erro ao criar cliente no AbacatePay:', errBody);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Erro ao cadastrar cliente no AbacatePay.', details: errBody })
            };
        }

        const customerData = await customerRes.json();
        const customerId = customerData.data?.id;

        if (!customerId) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'ID do cliente não retornado pelo AbacatePay.' })
            };
        }

        // 2. Create product in AbacatePay (V2)
        const productExternalId = `gift_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const productRes = await fetch('https://api.abacatepay.com/v2/products/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${abacateKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                externalId: productExternalId,
                name: productNamesText.substring(0, 100),
                price: totalCents,
                currency: 'BRL'
            })
        });

        if (!productRes.ok) {
            const errBody = await productRes.text();
            console.error('Erro ao criar produto no AbacatePay (V2):', errBody);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Erro ao cadastrar produto no AbacatePay (V2).', details: errBody })
            };
        }

        const productData = await productRes.json();
        const productId = productData.data?.id;

        if (!productId) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'ID do produto não retornado pelo AbacatePay (V2).' })
            };
        }

        // 3. Create Checkout in AbacatePay (V2)
        const abacateBody = {
            customerId: customerId,
            items: [
                {
                    id: productId,
                    quantity: 1
                }
            ],
            methods: [method === 'pix' ? 'PIX' : 'CARD'],
            completionUrl: successRedirectUrl,
            returnUrl: successRedirectUrl
        };

        const abacateRes = await fetch('https://api.abacatepay.com/v2/checkouts/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${abacateKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(abacateBody)
        });

        if (!abacateRes.ok) {
            const errBody = await abacateRes.text();
            console.error('Erro no AbacatePay V2 Checkout:', errBody);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Erro ao gerar checkout no AbacatePay V2.', details: errBody })
            };
        }

        const abacateData = await abacateRes.json();
        const billing = abacateData.data;

        if (!billing || !billing.id || !billing.url) {
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Resposta inválida do AbacatePay.' })
            };
        }

        // Save metadata to Firebase Realtime Database
        const fbUrl = `https://cha-leo-isa-default-rtdb.firebaseio.com/casamento/pending_payments/${billing.id}.json`;
        const fbRes = await fetch(fbUrl, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name,
                phone,
                companions: companions || [],
                giftIds: validGiftIds,
                giftNames,
                status: 'pending',
                date: new Date().toISOString()
            })
        });

        if (!fbRes.ok) {
            console.error('Erro ao salvar no Firebase:', await fbRes.text());
        }

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                url: billing.url,
                billingId: billing.id
            })
        };
    } catch (err) {
        console.error('Erro na criação do checkout:', err);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Erro interno no servidor.', details: err.message })
        };
    }
};
