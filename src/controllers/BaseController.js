'use strict';

const { Op } = require('sequelize');
const ResponseService = require('../services/ResponseService');

/**
 * Classe base para controllers que seguem o padrão CRUD com itens relacionados
 * Elimina duplicação de código entre VendaController e OrcamentoController
 */
class BaseController {
  constructor(config) {
    this.Model = config.Model;
    this.ItemModel = config.ItemModel;
    this.ProdutoModel = config.ProdutoModel;
    this.UserModel = config.UserModel;
    this.modelName = config.modelName;
    this.itemModelName = config.itemModelName;
    this.foreignKey = config.foreignKey;
    this.dateField = config.dateField;
  }

  /**
   * Lista todos os registros com paginação e filtros
   */
  async index(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        sort = 'id',
        order = 'DESC',
        status,
        cliente,
        vendedor_id,
        data_inicio,
        data_fim
      } = req.query;

      const offset = (page - 1) * limit;
      const where = {};

      // Filtros
      if (status) where.status = status;
      if (cliente) {
        where.cliente_nome = { [Op.iLike]: `%${cliente}%` };
      }
      if (vendedor_id) where.vendedor_id = vendedor_id;
      
      // Filtro por data
      if (data_inicio && data_fim) {
        where[this.dateField] = {
          [Op.between]: [new Date(data_inicio), new Date(data_fim)]
        };
      }

