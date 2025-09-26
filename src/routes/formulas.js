'use strict';

const express = require('express');
const router = express.Router();

const FormulaController = require('../controllers/FormulaController');
const { authenticate, requireAdmin, requireAuthenticated } = require('../middleware/auth');
const { 
  validateCreateFormula, 
  validateUpdateFormula, 
  validateIdParam,
  validatePaginationQuery,
  handleValidationErrors
} = require('../middleware/validation');
const { body, param } = require('express-validator');

/**
 * @route GET /api/formulas
 * @desc Lista todas as fórmulas com paginação e filtros
 * @access Private (Admin e Vendedor)
 */
router.get('/', authenticate, requireAuthenticated, validatePaginationQuery, FormulaController.index);

/**
 * @route GET /api/formulas/:id
 * @desc Busca uma fórmula específica por ID
 * @access Private (Admin e Vendedor)
 */
router.get('/:id', authenticate, requireAuthenticated, validateIdParam, FormulaController.show);

/**
 * @route GET /api/formulas/produto/:produto_id/maquina/:maquina_id
 * @desc Busca fórmulas por produto e máquina
 * @access Private (Admin e Vendedor)
 */
router.get('/produto/:produto_id/maquina/:maquina_id', [
  authenticate,
  requireAuthenticated,
  param('produto_id')
    .isInt({ min: 1 })
    .withMessage('ID do produto deve ser um número inteiro positivo'),
  param('maquina_id')
    .isInt({ min: 1 })
    .withMessage('ID da máquina deve ser um número inteiro positivo'),
  handleValidationErrors
], FormulaController.getByProdutoMaquina);

/**
 * @route POST /api/formulas
 * @desc Cria uma nova fórmula
 * @access Private (Admin only)
 */
router.post('/', authenticate, requireAdmin, validateCreateFormula, FormulaController.store);

/**
 * @route PUT /api/formulas/:id
 * @desc Atualiza uma fórmula existente
 * @access Private (Admin only)
 */
router.put('/:id', authenticate, requireAdmin, validateUpdateFormula, FormulaController.update);

/**
 * @route DELETE /api/formulas/:id
 * @desc Remove uma fórmula
 * @access Private (Admin only)
 */
router.delete('/:id', authenticate, requireAdmin, validateIdParam, FormulaController.destroy);

/**
 * @route POST /api/formulas/:id/calcular
 * @desc Calcula o resultado de uma fórmula
 * @access Private (Admin e Vendedor)
 */
router.post('/:id/calcular', [
  authenticate,
  requireAuthenticated,
  validateIdParam,
  body('variaveis')
    .isObject()
    .withMessage('Variáveis devem ser um objeto')
    .notEmpty()
    .withMessage('Variáveis são obrigatórias'),
  handleValidationErrors
], FormulaController.calcular);

/**
 * @route POST /api/formulas/testar
 * @desc Testa uma fórmula sem salvá-la
 * @access Private (Admin only)
 */
router.post('/testar', [
  authenticate,
  requireAdmin,
  body('formula')
    .notEmpty()
    .withMessage('Fórmula é obrigatória')
    .isLength({ min: 1 })
    .withMessage('Fórmula não pode estar vazia'),
  body('variaveis')
    .isObject()
    .withMessage('Variáveis devem ser um objeto')
    .notEmpty()
    .withMessage('Variáveis são obrigatórias'),
  handleValidationErrors
], FormulaController.testarFormula);

module.exports = router;