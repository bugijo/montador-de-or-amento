'use strict';

const express = require('express');
const router = express.Router();

const ProdutoController = require('../controllers/ProdutoController');
const { authenticate, requireAdmin, requireAuthenticated } = require('../middleware/auth');
const { 
  validateCreateProduto, 
  validateUpdateProduto, 
  validateIdParam,
  validatePaginationQuery 
} = require('../middleware/validation');

/**
 * @route GET /api/produtos
 * @desc Lista todos os produtos com paginação e filtros
 * @access Private (Admin e Vendedor)
 */
router.get('/', authenticate, requireAuthenticated, validatePaginationQuery, ProdutoController.index);

/**
 * @route GET /api/produtos/maquinas
 * @desc Lista apenas máquinas
 * @access Private (Admin e Vendedor)
 */
router.get('/maquinas', authenticate, requireAuthenticated, ProdutoController.getMaquinas);

/**
 * @route GET /api/produtos/acessorios
 * @desc Lista apenas acessórios (opcionalmente filtrados por máquina)
 * @access Private (Admin e Vendedor)
 */
router.get('/acessorios', authenticate, requireAuthenticated, ProdutoController.getAcessorios);

/**
 * @route GET /api/produtos/categorias
 * @desc Lista categorias disponíveis
 * @access Private (Admin e Vendedor)
 */
router.get('/categorias', authenticate, requireAuthenticated, ProdutoController.getCategorias);

/**
 * @route GET /api/produtos/:id
 * @desc Busca um produto específico por ID
 * @access Private (Admin e Vendedor)
 */
router.get('/:id', authenticate, requireAuthenticated, validateIdParam, ProdutoController.show);

/**
 * @route POST /api/produtos
 * @desc Cria um novo produto
 * @access Private (Admin only)
 */
router.post('/', authenticate, requireAdmin, validateCreateProduto, ProdutoController.store);

/**
 * @route PUT /api/produtos/:id
 * @desc Atualiza um produto existente
 * @access Private (Admin only)
 */
router.put('/:id', authenticate, requireAdmin, validateUpdateProduto, ProdutoController.update);

/**
 * @route DELETE /api/produtos/:id
 * @desc Remove um produto
 * @access Private (Admin only)
 */
router.delete('/:id', authenticate, requireAdmin, validateIdParam, ProdutoController.destroy);

module.exports = router;