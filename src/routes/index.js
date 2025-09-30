'use strict';

const express = require('express');
const router = express.Router();

// Importa as rotas específicas
const authRoutes = require('./auth');
const produtoRoutes = require('./produtos');
const formulaRoutes = require('./formulas');
const vendaRoutes = require('./vendas');
const orcamentoRoutes = require('./orcamentos');

/**
 * Rota de health check
 * @route GET /api/health
 * @desc Verifica se a API está funcionando
 * @access Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API Sistema de Orçamentos funcionando',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Rota de informações da API
 * @route GET /api/info
 * @desc Informações básicas da API
 * @access Public
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      name: 'Sistema de Orçamentos API',
      version: '1.0.0',
      description: 'API para sistema de orçamentos com módulos de vendas e administração',
      author: 'Maycon',
      endpoints: {
        auth: '/api/auth',
        produtos: '/api/produtos',
        formulas: '/api/formulas',
        vendas: '/api/vendas',
        orcamentos: '/api/orcamentos'
      },
      documentation: '/api/docs',
      health_check: '/api/health'
    }
  });
});

// Registra as rotas específicas
router.use('/auth', authRoutes);
router.use('/produtos', produtoRoutes);
router.use('/formulas', formulaRoutes);
router.use('/vendas', vendaRoutes);
router.use('/orcamentos', orcamentoRoutes);

/**
 * Middleware para rotas não encontradas
 */
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint não encontrado',
    error: 'ENDPOINT_NOT_FOUND',
    requested_url: req.originalUrl,
    method: req.method,
    available_endpoints: {
      auth: '/api/auth',
      produtos: '/api/produtos',
      formulas: '/api/formulas',
      health: '/api/health',
      info: '/api/info'
    }
  });
});

module.exports = router;