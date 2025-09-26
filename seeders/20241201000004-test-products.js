'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Inserir apenas um produto simples para teste
    await queryInterface.bulkInsert('produtos', [
      {
        nome: 'Betoneira 400L Teste',
        descricao: 'Betoneira de teste para verificar inserção',
        tipo: 'Máquina',
        preco_base: 2500.00,
        unidade_medida: 'unidade',
        ativo: true,
        codigo_interno: 'BET-400-TEST',
        categoria: 'Betoneiras',
        peso: 120.000,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('produtos', {
      codigo_interno: 'BET-400-TEST'
    }, {});
  }
};