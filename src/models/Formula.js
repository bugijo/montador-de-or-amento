'use strict';

module.exports = (sequelize, DataTypes) => {
  const Formula = sequelize.define('Formula', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    produto_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'produtos',
        key: 'id'
      },
      validate: {
        notEmpty: {
          msg: 'ID do produto é obrigatório'
        }
      }
    },
    maquina_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'produtos',
        key: 'id'
      },
      validate: {
        notEmpty: {
          msg: 'ID da máquina é obrigatório'
        }
      }
    },
    formula: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Fórmula é obrigatória'
        },
        isValidFormula(value) {
          // Validação básica da fórmula
          const allowedChars = /^[0-9+\-*/().\s\w]+$/;
          if (!allowedChars.test(value)) {
            throw new Error('Fórmula contém caracteres inválidos');
          }
          
          // Verifica se contém pelo menos uma variável comum
          const commonVars = ['m2', 'quantidade', 'area', 'comprimento', 'largura', 'altura'];
          const hasVariable = commonVars.some(variable => value.includes(variable));
          if (!hasVariable) {
            throw new Error('Fórmula deve conter pelo menos uma variável válida');
          }
        }
      }
    },
    nome: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'Nome da fórmula é obrigatório'
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
    variaveis_entrada: {
      type: DataTypes.JSONB,
      allowNull: true,
      validate: {
        isValidVariables(value) {
          if (value) {
            if (!Array.isArray(value)) {
              throw new Error('Variáveis de entrada devem ser um array');
            }
            
            for (const variable of value) {
              if (!variable.nome || !variable.tipo) {
                throw new Error('Cada variável deve ter nome e tipo');
              }
              
              const validTypes = ['number', 'decimal', 'integer'];
              if (!validTypes.includes(variable.tipo)) {
                throw new Error('Tipo de variável inválido');
              }
            }
          }
        }
      }
    },
    unidade_resultado: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        isIn: {
          args: [['unidade', 'm2', 'm', 'kg', 'litro', 'caixa', 'pacote', 'peça']],
          msg: 'Unidade de resultado inválida'
        }
      }
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    prioridade: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: {
        min: {
          args: [1],
          msg: 'Prioridade deve ser maior que zero'
        },
        max: {
          args: [100],
          msg: 'Prioridade deve ser menor ou igual a 100'
        }
      }
    },
    validacao_minima: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Validação mínima deve ser maior ou igual a zero'
        }
      }
    },
    validacao_maxima: {
      type: DataTypes.DECIMAL(10, 4),
      allowNull: true,
      validate: {
        min: {
          args: [0],
          msg: 'Validação máxima deve ser maior ou igual a zero'
        },
        isGreaterThanMin(value) {
          if (value && this.validacao_minima && value <= this.validacao_minima) {
            throw new Error('Validação máxima deve ser maior que a mínima');
          }
        }
      }
    }
  }, {
    tableName: 'formulas',
    underscored: true,
    indexes: [
      { fields: ['produto_id'] },
      { fields: ['maquina_id'] },
      { fields: ['ativo'] },
      { fields: ['prioridade'] },
      { fields: ['produto_id', 'maquina_id'] }
    ],
    scopes: {
      active: {
        where: { ativo: true }
      },
      byPrioridade: {
        order: [['prioridade', 'DESC']]
      },
      byProduto: (produtoId) => ({
        where: { produto_id: produtoId }
      }),
      byMaquina: (maquinaId) => ({
        where: { maquina_id: maquinaId }
      })
    }
  });

  // Métodos de instância
  Formula.prototype.calcular = function(variaveis) {
    try {
      let formula = this.formula;
      
      // Substitui as variáveis na fórmula
      Object.keys(variaveis).forEach(variavel => {
        const regex = new RegExp(`\\b${variavel}\\b`, 'g');
        formula = formula.replace(regex, variaveis[variavel]);
      });
      
      // Avalia a fórmula (ATENÇÃO: Em produção, usar uma biblioteca segura como math.js)
      const resultado = eval(formula);
      
      // Valida o resultado
      if (this.validacao_minima && resultado < this.validacao_minima) {
        throw new Error(`Resultado ${resultado} é menor que o mínimo permitido ${this.validacao_minima}`);
      }
      
      if (this.validacao_maxima && resultado > this.validacao_maxima) {
        throw new Error(`Resultado ${resultado} é maior que o máximo permitido ${this.validacao_maxima}`);
      }
      
      return {
        resultado: parseFloat(resultado.toFixed(4)),
        unidade: this.unidade_resultado,
        formula_usada: this.formula,
        variaveis_usadas: variaveis
      };
      
    } catch (error) {
      throw new Error(`Erro no cálculo da fórmula: ${error.message}`);
    }
  };

  Formula.prototype.validarVariaveis = function(variaveis) {
    if (!this.variaveis_entrada) return true;
    
    for (const variavel of this.variaveis_entrada) {
      if (variavel.obrigatorio && !variaveis.hasOwnProperty(variavel.nome)) {
        throw new Error(`Variável obrigatória '${variavel.nome}' não fornecida`);
      }
      
      if (variaveis[variavel.nome] !== undefined) {
        const valor = variaveis[variavel.nome];
        
        if (variavel.tipo === 'integer' && !Number.isInteger(valor)) {
          throw new Error(`Variável '${variavel.nome}' deve ser um número inteiro`);
        }
        
        if ((variavel.tipo === 'number' || variavel.tipo === 'decimal') && typeof valor !== 'number') {
          throw new Error(`Variável '${variavel.nome}' deve ser um número`);
        }
        
        if (variavel.minimo && valor < variavel.minimo) {
          throw new Error(`Variável '${variavel.nome}' deve ser maior ou igual a ${variavel.minimo}`);
        }
        
        if (variavel.maximo && valor > variavel.maximo) {
          throw new Error(`Variável '${variavel.nome}' deve ser menor ou igual a ${variavel.maximo}`);
        }
      }
    }
    
    return true;
  };

  // Métodos estáticos
  Formula.findByProdutoMaquina = async function(produtoId, maquinaId) {
    return await this.scope('active', 'byPrioridade').findAll({
      where: {
        produto_id: produtoId,
        maquina_id: maquinaId
      }
    });
  };

  Formula.findMelhorFormula = async function(produtoId, maquinaId) {
    return await this.scope('active').findOne({
      where: {
        produto_id: produtoId,
        maquina_id: maquinaId
      },
      order: [['prioridade', 'DESC']]
    });
  };

  // Associações
  Formula.associate = function(models) {
    // Formula pertence a um produto (acessório)
    Formula.belongsTo(models.Produto, {
      foreignKey: 'produto_id',
      as: 'produto'
    });

    // Formula pertence a uma máquina
    Formula.belongsTo(models.Produto, {
      foreignKey: 'maquina_id',
      as: 'maquina'
    });
  };

  return Formula;
};