'use strict';

const BaseController = require('./BaseController');
const { Produto, Formula } = require('../models');
const { Op } = require('sequelize');
const ResponseService = require('../services/ResponseService');

class ProdutoController extends BaseController {
  constructor() {
    super(Produto, 'produto', 'produtos');
  }
  /**
   * Lista todos os produtos com paginação e filtros
   */
  async index(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'id',
        order = 'ASC',
        tipo,
        categoria,
        ativo,
        search
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Filtros
      if (tipo) where.tipo = tipo;
      if (categoria) where.categoria = categoria;
      if (ativo !== undefined) where.ativo = ativo === 'true';

      // Busca por nome ou descrição
      if (search) {
        where[Op.or] = [
          { nome: { [Op.iLike]: `%${search}%` } },
          { descricao: { [Op.iLike]: `%${search}%` } },
          { codigo_interno: { [Op.iLike]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Produto.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sort, order.toUpperCase()]],
        include: [
          {
            model: Formula,
            as: 'formulas',
            attributes: ['id', 'nome', 'maquina_id'],
            required: false
          }
        ]
      });

      const pagination = {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit),
        hasNextPage: page * limit < count,
        hasPreviousPage: page > 1
      };

      return ResponseService.paginated(res, rows, pagination, 'Produtos encontrados com sucesso');

    } catch (error) {
      return ResponseService.handleError(res, error, 'Listar produtos');
    }
  }

  /**
   * Busca um produto específico por ID
   */
  async show(req, res) {
    try {
      const { id } = req.params;

      const produto = await Produto.findByPk(id, {
        include: [
          {
            model: Formula,
            as: 'formulas',
            attributes: ['id', 'nome', 'maquina_id'],
            required: false
          }
        ]
      });

      if (!produto) {
        return ResponseService.notFound(res, 'Produto');
      }

      return ResponseService.item(res, produto, 'Produto encontrado com sucesso');

    } catch (error) {
      return ResponseService.handleError(res, error, 'Buscar produto');
    }
  }

  /**
   * Sobrescreve o método destroy para verificar fórmulas associadas
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;

      const produto = await Produto.findByPk(id);

      if (!produto) {
        return ResponseService.notFound(res, 'Produto');
      }

      // Verifica se existem fórmulas associadas
      const formulasAssociadas = await Formula.count({
        where: {
          [Op.or]: [
            { produto_id: id },
            { maquina_id: id }
          ]
        }
      });

      if (formulasAssociadas > 0) {
        return ResponseService.conflict(res, 'Não é possível excluir produto com fórmulas associadas', {
          formulas_count: formulasAssociadas
        });
      }

      await produto.destroy();

      return ResponseService.deleted(res, 'Produto removido com sucesso');

    } catch (error) {
      return ResponseService.handleError(res, error, 'Remover produto');
    }
  }

  /**
   * Lista apenas máquinas
   */
  async getMaquinas(req, res) {
    try {
      const maquinas = await Produto.findMaquinas();

      return ResponseService.list(res, maquinas, 'Máquinas encontradas com sucesso');

    } catch (error) {
      return ResponseService.handleError(res, error, 'Listar máquinas');
    }
  }

  /**
   * Lista apenas acessórios
   */
  async getAcessorios(req, res) {
    try {
      const { maquina_id } = req.query;

      let acessorios;
      if (maquina_id) {
        acessorios = await Produto.findAcessoriosCompativeis(maquina_id);
      } else {
        acessorios = await Produto.findAcessorios();
      }

      return ResponseService.list(res, acessorios, 'Acessórios encontrados com sucesso');

    } catch (error) {
      return ResponseService.handleError(res, error, 'Listar acessórios');
    }
  }

  /**
   * Lista categorias disponíveis
   */
  async getCategorias(req, res) {
    try {
      const categorias = await Produto.findAll({
        attributes: ['categoria'],
        where: {
          categoria: { [Op.not]: null },
          ativo: true
        },
        group: ['categoria'],
        order: [['categoria', 'ASC']]
      });

      const categoriasLista = categorias.map(p => p.categoria).filter(Boolean);

      return ResponseService.list(res, categoriasLista, 'Categorias encontradas com sucesso');

    } catch (error) {
      return ResponseService.handleError(res, error, 'Listar categorias');
    }
  }
}

module.exports = new ProdutoController();