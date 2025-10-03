'use strict';

const BaseController = require('./BaseController');
const { Formula, Produto } = require('../models');
const FormulaCalculationService = require('../services/FormulaCalculationService');
const FormulaSearchService = require('../services/FormulaSearchService');
const ResponseService = require('../services/ResponseService');

class FormulaController extends BaseController {
  constructor() {
    super(Formula, 'formula', 'fórmula');
  }

  // Override do método index para usar o serviço de busca
  async index(req, res) {
    try {
      const resultado = await FormulaSearchService.buscarComFiltros(req.query);

      return ResponseService.success(res, resultado, 'Fórmulas listadas com sucesso');

    } catch (error) {
      return ResponseService.handleError(res, error, 'Listar fórmulas');
    }
  }

  // Override do método show para incluir produto
  async show(req, res) {
    try {
      const { id } = req.params;

      const formula = await Formula.findByPk(id, {
        include: [{
          model: Produto,
          as: 'produto',
          attributes: ['id', 'nome', 'codigo_interno']
        }]
      });

      if (!formula) {
        return ResponseService.notFound(res, 'Fórmula');
      }

      return ResponseService.item(res, formula, 'Fórmula encontrada com sucesso');

    } catch (error) {
      return ResponseService.handleError(res, error, 'Buscar fórmula');
    }
  }

  // Métodos específicos do FormulaController

  /**
   * Busca fórmulas por produto e máquina
   */
  async getByProdutoMaquina(req, res) {
    try {
      const { produto_id, maquina_id } = req.params;

      const formulas = await FormulaSearchService.buscarPorProdutoMaquina(produto_id, maquina_id);

      return ResponseService.success(res, { formulas }, 'Fórmulas encontradas com sucesso');

    } catch (error) {
      if (error.message.includes('obrigatórios')) {
        return ResponseService.validation(res, error.message);
      }

      return ResponseService.handleError(res, error, 'Buscar fórmulas por produto e máquina');
    }
  }

  /**
   * Calcula o resultado de uma fórmula
   */
  async calcular(req, res) {
    try {
      const { id } = req.params;
      const { variaveis } = req.body;

      const resultado = await FormulaCalculationService.calcularFormula(id, variaveis);

      return ResponseService.success(res, resultado, 'Cálculo realizado com sucesso');

    } catch (error) {
      if (error.message.includes('não encontrada')) {
        return ResponseService.notFound(res, 'Fórmula');
      }

      if (error.message.includes('inativa') || error.message.includes('obrigatórias')) {
        return ResponseService.validation(res, error.message);
      }

      return ResponseService.handleError(res, error, 'Calcular fórmula');
    }
  }

  /**
   * Testa uma fórmula sem salvá-la
   */
  async testarFormula(req, res) {
    try {
      const { formula, variaveis } = req.body;

      const resultado = FormulaCalculationService.testarFormula(formula, variaveis);

      return ResponseService.success(res, resultado, 'Teste da fórmula realizado com sucesso');

    } catch (error) {
      if (error.message.includes('obrigatórias')) {
        return ResponseService.validation(res, error.message);
      }

      return ResponseService.validation(res, error.message);
    }
  }
}

module.exports = new FormulaController();