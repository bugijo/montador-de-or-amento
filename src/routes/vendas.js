'use strict';

const express = require('express');
const router = express.Router();
const VendaController = require('../controllers/VendaController');
const { authenticate } = require('../middleware/auth');
const adminMiddleware = require('../middleware/admin');
const { body, param, query } = require('express-validator');
const validate = require('../middleware/validate');

// Middleware de autenticação para todas as rotas
router.use(authenticate);

// Validações
const vendaValidation = [
  body('cliente_nome').notEmpty().withMessage('Nome do cliente é obrigatório'),
  body('cliente_email').isEmail().withMessage('Email do cliente deve ser válido'),
  body('itens').isArray({ min: 1 }).withMessage('Deve ter pelo menos um item'),
  body('itens.*.produto_id').isInt().withMessage('ID do produto deve ser um número'),
  body('itens.*.quantidade').isFloat({ min: 0.01 }).withMessage('Quantidade deve ser maior que zero'),
  validate
];

const statusValidation = [
  body('status').isIn(['pendente', 'confirmada', 'cancelada', 'entregue']).withMessage('Status inválido'),
  validate
];

const idValidation = [
  param('id').isInt().withMessage('ID deve ser um número'),
  validate
];

// Rotas públicas (para vendedores)

/**
 * @route GET /api/vendas
 * @desc Lista vendas com paginação e filtros
 * @access Private
 */
router.get('/', [
  query('page').optional().isInt({ min: 1 }).withMessage('Página deve ser um número positivo'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100'),
  query('sort').optional().isIn(['id', 'numero_venda', 'cliente_nome', 'valor_total', 'data_venda', 'status']).withMessage('Campo de ordenação inválido'),
  query('order').optional().isIn(['ASC', 'DESC']).withMessage('Ordem deve ser ASC ou DESC'),
  validate
], VendaController.index);

/**
 * @route GET /api/vendas/:id
 * @desc Busca uma venda específica
 * @access Private
 */
router.get('/:id', idValidation, VendaController.show);

/**
 * @route POST /api/vendas
 * @desc Cria uma nova venda
 * @access Private
 */
router.post('/', vendaValidation, VendaController.store);

/**
 * @route PUT /api/vendas/:id
 * @desc Atualiza uma venda existente
 * @access Private
 */
router.put('/:id', [...idValidation, ...vendaValidation], VendaController.update);

/**
 * @route PATCH /api/vendas/:id/status
 * @desc Atualiza o status de uma venda
 * @access Private
 */
router.patch('/:id/status', [...idValidation, ...statusValidation], VendaController.updateStatus);

/**
 * @route POST /api/vendas/:id/calcular
 * @desc Calcula valores de uma venda
 * @access Private
 */
router.post('/:id/calcular', idValidation, VendaController.calcular);

/**
 * @route GET /api/vendas/:id/pdf
 * @desc Gera PDF de uma venda
 * @access Private
 */
router.get('/:id/pdf', idValidation, VendaController.gerarPDF);

/**
 * @route DELETE /api/vendas/:id
 * @desc Remove uma venda
 * @access Private
 */
router.delete('/:id', idValidation, VendaController.destroy);

// Rotas administrativas

/**
 * @route GET /api/vendas/admin/stats
 * @desc Estatísticas de vendas (apenas admin)
 * @access Admin
 */
router.get('/admin/stats', adminMiddleware, async (req, res) => {
  try {
    const { Venda, VendaItem } = require('../models');
    const { Op } = require('sequelize');
    
    const hoje = new Date();
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const fimMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);

    // Total de vendas
    const totalVendas = await Venda.count();
    
    // Vendas do mês
    const vendasMes = await Venda.count({
      where: {
        data_venda: {
          [Op.between]: [inicioMes, fimMes]
        }
      }
    });

    // Valor total de vendas
    const valorTotal = await Venda.sum('valor_total') || 0;

    // Valor de vendas do mês
    const valorMes = await Venda.sum('valor_total', {
      where: {
        data_venda: {
          [Op.between]: [inicioMes, fimMes]
        }
      }
    }) || 0;

    // Vendas por status
    const vendasPorStatus = await Venda.findAll({
      attributes: [
        'status',
        [Venda.sequelize.fn('COUNT', Venda.sequelize.col('id')), 'total']
      ],
      group: ['status']
    });

    res.json({
      success: true,
      data: {
        total_vendas: totalVendas,
        vendas_mes: vendasMes,
        valor_total: parseFloat(valorTotal),
        valor_mes: parseFloat(valorMes),
        vendas_por_status: vendasPorStatus.map(v => ({
          status: v.status,
          total: parseInt(v.dataValues.total)
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
 * @route GET /api/vendas/relatorios/vendedor
 * @desc Relatório de vendas por vendedor (apenas admin)
 * @access Admin
 */
router.get('/relatorios/vendedor', adminMiddleware, async (req, res) => {
  try {
    const { Venda, User } = require('../models');
    const { Op } = require('sequelize');
    
    const { data_inicio, data_fim } = req.query;
    const where = {};

    if (data_inicio && data_fim) {
      where.data_venda = {
        [Op.between]: [new Date(data_inicio), new Date(data_fim)]
      };
    }

    const vendedores = await User.findAll({
      where: { role: 'vendedor' },
      include: [
        {
          model: Venda,
          as: 'vendas',
          where,
          required: false,
          attributes: ['id', 'valor_total', 'status']
        }
      ]
    });

    const relatorio = vendedores.map(vendedor => {
      const vendas = vendedor.vendas || [];
      const totalVendas = vendas.length;
      const valorTotal = vendas.reduce((sum, venda) => sum + parseFloat(venda.valor_total || 0), 0);
      const vendasConfirmadas = vendas.filter(v => v.status === 'confirmada').length;

      return {
        vendedor: {
          id: vendedor.id,
          nome: vendedor.nome,
          email: vendedor.email
        },
        total_vendas: totalVendas,
        vendas_confirmadas: vendasConfirmadas,
        valor_total: valorTotal,
        ticket_medio: totalVendas > 0 ? valorTotal / totalVendas : 0
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

module.exports = router;