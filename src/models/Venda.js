'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Venda = sequelize.define('Venda', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    numero_venda: {
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
      type: DataTypes.ENUM('rascunho', 'enviado', 'aprovado', 'rejeitado', 'finalizado'),
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
    data_venda: {
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
    tableName: 'vendas',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeCreate: async (venda, options) => {
        if (!venda.numero_venda) {
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          venda.numero_venda = `VND-${timestamp}-${random}`;
        }
      },
      beforeValidate: async (venda, options) => {
        if (!venda.numero_venda) {
          const timestamp = Date.now();
          const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
          venda.numero_venda = `VND-${timestamp}-${random}`;
        }
      }
    }
  });

  Venda.associate = function(models) {
    // Associação com User (vendedor)
    Venda.belongsTo(models.User, {
      foreignKey: 'vendedor_id',
      as: 'vendedor'
    });

    // Associação com itens da venda
    Venda.hasMany(models.VendaItem, {
      foreignKey: 'venda_id',
      as: 'itens',
      onDelete: 'CASCADE'
    });
  };

  return Venda;
};