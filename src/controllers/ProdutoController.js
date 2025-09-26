'use strict';

const { Produto, Formula } = require('../models');
const { Op } = require('sequelize');

class ProdutoController {
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

      const totalPages = Math.ceil(count / limit);

      res.json({
        success: true,
        data: {
          produtos: rows,
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
      console.error('Erro ao listar produtos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
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
            include: [
              {
                model: Produto,
                as: 'maquina',
                attributes: ['id', 'nome', 'tipo']
              }
            ]
          }
        ]
      });

      if (!produto) {
        return res.status(404).json({
          success: false,
          message: 'Produto não encontrado',
          error: 'PRODUCT_NOT_FOUND'
        });
      }

      res.json({
        success: true,
        data: {
          produto
        }
      });

    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Cria um novo produto
   */
  async store(req, res) {
    try {
      const produtoData = req.body;

      // Validação específica para acessórios
      if (produtoData.tipo === 'Acessório') {
        if (!produtoData.maquinas_compativeis || produtoData.maquinas_compativeis.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Acessórios devem ter pelo menos uma máquina compatível',
            error: 'MISSING_COMPATIBLE_MACHINES'
          });
        }

        // Verifica se as máquinas compatíveis existem
        const maquinasExistentes = await Produto.findAll({
          where: {
            id: { [Op.in]: produtoData.maquinas_compativeis },
            tipo: 'Máquina'
          },
          attributes: ['id']
        });

        if (maquinasExistentes.length !== produtoData.maquinas_compativeis.length) {
          return res.status(400).json({
            success: false,
            message: 'Uma ou mais máquinas compatíveis não existem',
            error: 'INVALID_COMPATIBLE_MACHINES'
          });
        }
      }

      const produto = await Produto.create(produtoData);

      res.status(201).json({
        success: true,
        message: 'Produto criado com sucesso',
        data: {
          produto
        }
      });

    } catch (error) {
      console.error('Erro ao criar produto:', error);

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

      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(409).json({
          success: false,
          message: 'Código interno já existe',
          error: 'DUPLICATE_CODE'
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
   * Atualiza um produto existente
   */
  async update(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const produto = await Produto.findByPk(id);

      if (!produto) {
        return res.status(404).json({
          success: false,
          message: 'Produto não encontrado',
          error: 'PRODUCT_NOT_FOUND'
        });
      }

      // Validação específica para mudança de tipo
      if (updateData.tipo && updateData.tipo !== produto.tipo) {
        if (updateData.tipo === 'Acessório' && (!updateData.maquinas_compativeis || updateData.maquinas_compativeis.length === 0)) {
          return res.status(400).json({
            success: false,
            message: 'Acessórios devem ter pelo menos uma máquina compatível',
            error: 'MISSING_COMPATIBLE_MACHINES'
          });
        }

        if (updateData.tipo === 'Máquina') {
          updateData.maquinas_compativeis = null;
        }
      }

      // Verifica máquinas compatíveis se fornecidas
      if (updateData.maquinas_compativeis && updateData.maquinas_compativeis.length > 0) {
        const maquinasExistentes = await Produto.findAll({
          where: {
            id: { [Op.in]: updateData.maquinas_compativeis },
            tipo: 'Máquina'
          },
          attributes: ['id']
        });

        if (maquinasExistentes.length !== updateData.maquinas_compativeis.length) {
          return res.status(400).json({
            success: false,
            message: 'Uma ou mais máquinas compatíveis não existem',
            error: 'INVALID_COMPATIBLE_MACHINES'
          });
        }
      }

      await produto.update(updateData);

      res.json({
        success: true,
        message: 'Produto atualizado com sucesso',
        data: {
          produto
        }
      });

    } catch (error) {
      console.error('Erro ao atualizar produto:', error);

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
   * Remove um produto
   */
  async destroy(req, res) {
    try {
      const { id } = req.params;

      const produto = await Produto.findByPk(id);

      if (!produto) {
        return res.status(404).json({
          success: false,
          message: 'Produto não encontrado',
          error: 'PRODUCT_NOT_FOUND'
        });
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
        return res.status(409).json({
          success: false,
          message: 'Não é possível excluir produto com fórmulas associadas',
          error: 'PRODUCT_HAS_FORMULAS',
          details: {
            formulas_count: formulasAssociadas
          }
        });
      }

      await produto.destroy();

      res.json({
        success: true,
        message: 'Produto removido com sucesso'
      });

    } catch (error) {
      console.error('Erro ao remover produto:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }

  /**
   * Lista apenas máquinas
   */
  async getMaquinas(req, res) {
    try {
      const maquinas = await Produto.findMaquinas();

      res.json({
        success: true,
        data: {
          maquinas
        }
      });

    } catch (error) {
      console.error('Erro ao listar máquinas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
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

      res.json({
        success: true,
        data: {
          acessorios
        }
      });

    } catch (error) {
      console.error('Erro ao listar acessórios:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
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

      res.json({
        success: true,
        data: {
          categorias: categoriasLista
        }
      });

    } catch (error) {
      console.error('Erro ao listar categorias:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  }
}

module.exports = new ProdutoController();