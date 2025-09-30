'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Orcamento = sequelize.define('Orcamento', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    numero_orcamento: {
      type: DataTypes.STRING(50),
      unique: true,
      allowNull: false
    },
    cliente_nome: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    cliente_email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true
      }
    },
    cliente_telefone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    cliente_endereco: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('rascunho', 'enviado', 'aprovado', 'rejeitado', 'expirado'),
      defaultValue: 'rascunho',
      allowNull: false
    },
    valor_total: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      allowNull: false
    },
    valor_desconto: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      allowNull: false
    },
    percentual_desconto: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00,
      allowNull: false
    },
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    data_orcamento: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    data_validade: {
      type: DataTypes.DATE,
      allowNull: true
    },
    vendedor_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'orcamentos',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (orcamento, options) => {
        if (!orcamento.numero_orcamento) {
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          orcamento.numero_orcamento = `ORC-${timestamp}-${random}`;
        }
      },
      beforeValidate: async (orcamento, options) => {
        if (!orcamento.numero_orcamento) {
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          orcamento.numero_orcamento = `ORC-${timestamp}-${random}`;
        }
      }
    }
  });

  Orcamento.associate = function(models) {
    // Associação com User (vendedor)
    Orcamento.belongsTo(models.User, {
      foreignKey: 'vendedor_id',
      as: 'vendedor'
    });

    // Associação com itens do orçamento
    Orcamento.hasMany(models.OrcamentoItem, {
      foreignKey: 'orcamento_id',
      as: 'itens',
      onDelete: 'CASCADE'
    });
  };

  return Orcamento;
};