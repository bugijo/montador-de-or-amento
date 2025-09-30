'use strict';

const { Venda, VendaItem, Produto, User } = require('../models');
const { Op } = require('sequelize');

class VendaController {
  /**
   * Lista todas as vendas com paginação e filtros
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
        where.data_venda = {
          [Op.between]: [new Date(data_inicio), new Date(data_fim)]
        };
      }

      const { count, rows } = await Venda.findAndCountAll({
        where,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [[sort, order.toUpperCase()]],
        include: [
          {
            model: User,
            as: 'vendedor',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: VendaItem,
            as: 'itens',
            include: [
              {
                model: Produto,
                as: 'produto',
                attributes: ['id', 'nome', 'codigo_interno', 'tipo']
              }
            ]
          }
        ]
      });

      res.json({
        success: true,
        data: {
          vendas: rows,
          pagination: {
            current_page: parseInt(page),
            total_pages: Math.ceil(count / limit),
            total_items: count,
            items_per_page: parseInt(limit),
            has_next: page * limit < count,
            has_prev: page > 1
          }
        }
      });
    } catch (error) {
      console.error('Erro ao listar vendas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Busca uma venda específica por ID
   */
  async show(req, res) {
    try {
      const { id } = req.params;

      const venda = await Venda.findByPk(id, {
        include: [
          {
            model: User,
            as: 'vendedor',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: VendaItem,
            as: 'itens',
            include: [
              {
                model: Produto,
                as: 'produto',
                attributes: ['id', 'nome', 'codigo_interno', 'tipo', 'preco_base']
              }
            ]
          }
        ]
      });

      if (!venda) {
        return res.status(404).json({
          success: false,
          message: 'Venda não encontrada'
        });
      }

      res.json({
        success: true,
        data: venda
      });
    } catch (error) {
      console.error('Erro ao buscar venda:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Cria uma nova venda
   */
  async store(req, res) {
    const transaction = await Venda.sequelize.transaction();
    
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

      // Cria a venda
      const venda = await Venda.create({
        cliente_nome,
        cliente_email,
        cliente_telefone,
        cliente_endereco,
        observacoes,
        data_validade,
        vendedor_id: req.user.id
      }, { transaction });

      let valorTotal = 0;

      // Cria os itens da venda
      for (const item of itens) {
        const produto = await Produto.findByPk(item.produto_id);
        if (!produto) {
          throw new Error(`Produto com ID ${item.produto_id} não encontrado`);
        }

        const precoUnitario = item.preco_unitario || produto.preco_base;
        const descontoValor = item.desconto_valor || 0;
        const precoTotal = (precoUnitario - descontoValor) * item.quantidade;

        await VendaItem.create({
          venda_id: venda.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: precoUnitario,
          desconto_valor: descontoValor,
          preco_total: precoTotal,
          observacoes: item.observacoes
        }, { transaction });

        valorTotal += precoTotal;
      }

      // Atualiza o valor total da venda
      await venda.update({ valor_total: valorTotal }, { transaction });

      await transaction.commit();

      // Busca a venda criada com todos os relacionamentos
      const vendaCriada = await Venda.findByPk(venda.id, {
        include: [
          {
            model: User,
            as: 'vendedor',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: VendaItem,
            as: 'itens',
            include: [
              {
                model: Produto,
                as: 'produto',
                attributes: ['id', 'nome', 'codigo_interno', 'tipo']
              }
            ]
          }
        ]
      });

      res.status(201).json({
        success: true,
        message: 'Venda criada com sucesso',
        data: vendaCriada
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Erro ao criar venda:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao criar venda',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Atualiza uma venda existente
   */
  async update(req, res) {
    const transaction = await Venda.sequelize.transaction();
    
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

      const venda = await Venda.findByPk(id);
      if (!venda) {
        return res.status(404).json({
          success: false,
          message: 'Venda não encontrada'
        });
      }

      // Verifica se o usuário pode editar esta venda
      if (req.user.role !== 'admin' && venda.vendedor_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para editar esta venda'
        });
      }

      // Atualiza os dados da venda
      await venda.update({
        cliente_nome,
        cliente_email,
        cliente_telefone,
        cliente_endereco,
        observacoes,
        data_validade
      }, { transaction });

      // Remove itens existentes
      await VendaItem.destroy({
        where: { venda_id: id },
        transaction
      });

      let valorTotal = 0;

      // Cria os novos itens
      for (const item of itens) {
        const produto = await Produto.findByPk(item.produto_id);
        if (!produto) {
          throw new Error(`Produto com ID ${item.produto_id} não encontrado`);
        }

        const precoUnitario = item.preco_unitario || produto.preco_base;
        const descontoValor = item.desconto_valor || 0;
        const precoTotal = (precoUnitario - descontoValor) * item.quantidade;

        await VendaItem.create({
          venda_id: venda.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: precoUnitario,
          desconto_valor: descontoValor,
          preco_total: precoTotal,
          observacoes: item.observacoes
        }, { transaction });

        valorTotal += precoTotal;
      }

      // Atualiza o valor total
      await venda.update({ valor_total: valorTotal }, { transaction });

      await transaction.commit();

      // Busca a venda atualizada
      const vendaAtualizada = await Venda.findByPk(id, {
        include: [
          {
            model: User,
            as: 'vendedor',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: VendaItem,
            as: 'itens',
            include: [
              {
                model: Produto,
                as: 'produto',
                attributes: ['id', 'nome', 'codigo_interno', 'tipo']
              }
            ]
          }
        ]
      });

      res.json({
        success: true,
        message: 'Venda atualizada com sucesso',
        data: vendaAtualizada
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Erro ao atualizar venda:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao atualizar venda',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Atualiza o status de uma venda
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const venda = await Venda.findByPk(id);
      if (!venda) {
        return res.status(404).json({
          success: false,
          message: 'Venda não encontrada'
        });
      }

      // Verifica se o usuário pode editar esta venda
      if (req.user.role !== 'admin' && venda.vendedor_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para editar esta venda'
        });
      }

      await venda.update({ status });

      res.json({
        success: true,
        message: 'Status da venda atualizado com sucesso',
        data: venda
      });
    } catch (error) {
      console.error('Erro ao atualizar status da venda:', error);
      res.status(400).json({
        success: false,
        message: 'Erro ao atualizar status da venda',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Calcula valores de uma venda
   */
  async calcular(req, res) {
    try {
      const { id } = req.params;

      const venda = await Venda.findByPk(id, {
        include: [
          {
            model: VendaItem,
            as: 'itens',
            include: [
              {
                model: Produto,
                as: 'produto'
              }
            ]
          }
        ]
      });

      if (!venda) {
        return res.status(404).json({
          success: false,
          message: 'Venda não encontrada'
        });
      }

      let valorTotal = 0;
      let valorDesconto = 0;

      venda.itens.forEach(item => {
        valorTotal += parseFloat(item.preco_total);
        valorDesconto += parseFloat(item.desconto_valor) * item.quantidade;
      });

      // Atualiza os valores na venda
      await venda.update({
        valor_total: valorTotal,
        valor_desconto: valorDesconto
      });

      res.json({
        success: true,
        message: 'Cálculo realizado com sucesso',
        data: {
          valor_total: valorTotal,
          valor_desconto: valorDesconto,
          valor_liquido: valorTotal - valorDesconto
        }
      });
    } catch (error) {
      console.error('Erro ao calcular venda:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao calcular venda',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Gera PDF da venda
   */
  async gerarPDF(req, res) {
    try {
      const { id } = req.params;

      const venda = await Venda.findByPk(id, {
        include: [
          {
            model: User,
            as: 'vendedor',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: VendaItem,
            as: 'itens',
            include: [
              {
                model: Produto,
                as: 'produto'
              }
            ]
          }
        ]
      });

      if (!venda) {
        return res.status(404).json({
          success: false,
          message: 'Venda não encontrada'
        });
      }

      // Por enquanto, retorna apenas os dados da venda
      // TODO: Implementar geração real de PDF
      res.json({
        success: true,
        message: 'PDF gerado com sucesso',
        data: {
          venda,
          pdf_url: `/api/vendas/${id}/pdf/download`
        }
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao gerar PDF',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Remove uma venda
   */
  async destroy(req, res) {
    const transaction = await Venda.sequelize.transaction();
    
    try {
      const { id } = req.params;

      const venda = await Venda.findByPk(id);
      if (!venda) {
        return res.status(404).json({
          success: false,
          message: 'Venda não encontrada'
        });
      }

      // Verifica se o usuário pode deletar esta venda
      if (req.user.role !== 'admin' && venda.vendedor_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para deletar esta venda'
        });
      }

      // Remove itens da venda
      await VendaItem.destroy({
        where: { venda_id: id },
        transaction
      });

      // Remove a venda
      await venda.destroy({ transaction });

      await transaction.commit();

      res.json({
        success: true,
        message: 'Venda removida com sucesso'
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Erro ao remover venda:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao remover venda',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new VendaController();