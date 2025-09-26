'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('produtos', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      nome: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      descricao: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      foto_url: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      tipo: {
        type: Sequelize.ENUM('Máquina', 'Acessório'),
        allowNull: false
      },
      maquinas_compativeis: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        allowNull: true,
        comment: 'Array de IDs das máquinas compatíveis (apenas para acessórios)'
      },
      preco_base: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Preço base do produto'
      },
      unidade_medida: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Unidade de medida (m2, unidade, kg, etc.)'
      },
      ativo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      codigo_interno: {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true
      },
      categoria: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      peso: {
        type: Sequelize.DECIMAL(8, 3),
        allowNull: true,
        comment: 'Peso em kg'
      },
      dimensoes: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Dimensões do produto (largura, altura, profundidade)'
      },
      especificacoes_tecnicas: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Especificações técnicas em formato JSON'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Índices para performance
    await queryInterface.addIndex('produtos', ['tipo']);
    await queryInterface.addIndex('produtos', ['ativo']);
    await queryInterface.addIndex('produtos', ['categoria']);
    await queryInterface.addIndex('produtos', ['codigo_interno']);
    await queryInterface.addIndex('produtos', ['nome']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('produtos');
  }
};