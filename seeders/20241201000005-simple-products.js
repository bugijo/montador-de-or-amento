'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Inserir produtos básicos para teste
    const produtos = [
      {
        nome: 'Betoneira 400L',
        descricao: 'Betoneira basculante 400 litros para obras',
        tipo: 'Máquina',
        maquinas_compativeis: null,
        preco_base: 2850.00,
        unidade_medida: 'unidade',
        ativo: true,
        codigo_interno: 'BET-400',
        categoria: 'Betoneiras',
        peso: 120.000,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nome: 'Vibrador de Concreto',
        descricao: 'Vibrador de concreto com motor 1.5HP',
        tipo: 'Máquina',
        maquinas_compativeis: null,
        preco_base: 1850.00,
        unidade_medida: 'unidade',
        ativo: true,
        codigo_interno: 'VIB-1.5',
        categoria: 'Vibradores',
        peso: 28.000,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nome: 'Serra Circular',
        descricao: 'Serra circular de mesa com motor 3HP',
        tipo: 'Máquina',
        maquinas_compativeis: null,
        preco_base: 3200.00,
        unidade_medida: 'unidade',
        ativo: true,
        codigo_interno: 'SERRA-3HP',
        categoria: 'Serras',
        peso: 85.000,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nome: 'Disco Diamantado 350mm',
        descricao: 'Disco diamantado para serra circular',
        tipo: 'Acessório',
        maquinas_compativeis: [3], // Compatível com Serra Circular
        preco_base: 185.00,
        unidade_medida: 'unidade',
        ativo: true,
        codigo_interno: 'DISCO-350',
        categoria: 'Discos',
        peso: 1.200,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nome: 'Óleo SAE 30',
        descricao: 'Óleo lubrificante para motores',
        tipo: 'Acessório',
        maquinas_compativeis: [1, 2, 3], // Compatível com todas as máquinas
        preco_base: 28.00,
        unidade_medida: 'litro',
        ativo: true,
        codigo_interno: 'OLEO-SAE30',
        categoria: 'Lubrificantes',
        peso: 0.900,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Inserir produtos um por vez para evitar problemas de estrutura
    for (const produto of produtos) {
      await queryInterface.bulkInsert('produtos', [produto], {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('produtos', null, {});
  }
};