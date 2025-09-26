'use strict';

const express = require('express');
const router = express.Router();

const AuthController = require('../controllers/AuthController');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { validateLogin, validateRegister } = require('../middleware/validation');
const { body } = require('express-validator');

/**
 * @route POST /api/auth/login
 * @desc Login do usuário
 * @access Public
 */
router.post('/login', validateLogin, AuthController.login);

/**
 * @route POST /api/auth/register
 * @desc Registro de novo usuário (apenas admins)
 * @access Private (Admin only)
 */
router.post('/register', authenticate, requireAdmin, validateRegister, AuthController.register);

/**
 * @route POST /api/auth/refresh
 * @desc Renovação do token de acesso
 * @access Public
 */
router.post('/refresh', [
  body('refresh_token')
    .notEmpty()
    .withMessage('Refresh token é obrigatório')
], AuthController.refreshToken);

/**
 * @route POST /api/auth/logout
 * @desc Logout do usuário
 * @access Private
 */
router.post('/logout', authenticate, AuthController.logout);

/**
 * @route GET /api/auth/me
 * @desc Informações do usuário atual
 * @access Private
 */
router.get('/me', authenticate, AuthController.me);

/**
 * @route PUT /api/auth/change-password
 * @desc Alteração de senha
 * @access Private
 */
router.put('/change-password', [
  authenticate,
  body('senha_atual')
    .notEmpty()
    .withMessage('Senha atual é obrigatória'),
  body('nova_senha')
    .isLength({ min: 6 })
    .withMessage('Nova senha deve ter pelo menos 6 caracteres')
], AuthController.changePassword);

module.exports = router;