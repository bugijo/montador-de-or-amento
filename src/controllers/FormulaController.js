'use strict';

const { Formula, Produto } = require('../models');
const { Op } = require('sequelize');

class FormulaController {
  /**
   * Lista todas as fórmulas com paginação e filtros
   */
  async index(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'prioridade',
        order = 'DESC',
        produto_id,
        maquina_id,
        ativo,
        search
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Filtros
      if (produto_id) where.produto_id = produto_id;
      if (maquina_id) where.maquina_id = maquina_id;
      if (ativo !== undefined) where.ativo = ativo === 'true';

      // Busca por nome ou descrição
      if (search) {
        where[Op.or] = [
          { nome: { [Op.iLike]: `%${search}%` } },
          { descricao: { [Op.iLike]: `%${search}%` } },
          { formula: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Formula.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sort, order.toUpperCase()]],
        include: [
          {
            model: Produto,
            as: 'produto',
            attributes: ['id', 'nome', 'tipo']
          },
          {
            model: Produto,
            as: 'maquina',
            attributes: ['id', 'nome', 'tipo']
          }
        ]
      });

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: {
          formulas: rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: totalPages,
            total_items: count,
            items_per_page: parseInt(limit),
            has_next: page < totalPages,
            has_prev: page > 1
          }
        }
      });

    } catch (error) {
      console.error('Erro ao listar fórmulas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Busca uma fórmula específica por ID
   */
  async show(req, res) {
    try {
      const { id } = req.params;

      const formula = await Formula.findByPk(id, {
        include: [
          {
            model: Produto,
            as: 'produto',
            attributes: ['id', 'nome', 'tipo', 'unidade_medida']
          },
          {
            model: Produto,
            as: 'maquina',
            attributes: ['id', 'nome', 'tipo']
          }
        ]
      });

      if (!formula) {
        return res.status(404).json({
          success: false,
          message: 'Fórmula não encontrada',
          error: 'FORMULA_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: {
          formula
        }
      });

    } catch (error) {
      console.error('Erro ao buscar fórmula:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Cria uma nova fórmula
   */
  async store(req, res) {
    try {
      const formulaData = req.body;

      // Verifica se o produto existe e é um acessório
      const produto = await Produto.findByPk(formulaData.produto_id);
      if (!produto) {
        return res.status(400).json({
          success: false,
          message: 'Produto não encontrado',
          error: 'PRODUCT_NOT_FOUND'
        });
      }

      if (produto.tipo !== 'Acessório') {
        return res.status(400).json({
          success: false,
          message: 'Fórmulas só podem ser criadas para acessórios',
          error: 'INVALID_PRODUCT_TYPE'
        });
      }

      // Verifica se a máquina existe
      const maquina = await Produto.findByPk(formulaData.maquina_id);
      if (!maquina) {
        return res.status(400).json({
          success: false,
          message: 'Máquina não encontrada',
          error: 'MACHINE_NOT_FOUND'
        });
      }

      if (maquina.tipo !== 'Máquina') {
        return res.status(400).json({
          success: false,
          message: 'O ID da máquina deve referenciar um produto do tipo Máquina',
          error: 'INVALID_MACHINE_TYPE'
        });
      }

      // Verifica se o acessório é compatível com a máquina
      if (!produto.isCompativelCom(maquina.id)) {
        return res.status(400).json({
          success: false,
          message: 'Acessório não é compatível com a máquina especificada',
          error: 'INCOMPATIBLE_MACHINE'
        });
      }

      // Verifica se já existe uma fórmula com o mesmo nome para esta combinação
      const formulaExistente = await Formula.findOne({
        where: {
          produto_id: formulaData.produto_id,
          maquina_id: formulaData.maquina_id,
          nome: formulaData.nome
        }
      });

      if (formulaExistente) {
        return res.status(409).json({
          success: false,
          message: 'Já existe uma fórmula com este nome para esta combinação produto/máquina',
          error: 'DUPLICATE_FORMULA_NAME'
        });
      }

      const formula = await Formula.create(formulaData);

      // Busca a fórmula criada com os relacionamentos
      const formulaCompleta = await Formula.findByPk(formula.id, {
        include: [
          {
            model: Produto,
            as: 'produto',
            attributes: ['id', 'nome', 'tipo']
          },
          {
            model: Produto,
            as: 'maquina',
            attributes: ['id', 'nome', 'tipo']
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Fórmula criada com sucesso',
        data: {
          formula: formulaCompleta
        }
      });

    } catch (error) {
      console.error('Erro ao criar fórmula:', error);

      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Dados de entrada inválidos',
          error: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            field: err.path,
            message: err.message
          }))
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Atualiza uma fórmula existente
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const formula = await Formula.findByPk(id);

      if (!formula) {
        return res.status(404).json({
          success: false,
          message: 'Fórmula não encontrada',
          error: 'FORMULA_NOT_FOUND'
        });
      }

      // Validações se produto_id ou maquina_id estão sendo alterados
      if (updateData.produto_id && updateData.produto_id !== formula.produto_id) {
        const produto = await Produto.findByPk(updateData.produto_id);
        if (!produto || produto.tipo !== 'Acessório') {
          return res.status(400).json({
            success: false,
            message: 'Produto deve ser um acessório válido',
            error: 'INVALID_PRODUCT'
          });
        }
      }

      if (updateData.maquina_id && updateData.maquina_id !== formula.maquina_id) {
        const maquina = await Produto.findByPk(updateData.maquina_id);
        if (!maquina || maquina.tipo !== 'Máquina') {
          return res.status(400).json({
            success: false,
            message: 'Máquina deve ser um produto do tipo Máquina válido',
            error: 'INVALID_MACHINE'
          });
        }
      }

      // Verifica duplicação de nome se o nome está sendo alterado
      if (updateData.nome && updateData.nome !== formula.nome) {
        const formulaExistente = await Formula.findOne({
          where: {
            produto_id: updateData.produto_id || formula.produto_id,
            maquina_id: updateData.maquina_id || formula.maquina_id,
            nome: updateData.nome,
            id: { [Op.ne]: id }
          }
        });

        if (formulaExistente) {
          return res.status(409).json({
            success: false,
            message: 'Já existe uma fórmula com este nome para esta combinação produto/máquina',
            error: 'DUPLICATE_FORMULA_NAME'
          });
        }
      }

      await formula.update(updateData);

      // Busca a fórmula atualizada com os relacionamentos
      const formulaAtualizada = await Formula.findByPk(id, {
        include: [
          {
            model: Produto,
            as: 'produto',
            attributes: ['id', 'nome', 'tipo']
          },
          {
            model: Produto,
            as: 'maquina',
            attributes: ['id', 'nome', 'tipo']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Fórmula atualizada com sucesso',
        data: {
          formula: formulaAtualizada
        }
      });

    } catch (error) {
      console.error('Erro ao atualizar fórmula:', error);

      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Dados de entrada inválidos',
          error: 'VALIDATION_ERROR',
          details: error.errors.map(err => ({
            field: err.path,
            message: err.message
          }))
        });
      }

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Remove uma fórmula
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;

      const formula = await Formula.findByPk(id);

      if (!formula) {
        return res.status(404).json({
          success: false,
          message: 'Fórmula não encontrada',
          error: 'FORMULA_NOT_FOUND'
        });
      }

      await formula.destroy();

      res.json({
        success: true,
        message: 'Fórmula removida com sucesso'
      });

    } catch (error) {
      console.error('Erro ao remover fórmula:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Busca fórmulas por produto e máquina
   */
  async getByProdutoMaquina(req, res) {
    try {
      const { produto_id, maquina_id } = req.params;

      const formulas = await Formula.findByProdutoMaquina(produto_id, maquina_id);

      res.json({
        success: true,
        data: {
          formulas
        }
      });

    } catch (error) {
      console.error('Erro ao buscar fórmulas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Calcula o resultado de uma fórmula
   */
  async calcular(req, res) {
    try {
      const { id } = req.params;
      const { variaveis } = req.body;

      if (!variaveis || typeof variaveis !== 'object') {
        return res.status(400).json({
          success: false,
          message: 'Variáveis são obrigatórias e devem ser um objeto',
          error: 'MISSING_VARIABLES'
        });
      }

      const formula = await Formula.findByPk(id);

      if (!formula) {
        return res.status(404).json({
          success: false,
          message: 'Fórmula não encontrada',
          error: 'FORMULA_NOT_FOUND'
        });
      }

      if (!formula.ativo) {
        return res.status(400).json({
          success: false,
          message: 'Fórmula está inativa',
          error: 'FORMULA_INACTIVE'
        });
      }

      // Valida as variáveis de entrada
      try {
        formula.validarVariaveis(variaveis);
      } catch (validationError) {
        return res.status(400).json({
          success: false,
          message: validationError.message,
          error: 'VARIABLE_VALIDATION_ERROR'
        });
      }

      // Calcula o resultado
      try {
        const resultado = formula.calcular(variaveis);

        res.json({
          success: true,
          message: 'Cálculo realizado com sucesso',
          data: {
            formula_id: formula.id,
            formula_nome: formula.nome,
            ...resultado
          }
        });

      } catch (calculationError) {
        return res.status(400).json({
          success: false,
          message: calculationError.message,
          error: 'CALCULATION_ERROR'
        });
      }

    } catch (error) {
      console.error('Erro ao calcular fórmula:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Testa uma fórmula sem salvá-la
   */
  async testarFormula(req, res) {
    try {
      const { formula, variaveis } = req.body;

      if (!formula || !variaveis) {
        return res.status(400).json({
          success: false,
          message: 'Fórmula e variáveis são obrigatórias',
          error: 'MISSING_FORMULA_OR_VARIABLES'
        });
      }

      try {
        // Cria uma instância temporária da fórmula para teste
        const formulaTemp = {
          formula,
          calcular: Formula.prototype.calcular
        };

        const resultado = formulaTemp.calcular(variaveis);

        res.json({
          success: true,
          message: 'Teste da fórmula realizado com sucesso',
          data: {
            formula_testada: formula,
            ...resultado
          }
        });

      } catch (calculationError) {
        return res.status(400).json({
          success: false,
          message: calculationError.message,
          error: 'FORMULA_TEST_ERROR'
        });
      }

    } catch (error) {
      console.error('Erro ao testar fórmula:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
}

module.exports = new FormulaController();