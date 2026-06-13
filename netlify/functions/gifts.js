const GIFTS = [
    // ===== COTAS ESPECIAIS =====
    { id: 'tv-grande', name: 'Smart TV Grande', price: 'R$ 2.200,00' },

    // ===== CASA NOVA =====
    { id: 'mesa-cozinha', name: 'Mesa da Cozinha', price: 'R$ 850,00' },
    { id: 'robo-aspirador', name: 'Robô Aspirador', price: 'R$ 450,00' },
    { id: 'mesa-centro', name: 'Mesa de Centro', price: 'R$ 280,00' },
    { id: 'espelho-adnet', name: 'Espelho Adnet redondo para o hall', price: 'R$ 250,00' },
    { id: 'quadro-decorativo', name: 'Quadro Decorativo Grande para Sala', price: 'R$ 200,00' },
    { id: 'tapete-geometrico', name: 'Tapete Geométrico para Sala', price: 'R$ 170,00' },
    { id: 'luminaria-chao', name: 'Luminária de Chão Moderna', price: 'R$ 150,00' },
    { id: 'planta-artificial', name: 'Planta artificial alta com vaso minimalista', price: 'R$ 110,00' },
    { id: 'almofadas-decorativas', name: 'Jogo de Almofadas Decorativas', price: 'R$ 75,00' },
    { id: 'quadros-menores', name: 'Kit de Quadros Menores', price: 'R$ 60,00' },
    { id: 'capacho-divertido', name: 'Capacho divertido para a porta de entrada', price: 'R$ 50,00' },
    { id: 'maquina-lavar', name: 'Máquina de lavar', price: 'R$ 1.500,00' },
    { id: 'roupadecama-king', name: 'Roupa de cama King', price: 'R$ 180,00' },
    { id: 'sapateira', name: 'Sapateira', price: 'R$ 120,00' },
    { id: 'toalha-banho', name: 'Toalha de banho', price: 'R$ 80,00' },

    // ===== LUA DE MEL & VIAGENS =====
    { id: 'voo-executivo', name: 'Upgrade na viagem (Voo Executivo)', price: 'R$ 600,00' },
    { id: 'spa-dois', name: 'SPA a dois (Dia de rei e rainha)', price: 'R$ 550,00' },
    { id: 'ajuda-lua-mel', name: 'Ajuda na Lua de Mel', price: 'R$ 500,00' },
    { id: 'passeios-viagem', name: 'Passeios radicais ou culturais na viagem', price: 'R$ 260,00' },
    { id: 'ingressos-atracoes', name: 'Ingressos para atrações diversas', price: 'R$ 135,00' },

    // ===== EXPERIÊNCIAS ROMÂNTICAS =====
    { id: 'noite-fondue', name: 'Noite do Fondue (Aparelho + Ingredientes)', price: 'R$ 180,00' },

    // ===== PRESENTES DIVERTIDOS =====
    { id: 'noiva-massagem-15d', name: 'Massagem da noiva no noivo toda noite por 15 dias', price: 'R$ 100,00' },
    { id: 'noivo-louca-15d', name: 'Noivo lava a louça durante 15 dias todo dia', price: 'R$ 100,00' },
    { id: 'delivery-sexta', name: 'Patrocínio do Delivery de Sexta', price: 'R$ 80,00' },
    { id: 'salvar-miojo', name: 'Salvando o casal do miojo (Jantar)', price: 'R$ 50,00' },

    // ===== CHURRASCO & LAZER =====
    { id: 'churrascao-picanha', name: 'Churrascão com Picanha', price: 'R$ 350,00' },
    { id: 'churrascao-contrafile', name: 'Churrascão com Contrafilé', price: 'R$ 120,00' },

    // ===== COZINHA & UTILIDADES =====
    { id: 'bandeja-bambu-cama', name: 'Bandeja de bambu para café na cama', price: 'R$ 65,00' },
    { id: 'tabua-corte', name: 'Tábua de corte estilosa', price: 'R$ 55,00' },
    { id: 'armario-cozinha', name: 'Armário de cozinha', price: 'R$ 600,00' },
    { id: 'depurador-ar', name: 'Depurador de ar', price: 'R$ 350,00' },
    { id: 'liquidificador', name: 'Liquidificador', price: 'R$ 150,00' }
];

function getGiftPriceInCents(priceStr) {
    const valStr = priceStr.replace(/[^\d,]/g, '').replace(',', '.');
    const val = parseFloat(valStr);
    return Math.round(val * 100);
}

module.exports = {
    GIFTS,
    getGiftPriceInCents
};
