const GIFTS = [
    // ===== COTAS ESPECIAIS =====
    { id: 'cota-ostentacao', name: 'O gerente ficou maluco! (Cota Ostentação)', price: 'R$ 3.000,00' },
    { id: 'tv-grande', name: 'Smart TV Grande', price: 'R$ 2.200,00' },
    { id: 'vida-sem-dividas', name: 'Começar a vida sem dívidas', price: 'R$ 1.500,00' },

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
    { id: 'moringa-agua', name: 'Moringa de Água de Cabeceira', price: 'R$ 45,00' },

    // ===== LUA DE MEL & VIAGENS =====
    { id: 'voo-executivo', name: 'Upgrade na viagem (Voo Executivo)', price: 'R$ 600,00' },
    { id: 'spa-dois', name: 'SPA a dois (Dia de rei e rainha)', price: 'R$ 550,00' },
    { id: 'ajuda-lua-mel', name: 'Ajuda na Lua de Mel', price: 'R$ 500,00' },
    { id: 'passeios-viagem', name: 'Passeios radicais ou culturais na viagem', price: 'R$ 260,00' },
    { id: 'massagens-relaxar', name: 'Massagens para relaxar pós-casamento', price: 'R$ 220,00' },
    { id: 'ingressos-atracoes', name: 'Ingressos para atrações diversas', price: 'R$ 135,00' },

    // ===== EXPERIÊNCIAS ROMÂNTICAS =====
    { id: 'jantar-velas', name: 'Jantar romântico à luz de velas', price: 'R$ 160,00' },
    { id: 'noite-fondue', name: 'Noite do Fondue (Aparelho + Ingredientes)', price: 'R$ 180,00' },
    { id: 'cafe-cama', name: 'Café da manhã de hotel servido na cama', price: 'R$ 90,00' },

    // ===== PRESENTES DIVERTIDOS =====
    { id: 'noiva-massagem-15d', name: 'Massagem da noiva no noivo toda noite por 15 dias', price: 'R$ 100,00' },
    { id: 'noivo-louca-15d', name: 'Noivo lava a louça durante 15 dias todo dia', price: 'R$ 100,00' },
    { id: 'delivery-sexta', name: 'Patrocínio do Delivery de Sexta', price: 'R$ 80,00' },
    { id: 'salvar-miojo', name: 'Salvando o casal do miojo (Jantar)', price: 'R$ 50,00' },

    // ===== CHURRASCO & LAZER =====
    { id: 'churrascao-picanha', name: 'Churrascão com Picanha', price: 'R$ 350,00' },
    { id: 'caixa-som-bluetooth', name: 'Caixa de som Bluetooth para o churrasco', price: 'R$ 300,00' },
    { id: 'churrascao-contrafile', name: 'Churrascão com Contrafilé', price: 'R$ 120,00' },
    { id: 'acendedor-churrasqueira', name: 'Acendedor de churrasqueira', price: 'R$ 15,00' },

    // ===== COZINHA & UTILIDADES =====
    { id: 'bebidas-especiais', name: 'Bebidas especiais (Sucos finos/imports)', price: 'R$ 145,00' },
    { id: 'bandeja-bambu-cama', name: 'Bandeja de bambu para café na cama', price: 'R$ 65,00' },
    { id: 'tabua-corte', name: 'Tábua de corte estilosa', price: 'R$ 55,00' },
    { id: 'kit-temperos', name: 'Kit de temperos do chef', price: 'R$ 40,00' },
    { id: 'copos-americanos', name: 'Jogo de copos americanos', price: 'R$ 25,00' },
    { id: 'potes-plastico', name: 'Potes de plástico (com tampa!)', price: 'R$ 20,00' },

    // ===== DECORAÇÃO & CHARME =====
    { id: 'vaso-cristal', name: 'Vaso de Cristal Decorativo', price: 'R$ 130,00' },
    { id: 'vela-aromatica', name: 'Vela Aromática Decorativa', price: 'R$ 30,00' }
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
