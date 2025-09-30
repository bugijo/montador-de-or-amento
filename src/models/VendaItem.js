'use strict';

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const VendaItem = sequelize.define('VendaItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    venda_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'vendas',
        key: 'id'
      }
    },
    produto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'Produtos',
        key: 'id'
      }
    },
    quantidade: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: 1
      }
    },
    preco_unitario: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    preco_total: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      validate: {
        min: 0
      }
    },
    desconto_percentual: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.00,
      allowNull: false,
      validate: {
        min: 0,
        max: 100
      }
    },
    desconto_valor: {
      type: DataTypes.DECIMAL(15, 2),
      defaultValue: 0.00,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    observacoes: {
      type: DataTypes.TEXT,
      allowNull: true
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
    tableName: 'venda_itens',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    hooks: {
      beforeSave: (item) => {
        // Calcula o preço total baseado na quantidade e preço unitário
        const precoComDesconto = item.preco_unitario - item.desconto_valor;
        item.preco_total = precoComDesconto * item.quantidade;
      }
    }
  });

  VendaItem.associate = function(models) {
    // Associação com Venda
    VendaItem.belongsTo(models.Venda, {
      foreignKey: 'venda_id',
      as: 'venda'
    });

    // Associação com Produto
    VendaItem.belongsTo(models.Produto, {
      foreignKey: 'produto_id',
      as: 'produto'
    });
  };

  return VendaItem;
};