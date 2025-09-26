'use strict';

const jwtUtils = require('../utils/jwt');
const { User } = require('../models');

/**
 * Middleware de autenticação
 * Verifica se o usuário está autenticado através do token JWT
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtUtils.extractTokenFromHeader(authHeader);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido',
        error: 'MISSING_TOKEN'
      });
    }

    // Verifica e decodifica o token
    const decoded = jwtUtils.verifyToken(token);

    // Verifica se o token está expirado após validar
    if (jwtUtils.isTokenExpired(token)) {
      return res.status(401).json({
        success: false,
        message: 'Token expirado',
        error: 'EXPIRED_TOKEN'
      });
    }

    // Busca o usuário no banco de dados
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado',
        error: 'USER_NOT_FOUND'
      });
    }

    if (!user.ativo) {
      return res.status(401).json({
        success: false,
        message: 'Usuário inativo',
        error: 'USER_INACTIVE'
      });
    }

    // Adiciona o usuário ao objeto request
    req.user = user;
    req.token = token;

    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    
    return res.status(401).json({
      success: false,
      message: 'Token inválido',
      error: 'INVALID_TOKEN',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Middleware de autorização por role
 * @param {string|Array} allowedRoles - Role(s) permitida(s)
 */
const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
        error: 'NOT_AUTHENTICATED'
      });
    }

    const userRole = req.user.role;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Permissões insuficientes.',
        error: 'INSUFFICIENT_PERMISSIONS',
        required_roles: roles,
        user_role: userRole
      });
    }

    next();
  };
};

/**
 * Middleware específico para administradores
 */
const requireAdmin = authorize('admin');

/**
 * Middleware específico para vendedores
 */
const requireVendedor = authorize('vendedor');

/**
 * Middleware que permite acesso a admins e vendedores
 */
const requireAuthenticated = authorize(['admin', 'vendedor']);

/**
 * Middleware opcional de autenticação
 * Não bloqueia a requisição se não houver token, mas adiciona o usuário se houver
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = jwtUtils.extractTokenFromHeader(authHeader);

    if (token && !jwtUtils.isTokenExpired(token)) {
      const decoded = jwtUtils.verifyToken(token);
      const user = await User.findByPk(decoded.id);

      if (user && user.ativo) {
        req.user = user;
        req.token = token;
      }
    }

    next();
  } catch (error) {
    // Em caso de erro, apenas continua sem autenticar
    next();
  }
};

/**
 * Middleware para verificar se o usuário pode acessar seus próprios dados
 * @param {string} paramName - Nome do parâmetro que contém o ID do usuário
 */
const requireOwnershipOrAdmin = (paramName = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuário não autenticado',
        error: 'NOT_AUTHENTICATED'
      });
    }

    const targetUserId = parseInt(req.params[paramName]);
    const currentUserId = req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && targetUserId !== currentUserId) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Você só pode acessar seus próprios dados.',
        error: 'ACCESS_DENIED'
      });
    }

    next();
  };
};

/**
 * Middleware para rate limiting por usuário autenticado
 */
const rateLimitByUser = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();

  return (req, res, next) => {
    if (!req.user) {
      return next();
    }

    const userId = req.user.id;
    const now = Date.now();
    const windowStart = now - windowMs;

    // Limpa requisições antigas
    if (userRequests.has(userId)) {
      const requests = userRequests.get(userId).filter(time => time > windowStart);
      userRequests.set(userId, requests);
    } else {
      userRequests.set(userId, []);
    }

    const currentRequests = userRequests.get(userId);

    if (currentRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Muitas requisições. Tente novamente mais tarde.',
        error: 'RATE_LIMIT_EXCEEDED',
        retry_after: Math.ceil(windowMs / 1000)
      });
    }

    currentRequests.push(now);
    next();
  };
};

module.exports = {
  authenticate,
  authorize,
  requireAdmin,
  requireVendedor,
  requireAuthenticated,
  optionalAuth,
  requireOwnershipOrAdmin,
  rateLimitByUser
};