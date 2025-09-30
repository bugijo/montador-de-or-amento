'use strict';

const { Orcamento, OrcamentoItem, Produto, User } = require('../models');
const { Op } = require('sequelize');

class OrcamentoController {
  /**
   * Lista todos os orçamentos com paginação e filtros
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
        where.data_orcamento = {
          [Op.between]: [new Date(data_inicio), new Date(data_fim)]
        };
      }

      const { count, rows } = await Orcamento.findAndCountAll({
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
            model: OrcamentoItem,
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
          orcamentos: rows,
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
      console.error('Erro ao listar orçamentos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Busca um orçamento específico por ID
   */
  async show(req, res) {
    try {
      const { id } = req.params;

      const orcamento = await Orcamento.findByPk(id, {
        include: [
          {
            model: User,
            as: 'vendedor',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: OrcamentoItem,
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

      if (!orcamento) {
        return res.status(404).json({
          success: false,
          message: 'Orçamento não encontrado'
        });
      }

      res.json({
        success: true,
        data: orcamento
      });
    } catch (error) {
      console.error('Erro ao buscar orçamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Cria um novo orçamento
   */
  async store(req, res) {
    const transaction = await Orcamento.sequelize.transaction();
    
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

      // Cria o orçamento
      const orcamento = await Orcamento.create({
        cliente_nome,
        cliente_email,
        cliente_telefone,
        cliente_endereco,
        observacoes,
        data_validade,
        vendedor_id: req.user.id
      }, { transaction });

      let valorTotal = 0;

      // Cria os itens do orçamento
      for (const item of itens) {
        const produto = await Produto.findByPk(item.produto_id);
        if (!produto) {
          throw new Error(`Produto com ID ${item.produto_id} não encontrado`);
        }

        const precoUnitario = item.preco_unitario || produto.preco_base;
        const descontoValor = item.desconto_valor || 0;
        const precoTotal = (precoUnitario - descontoValor) * item.quantidade;

        await OrcamentoItem.create({
          orcamento_id: orcamento.id,
          produto_id: item.produto_id,
          quantidade: item.quantidade,
          preco_unitario: precoUnitario,
          desconto_valor: descontoValor,
          preco_total: precoTotal,
          observacoes: item.observacoes
        }, { transaction });

        valorTotal += precoTotal;
      }

      // Atualiza o valor total do orçamento
      await orcamento.update({ valor_total: valorTotal }, { transaction });

      await transaction.commit();

      // Busca o orçamento criado com todos os relacionamentos
      const orcamentoCriado = await Orcamento.findByPk(orcamento.id, {
        include: [
          {
            model: User,
            as: 'vendedor',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: OrcamentoItem,
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
        message: 'Orçamento criado com sucesso',
        data: orcamentoCriado
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Erro ao criar orçamento:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao criar orçamento',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Atualiza um orçamento existente
   */
  async update(req, res) {
    const transaction = await Orcamento.sequelize.transaction();
    
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

      const orcamento = await Orcamento.findByPk(id);
      if (!orcamento) {
        return res.status(404).json({
          success: false,
          message: 'Orçamento não encontrado'
        });
      }

      // Verifica se o usuário pode editar este orçamento
      if (req.user.role !== 'admin' && orcamento.vendedor_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para editar este orçamento'
        });
      }

      // Atualiza os dados do orçamento
      await orcamento.update({
        cliente_nome,
        cliente_email,
        cliente_telefone,
        cliente_endereco,
        observacoes,
        data_validade
      }, { transaction });

      // Remove itens existentes
      await OrcamentoItem.destroy({
        where: { orcamento_id: id },
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

        await OrcamentoItem.create({
          orcamento_id: orcamento.id,
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
      await orcamento.update({ valor_total: valorTotal }, { transaction });

      await transaction.commit();

      // Busca o orçamento atualizado
      const orcamentoAtualizado = await Orcamento.findByPk(id, {
        include: [
          {
            model: User,
            as: 'vendedor',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: OrcamentoItem,
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
        message: 'Orçamento atualizado com sucesso',
        data: orcamentoAtualizado
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Erro ao atualizar orçamento:', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erro ao atualizar orçamento',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Atualiza o status de um orçamento
   */
  async updateStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const orcamento = await Orcamento.findByPk(id);
      if (!orcamento) {
        return res.status(404).json({
          success: false,
          message: 'Orçamento não encontrado'
        });
      }

      // Verifica se o usuário pode editar este orçamento
      if (req.user.role !== 'admin' && orcamento.vendedor_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para editar este orçamento'
        });
      }

      await orcamento.update({ status });

      res.json({
        success: true,
        message: 'Status do orçamento atualizado com sucesso',
        data: orcamento
      });
    } catch (error) {
      console.error('Erro ao atualizar status do orçamento:', error);
      res.status(400).json({
        success: false,
        message: 'Erro ao atualizar status do orçamento',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Calcula valores de um orçamento
   */
  async calcular(req, res) {
    try {
      const { id } = req.params;

      const orcamento = await Orcamento.findByPk(id, {
        include: [
          {
            model: OrcamentoItem,
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

      if (!orcamento) {
        return res.status(404).json({
          success: false,
          message: 'Orçamento não encontrado'
        });
      }

      let valorTotal = 0;
      let valorDesconto = 0;

      orcamento.itens.forEach(item => {
        valorTotal += parseFloat(item.preco_total);
        valorDesconto += parseFloat(item.desconto_valor) * item.quantidade;
      });

      // Atualiza os valores no orçamento
      await orcamento.update({
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
      console.error('Erro ao calcular orçamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao calcular orçamento',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }

  /**
   * Gera PDF do orçamento
   */
  async gerarPDF(req, res) {
    try {
      const { id } = req.params;

      const orcamento = await Orcamento.findByPk(id, {
        include: [
          {
            model: User,
            as: 'vendedor',
            attributes: ['id', 'nome', 'email']
          },
          {
            model: OrcamentoItem,
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

      if (!orcamento) {
        return res.status(404).json({
          success: false,
          message: 'Orçamento não encontrado'
        });
      }

      // Por enquanto, retorna apenas os dados do orçamento
      // TODO: Implementar geração real de PDF
      res.json({
        success: true,
        message: 'PDF gerado com sucesso',
        data: {
          orcamento,
          pdf_url: `/api/orcamentos/${id}/pdf/download`
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
   * Remove um orçamento
   */
  async destroy(req, res) {
    const transaction = await Orcamento.sequelize.transaction();
    
    try {
      const { id } = req.params;

      const orcamento = await Orcamento.findByPk(id);
      if (!orcamento) {
        return res.status(404).json({
          success: false,
          message: 'Orçamento não encontrado'
        });
      }

      // Verifica se o usuário pode deletar este orçamento
      if (req.user.role !== 'admin' && orcamento.vendedor_id !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'Sem permissão para deletar este orçamento'
        });
      }

      // Remove itens do orçamento
      await OrcamentoItem.destroy({
        where: { orcamento_id: id },
        transaction
      });

      // Remove o orçamento
      await orcamento.destroy({ transaction });

      await transaction.commit();

      res.json({
        success: true,
        message: 'Orçamento removido com sucesso'
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Erro ao remover orçamento:', error);
      res.status(500).json({
        success: false,
        message: 'Erro ao remover orçamento',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
}

module.exports = new OrcamentoController();