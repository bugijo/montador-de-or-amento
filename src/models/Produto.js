'use strict';

module.exports = (sequelize, DataTypes) => {
  const Produto = sequelize.define('Produto', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nome: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Nome do produto é obrigatório'
        },
        len: {
          args: [2, 200],
          msg: 'Nome deve ter entre 2 e 200 caracteres'
        }
      }
    },
    descricao: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    foto_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'URL da foto deve ser válida'
        }
      }
    },
    tipo: {
      type: DataTypes.ENUM('Máquina', 'Acessório'),
      allowNull: false,
      validate: {
        isIn: {
          args: [['Máquina', 'Acessório']],
          msg: 'Tipo deve ser Máquina ou Acessório'
        }
      }
    },
    maquinas_compativeis: {
      type: DataTypes.ARRAY(DataTypes.INTEGER),
      allowNull: true,
      validate: {
        isValidForAccessory(value) {
          if (this.tipo === 'Acessório' && (!value || value.length === 0)) {
            throw new Error('Acessórios devem ter pelo menos uma máquina compatível');
          }
          if (this.tipo === 'Máquina' && value && value.length > 0) {
            throw new Error('Máquinas não devem ter máquinas compatíveis definidas');
          }
        }
      }
    },
    preco_base: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Preço base deve ser maior ou igual a zero'
        }
      }
    },
    unidade_medida: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isIn: {
          args: [['unidade', 'm2', 'm', 'kg', 'litro', 'caixa', 'pacote']],
          msg: 'Unidade de medida inválida'
        }
      }
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    codigo_interno: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: {
        msg: 'Código interno já existe'
      },
      validate: {
        len: {
          args: [1, 50],
          msg: 'Código interno deve ter entre 1 e 50 caracteres'
        }
      }
    },
    categoria: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    peso: {
      type: DataTypes.DECIMAL(8, 3),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Peso deve ser maior ou igual a zero'
        }
      }
    },
    dimensoes: {
      type: DataTypes.JSONB,
      allowNull: true,
      validate: {
        isValidDimensions(value) {
          if (value) {
            const required = ['largura', 'altura', 'profundidade'];
            const hasAllRequired = required.every(key => 
              value.hasOwnProperty(key) && typeof value[key] === 'number' && value[key] > 0
            );
            if (!hasAllRequired) {
              throw new Error('Dimensões devem conter largura, altura e profundidade como números positivos');
            }
          }
        }
      }
    },
    especificacoes_tecnicas: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'produtos',
    underscored: true,
    indexes: [
      { fields: ['tipo'] },
      { fields: ['ativo'] },
      { fields: ['categoria'] },
      { fields: ['codigo_interno'] },
      { fields: ['nome'] }
    ],
    scopes: {
      active: {
        where: { ativo: true }
      },
      maquinas: {
        where: { tipo: 'Máquina' }
      },
      acessorios: {
        where: { tipo: 'Acessório' }
      },
      byCategoria: (categoria) => ({
        where: { categoria }
      })
    }
  });

  // Métodos de instância
  Produto.prototype.isMaquina = function() {
    return this.tipo === 'Máquina';
  };

  Produto.prototype.isAcessorio = function() {
    return this.tipo === 'Acessório';
  };

  Produto.prototype.getVolume = function() {
    if (this.dimensoes) {
      const { largura, altura, profundidade } = this.dimensoes;
      return largura * altura * profundidade;
    }
    return null;
  };

  Produto.prototype.isCompativelCom = function(maquinaId) {
    if (this.tipo === 'Acessório' && this.maquinas_compativeis) {
      return this.maquinas_compativeis.includes(maquinaId);
    }
    return false;
  };

  // Métodos estáticos
  Produto.findMaquinas = async function() {
    return await this.scope('active', 'maquinas').findAll();
  };

  Produto.findAcessorios = async function() {
    return await this.scope('active', 'acessorios').findAll();
  };

  Produto.findByCategoria = async function(categoria) {
    return await this.scope('active').findAll({
      where: { categoria }
    });
  };

  Produto.findAcessoriosCompativeis = async function(maquinaId) {
    return await this.scope('active', 'acessorios').findAll({
      where: sequelize.literal(`maquinas_compativeis @> ARRAY[${maquinaId}]`)
    });
  };

  // Associações
  Produto.associate = function(models) {
    // Produto (acessório) tem muitas fórmulas
    Produto.hasMany(models.Formula, {
      foreignKey: 'produto_id',
      as: 'formulas'
    });

    // Produto (máquina) tem muitas fórmulas
    Produto.hasMany(models.Formula, {
      foreignKey: 'maquina_id',
      as: 'formulas_maquina'
    });
  };

  return Produto;
};