'use strict';

const express = require('express');
const router = express.Router();
const OrcamentoController = require('../controllers/OrcamentoController');
const { authenticate } = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');

// Middleware de autenticação para todas as rotas
router.use(authenticate);

// Validações
const orcamentoValidation = [
  body('cliente_nome').notEmpty().withMessage('Nome do cliente é obrigatório'),
  body('cliente_email').isEmail().withMessage('Email do cliente deve ser válido'),
  body('itens').isArray({ min: 1 }).withMessage('Deve ter pelo menos um item'),
  body('itens.*.produto_id').isInt().withMessage('ID do produto deve ser um número'),
  body('itens.*.quantidade').isFloat({ min: 0.01 }).withMessage('Quantidade deve ser maior que zero'),
  validate
];

const statusValidation = [
  body('status').isIn(['rascunho', 'enviado', 'aprovado', 'rejeitado', 'expirado']).withMessage('Status inválido'),
  validate
];

const idValidation = [
  param('id').isInt().withMessage('ID deve ser um número'),
  validate
];

// Rotas públicas (para vendedores)

/**
 * @route GET /api/orcamentos
 * @desc Lista orçamentos com paginação e filtros
 * @access Private
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número positivo'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100'),
  query('sort').optional().isIn(['id', 'numero_orcamento', 'cliente_nome', 'valor_total', 'data_orcamento', 'status']).withMessage('Campo de ordenação inválido'),
  query('order').optional().isIn(['ASC', 'DESC']).withMessage('Ordem deve ser ASC ou DESC'),
  validate
], OrcamentoController.index);

/**
 * @route GET /api/orcamentos/:id
 * @desc Busca um orçamento específico
 * @access Private
 */
router.get('/:id', idValidation, OrcamentoController.show);

/**
 * @route POST /api/orcamentos
 * @desc Cria um novo orçamento
 * @access Private
 */
router.post('/', orcamentoValidation, OrcamentoController.store);

/**
 * @route PUT /api/orcamentos/:id
 * @desc Atualiza um orçamento existente
 * @access Private
 */
router.put('/:id', [...idValidation, ...orcamentoValidation], OrcamentoController.update);

/**
 * @route PATCH /api/orcamentos/:id/status
 * @desc Atualiza o status de um orçamento
 * @access Private
 */
router.patch('/:id/status', [...idValidation, ...statusValidation], OrcamentoController.updateStatus);

/**
 * @route POST /api/orcamentos/:id/calcular
 * @desc Calcula valores de um orçamento
 * @access Private
 */
router.post('/:id/calcular', idValidation, OrcamentoController.calcular);

/**
 * @route GET /api/orcamentos/:id/pdf
 * @desc Gera PDF de um orçamento
 * @access Private
 */
router.get('/:id/pdf', idValidation, OrcamentoController.gerarPDF);

/**
 * @route DELETE /api/orcamentos/:id
 * @desc Remove um orçamento
 * @access Private
 */
router.delete('/:id', idValidation, OrcamentoController.destroy);

// Rotas administrativas

/**
 * @route GET /api/orcamentos/admin/stats
 * @desc Estatísticas de orçamentos (apenas admin)
 * @access Admin
 */
router.get('/admin/stats', adminMiddleware, async (req, res) => {
  try {
    const { Orcamento, OrcamentoItem } = require('../models');
    const { Op } = require('sequelize');
    
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    // Total de orçamentos
    const totalOrcamentos = await Orcamento.count();
    
    // Orçamentos do mês
    const orcamentosMes = await Orcamento.count({
      where: {
        data_orcamento: {
          [Op.between]: [inicioMes, fimMes]
        }
      }
    });

    // Valor total de orçamentos
    const valorTotal = await Orcamento.sum('valor_total') || 0;

    // Valor de orçamentos do mês
    const valorMes = await Orcamento.sum('valor_total', {
      where: {
        data_orcamento: {
          [Op.between]: [inicioMes, fimMes]
        }
      }
    }) || 0;

    // Orçamentos por status
    const orcamentosPorStatus = await Orcamento.findAll({
      attributes: [
        'status',
        [Orcamento.sequelize.fn('COUNT', Orcamento.sequelize.col('id')), 'total']
      ],
      group: ['status']
    });

    // Taxa de conversão (aprovados / total)
    const orcamentosAprovados = await Orcamento.count({
      where: { status: 'aprovado' }
    });
    const taxaConversao = totalOrcamentos > 0 ? (orcamentosAprovados / totalOrcamentos) * 100 : 0;

    res.json({
      success: true,
      data: {
        total_orcamentos: totalOrcamentos,
        orcamentos_mes: orcamentosMes,
        valor_total: parseFloat(valorTotal),
        valor_mes: parseFloat(valorMes),
        taxa_conversao: parseFloat(taxaConversao.toFixed(2)),
        orcamentos_por_status: orcamentosPorStatus.map(o => ({
          status: o.status,
          total: parseInt(o.dataValues.total)
        }))
      }
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao buscar estatísticas'
    });
  }
});

