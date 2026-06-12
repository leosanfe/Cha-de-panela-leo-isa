const { GIFTS, getGiftPriceInCents } = require('./gifts');

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
        const { name, phone, companions, giftIds, method } = JSON.parse(event.body || '{}');

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

        // Use V1 checkout for both PIX and CARD
        const abacateBody = {
            frequency: 'ONE_TIME',
            methods: [method === 'pix' ? 'PIX' : 'CARD'],
            products: [
                {
                    externalId: validGiftIds.join(','),
                    name: productNamesText.substring(0, 100),
                    description: `Presente para Léo e Isa: ${productNamesText.substring(0, 100)}`,
                    quantity: 1,
                    price: totalCents
                }
            ],
            returnUrl: successRedirectUrl,
            completionUrl: successRedirectUrl
        };

        const abacateRes = await fetch('https://api.abacatepay.com/v1/billing/create', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${abacateKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(abacateBody)
        });

        if (!abacateRes.ok) {
            const errBody = await abacateRes.text();
            console.error('Erro no AbacatePay:', errBody);
            return {
                statusCode: 500,
                headers,
                body: JSON.stringify({ error: 'Erro ao gerar checkout no AbacatePay.', details: errBody })
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
        const fbUrl = `https://cha-leo-isa-default-rtdb.firebaseio.com/pending_payments/${billing.id}.json`;
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
