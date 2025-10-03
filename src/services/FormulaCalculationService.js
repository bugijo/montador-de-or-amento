'use strict';

const { Formula } = require('../models');

class FormulaCalculationService {
  /**
   * Calcula o resultado de uma fórmula
   */
  async calcularFormula(formulaId, variaveis) {
    if (!variaveis || typeof variaveis !== 'object') {
      throw new Error('Variáveis são obrigatórias e devem ser um objeto');
    }

    const formula = await Formula.findByPk(formulaId);

    if (!formula) {
      throw new Error('Fórmula não encontrada');
    }

    if (!formula.ativo) {
      throw new Error('Fórmula está inativa');
    }

    // Valida as variáveis de entrada
    formula.validarVariaveis(variaveis);

    // Calcula o resultado
    const resultado = formula.calcular(variaveis);

    return {
      formula_id: formula.id,
      formula_nome: formula.nome,
      ...resultado
    };
  }

  /**
   * Testa uma fórmula sem salvá-la
   */
  testarFormula(formulaString, variaveis) {
    if (!formulaString || !variaveis) {
      throw new Error('Fórmula e variáveis são obrigatórias');
    }

    // Cria uma instância temporária da fórmula para teste
    const formulaTemp = {
      formula: formulaString,
      calcular: Formula.prototype.calcular
    };

    const resultado = formulaTemp.calcular(variaveis);

    return {
      formula_testada: formulaString,
      ...resultado
    };
  }

  /**
   * Valida se uma fórmula é válida
   */
  validarFormula(formulaString, variaveisExemplo = {}) {
    try {
      this.testarFormula(formulaString, variaveisExemplo);
      return { valida: true };
    } catch (error) {
      return { 
        valida: false, 
        erro: error.message 
      };
    }
  }
}

module.exports = new FormulaCalculationService();