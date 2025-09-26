'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    await queryInterface.bulkInsert('users', [
      {
        nome: 'Administrador',
        email: 'admin@sistema-orcamentos.com',
        senha: hashedPassword,
        role: 'admin',
        ativo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nome: 'Vendedor Teste',
        email: 'vendedor@sistema-orcamentos.com',
        senha: await bcrypt.hash('vendedor123', 12),
        role: 'vendedor',
        ativo: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: {
        [Sequelize.Op.in]: [
          'admin@sistema-orcamentos.com',
          'vendedor@sistema-orcamentos.com'
        ]
      }
    }, {});
  }
};