/**
 * @route GET /api/orcamentos/relatorios/vendedor
 * @desc Relatório de orçamentos por vendedor (apenas admin)
 * @access Admin
 */
router.get('/relatorios/vendedor', adminMiddleware, async (req, res) => {
  try {
    const { Orcamento, User } = require('../models');
    const { Op } = require('sequelize');
    
    const { data_inicio, data_fim } = req.query;
    const where = {};

    if (data_inicio && data_fim) {
      where.data_orcamento = {
        [Op.between]: [new Date(data_inicio), new Date(data_fim)]
      };
    }

    const vendedores = await User.findAll({
      where: { role: 'vendedor' },
      include: [
        {
          model: Orcamento,
          as: 'orcamentos',
          where,
          required: false,
          attributes: ['id', 'valor_total', 'status']
        }
      ]
    });

    const relatorio = vendedores.map(vendedor => {
      const orcamentos = vendedor.orcamentos || [];
      const totalOrcamentos = orcamentos.length;
      const valorTotal = orcamentos.reduce((sum, orcamento) => sum + parseFloat(orcamento.valor_total || 0), 0);
      const orcamentosAprovados = orcamentos.filter(o => o.status === 'aprovado').length;
      const taxaConversao = totalOrcamentos > 0 ? (orcamentosAprovados / totalOrcamentos) * 100 : 0;

      return {
        vendedor: {
          id: vendedor.id,
          nome: vendedor.nome,
          email: vendedor.email
        },
        total_orcamentos: totalOrcamentos,
        orcamentos_aprovados: orcamentosAprovados,
        valor_total: valorTotal,
        ticket_medio: totalOrcamentos > 0 ? valorTotal / totalOrcamentos : 0,
        taxa_conversao: parseFloat(taxaConversao.toFixed(2))
      };
    });

    res.json({
      success: true,
      data: relatorio
    });
  } catch (error) {
    console.error('Erro ao gerar relatório:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao gerar relatório'
    });
  }
});

/**
 * @route POST /api/orcamentos/:id/converter-venda
 * @desc Converte um orçamento em venda
 * @access Private
 */
router.post('/:id/converter-venda', idValidation, async (req, res) => {
  const transaction = await Orcamento.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { Orcamento, OrcamentoItem, Venda, VendaItem } = require('../models');

    const orcamento = await Orcamento.findByPk(id, {
      include: [
        {
          model: OrcamentoItem,
          as: 'itens'
        }
      ]
    });

    if (!orcamento) {
      return res.status(404).json({
        success: false,
        message: 'Orçamento não encontrado'
      });
    }

    if (orcamento.status !== 'aprovado') {
      return res.status(400).json({
        success: false,
        message: 'Apenas orçamentos aprovados podem ser convertidos em vendas'
      });
    }

    // Cria a venda baseada no orçamento
    const venda = await Venda.create({
      cliente_nome: orcamento.cliente_nome,
      cliente_email: orcamento.cliente_email,
      cliente_telefone: orcamento.cliente_telefone,
      cliente_endereco: orcamento.cliente_endereco,
      observacoes: orcamento.observacoes,
      valor_total: orcamento.valor_total,
      vendedor_id: orcamento.vendedor_id,
      orcamento_id: orcamento.id
    }, { transaction });

    // Cria os itens da venda
    for (const item of orcamento.itens) {
      await VendaItem.create({
        venda_id: venda.id,
        produto_id: item.produto_id,
        quantidade: item.quantidade,
        preco_unitario: item.preco_unitario,
        preco_total: item.preco_total,
        desconto_valor: item.desconto_valor,
        observacoes: item.observacoes
      }, { transaction });
    }

    // Atualiza o status do orçamento
    await orcamento.update({ status: 'convertido' }, { transaction });

    await transaction.commit();

    res.json({
      success: true,
      message: 'Orçamento convertido em venda com sucesso',
      data: {
        venda_id: venda.id,
        numero_venda: venda.numero_venda
      }
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Erro ao converter orçamento:', error);
    res.status(500).json({
      success: false,
      message: 'Erro ao converter orçamento em venda',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;