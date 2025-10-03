'use strict';

const { Formula, Produto } = require('../models');
const { Op } = require('sequelize');

class FormulaSearchService {
  /**
   * Busca fórmulas por produto e máquina
   */
  async buscarPorProdutoMaquina(produtoId, maquinaId) {
    if (!produtoId || !maquinaId) {
      throw new Error('Produto ID e máquina ID são obrigatórios');
    }

    const formulas = await Formula.findAll({
      where: {
        produto_id: produtoId,
        maquina_id: maquinaId,
        ativo: true
      },
      include: [{
        model: Produto,
        as: 'produto',
        attributes: ['id', 'nome', 'codigo_interno']
      }],
      order: [['created_at', 'DESC']]
    });

    return formulas;
  }

  /**
   * Busca fórmulas com filtros avançados
   */
  async buscarComFiltros(filtros = {}) {
    const {
      produto_id,
      maquina_id,
      ativo,
      busca,
      page = 1,
      limit = 10
    } = filtros;

    const where = {};
    
    // Filtros específicos
    if (produto_id) {
      where.produto_id = produto_id;
    }
    
    if (maquina_id) {
      where.maquina_id = maquina_id;
    }
    
    if (ativo !== undefined) {
      where.ativo = ativo;
    }
    
    // Busca textual
    if (busca) {
      where[Op.or] = [
        { nome: { [Op.iLike]: `%${busca}%` } },
        { descricao: { [Op.iLike]: `%${busca}%` } },
        { formula: { [Op.iLike]: `%${busca}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Formula.findAndCountAll({
      where,
      include: [{
        model: Produto,
        as: 'produto',
        attributes: ['id', 'nome', 'codigo_interno']
      }],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['created_at', 'DESC']]
    });

    return {
      formulas: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Busca fórmulas ativas por produto
   */
  async buscarAtivasPorProduto(produtoId) {
    if (!produtoId) {
      throw new Error('Produto ID é obrigatório');
    }

    const formulas = await Formula.findAll({
      where: {
        produto_id: produtoId,
        ativo: true
      },
      include: [{
        model: Produto,
        as: 'produto',
        attributes: ['id', 'nome', 'codigo_interno']
      }],
      order: [['maquina', 'ASC'], ['created_at', 'DESC']]
    });

    return formulas;
  }
}

module.exports = new FormulaSearchService();