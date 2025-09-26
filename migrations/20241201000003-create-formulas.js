'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('formulas', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      produto_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'produtos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'ID do produto (acessório) ao qual a fórmula se aplica'
      },
      maquina_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'produtos',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'ID da máquina para a qual a fórmula é válida'
      },
      formula: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Fórmula de cálculo (ex: "m2 / 100 * 2")'
      },
      nome: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: 'Nome descritivo da fórmula'
      },
      descricao: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Descrição detalhada da fórmula e seu uso'
      },
      variaveis_entrada: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: 'Definição das variáveis de entrada (nome, tipo, unidade, etc.)'
      },
      unidade_resultado: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Unidade do resultado da fórmula'
      },
      ativo: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      prioridade: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Prioridade da fórmula (maior número = maior prioridade)'
      },
      validacao_minima: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: true,
        comment: 'Valor mínimo válido para o resultado'
      },
      validacao_maxima: {
        type: Sequelize.DECIMAL(10, 4),
        allowNull: true,
        comment: 'Valor máximo válido para o resultado'
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
    await queryInterface.addIndex('formulas', ['produto_id']);
    await queryInterface.addIndex('formulas', ['maquina_id']);
    await queryInterface.addIndex('formulas', ['ativo']);
    await queryInterface.addIndex('formulas', ['prioridade']);
    
    // Índice composto para busca por produto e máquina
    await queryInterface.addIndex('formulas', ['produto_id', 'maquina_id']);
    
    // Constraint única para evitar fórmulas duplicadas
    await queryInterface.addConstraint('formulas', {
      fields: ['produto_id', 'maquina_id', 'nome'],
      type: 'unique',
      name: 'unique_formula_produto_maquina_nome'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('formulas');
  }
};