      const { count, rows } = await this.Model.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sort, order.toUpperCase()]],
        include: [
          {
            model: this.UserModel,
            as: 'vendedor',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: this.ItemModel,
            as: 'itens',
            include: [
              {
                model: this.ProdutoModel,
                as: 'produto',
                attributes: ['id', 'nome', 'codigo_interno', 'tipo']
              }
            ]
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

      return ResponseService.paginated(res, rows, pagination, `${this.modelName.charAt(0).toUpperCase() + this.modelName.slice(1)}s encontrados com sucesso`);
    } catch (error) {
      return ResponseService.handleError(res, error, `Listar ${this.modelName}s`);
    }
  }

  /**
   * Busca um registro específico por ID
   */
  async show(req, res) {
    try {
      const { id } = req.params;

      const record = await this.Model.findByPk(id, {
        include: [
          {
            model: this.UserModel,
            as: 'vendedor',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: this.ItemModel,
            as: 'itens',
            include: [
              {
                model: this.ProdutoModel,
                as: 'produto',
                attributes: ['id', 'nome', 'codigo_interno', 'tipo', 'preco_base']
              }
            ]
          }
        ]
      });

      if (!record) {
        return ResponseService.notFound(res, this.modelName.charAt(0).toUpperCase() + this.modelName.slice(1));
      }

      return ResponseService.item(res, record, `${this.modelName.charAt(0).toUpperCase() + this.modelName.slice(1)} encontrado com sucesso`);
    } catch (error) {
      return ResponseService.handleError(res, error, `Buscar ${this.modelName}`);
    }
  }

  /**
   * Cria um novo registro
   */
  async store(req, res) {
    const transaction = await this.Model.sequelize.transaction();
    
    try {
      const {
        cliente_nome,
        cliente_email,
        cliente_telefone,
        cliente_endereco,
        observacoes,
        data_validade,
        itens = []
      } = req.body;

      // Cria o registro principal
      const record = await this.Model.create({
        cliente_nome,
        cliente_email,
        cliente_telefone,
        cliente_endereco,
        observacoes,
        data_validade,
        vendedor_id: req.user.id
      }, { transaction });

      let valorTotal = 0;

      // Cria os itens
      for (const item of itens) {
        const produto = await this.ProdutoModel.findByPk(item.produto_id);
        if (!produto) {
          throw new Error(`Produto com ID ${item.produto_id} não encontrado`);
        }

        const precoUnitario = item.preco_unitario || produto.preco_base;
        const descontoValor = item.desconto_valor || 0;
        const precoTotal = (precoUnitario - descontoValor) * item.quantidade;

        const itemData = {
          [this.foreignKey]: record.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: precoUnitario,
          desconto_valor: descontoValor,
          preco_total: precoTotal,
          observacoes: item.observacoes
        };

        await this.ItemModel.create(itemData, { transaction });
        valorTotal += precoTotal;
      }

      // Atualiza o valor total
      await record.update({ valor_total: valorTotal }, { transaction });

      await transaction.commit();

      // Busca o registro criado com todos os relacionamentos
      const recordCriado = await this.Model.findByPk(record.id, {
        include: [
          {
            model: this.UserModel,
            as: 'vendedor',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: this.ItemModel,
            as: 'itens',
            include: [
              {
                model: this.ProdutoModel,
                as: 'produto',
                attributes: ['id', 'nome', 'codigo_interno', 'tipo']
              }
            ]
          }
        ]
      });

      return ResponseService.created(res, recordCriado, `${this.modelName.charAt(0).toUpperCase() + this.modelName.slice(1)} criado com sucesso`);
    } catch (error) {
      await transaction.rollback();
      return ResponseService.handleError(res, error, `Criar ${this.modelName}`);
    }
  }

  /**
   * Atualiza um registro existente
   */
  async update(req, res) {
    const transaction = await this.Model.sequelize.transaction();
    
    try {
      const { id } = req.params;
      const {
        cliente_nome,
        cliente_email,
        cliente_telefone,
        cliente_endereco,
        observacoes,
        data_validade,
        itens = []
      } = req.body;

      const record = await this.Model.findByPk(id);
      if (!record) {
        return ResponseService.notFound(res, this.modelName.charAt(0).toUpperCase() + this.modelName.slice(1));
      }

      // Verifica se o usuário pode editar este registro
      if (req.user.role !== 'admin' && record.vendedor_id !== req.user.id) {
        return ResponseService.forbidden(res, `Sem permissão para editar este ${this.modelName}`);
      }

      // Atualiza os dados do registro
      await record.update({
        cliente_nome,
        cliente_email,
        cliente_telefone,
        cliente_endereco,
        observacoes,
        data_validade
      }, { transaction });

      // Remove itens existentes
      await this.ItemModel.destroy({
        where: { [this.foreignKey]: id },
        transaction
      });

      let valorTotal = 0;

      // Cria os novos itens
      for (const item of itens) {
        const produto = await this.ProdutoModel.findByPk(item.produto_id);
        if (!produto) {
          throw new Error(`Produto com ID ${item.produto_id} não encontrado`);
        }

        const precoUnitario = item.preco_unitario || produto.preco_base;
        const descontoValor = item.desconto_valor || 0;
        const precoTotal = (precoUnitario - descontoValor) * item.quantidade;

        const itemData = {
          [this.foreignKey]: record.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: precoUnitario,
          desconto_valor: descontoValor,
          preco_total: precoTotal,
          observacoes: item.observacoes
        };

        await this.ItemModel.create(itemData, { transaction });
        valorTotal += precoTotal;
      }

      // Atualiza o valor total
      await record.update({ valor_total: valorTotal }, { transaction });

      await transaction.commit();

      // Busca o registro atualizado
      const recordAtualizado = await this.Model.findByPk(id, {
        include: [
          {
            model: this.UserModel,
            as: 'vendedor',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: this.ItemModel,
            as: 'itens',
            include: [
              {
                model: this.ProdutoModel,
                as: 'produto',
                attributes: ['id', 'nome', 'codigo_interno', 'tipo']
              }
            ]
          }
        ]
      });

      return ResponseService.updated(res, recordAtualizado, `${this.modelName.charAt(0).toUpperCase() + this.modelName.slice(1)} atualizado com sucesso`);
    } catch (error) {
      await transaction.rollback();
      return ResponseService.handleError(res, error, `Atualizar ${this.modelName}`);
    }
  }

  /**
   * Atualiza o status de um registro
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const record = await this.Model.findByPk(id);
      if (!record) {
        return ResponseService.notFound(res, this.modelName.charAt(0).toUpperCase() + this.modelName.slice(1));
      }

      // Verifica se o usuário pode editar este registro
      if (req.user.role !== 'admin' && record.vendedor_id !== req.user.id) {
        return ResponseService.forbidden(res, `Sem permissão para editar este ${this.modelName}`);
      }

      await record.update({ status });

      return ResponseService.updated(res, record, `Status do ${this.modelName} atualizado com sucesso`);
    } catch (error) {
      return ResponseService.handleError(res, error, `Atualizar status do ${this.modelName}`);
    }
  }

  /**
   * Remove um registro
   */
  async destroy(req, res) {
    const transaction = await this.Model.sequelize.transaction();
    
    try {
      const { id } = req.params;

      const record = await this.Model.findByPk(id);
      if (!record) {
        return ResponseService.notFound(res, this.modelName.charAt(0).toUpperCase() + this.modelName.slice(1));
      }

      // Verifica se o usuário pode deletar este registro
      if (req.user.role !== 'admin' && record.vendedor_id !== req.user.id) {
        return ResponseService.forbidden(res, `Sem permissão para deletar este ${this.modelName}`);
      }

      // Remove itens do registro
      await this.ItemModel.destroy({
        where: { [this.foreignKey]: id },
        transaction
      });

      // Remove o registro
      await record.destroy({ transaction });

      await transaction.commit();

      return ResponseService.deleted(res, `${this.modelName.charAt(0).toUpperCase() + this.modelName.slice(1)} removido com sucesso`);
    } catch (error) {
      await transaction.rollback();
      return ResponseService.handleError(res, error, `Remover ${this.modelName}`);
    }
  }
}

module.exports = BaseController;