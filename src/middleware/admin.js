'use strict';

/**
 * Middleware para verificar se o usuário é administrador
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware function
 */
const adminMiddleware = (req, res, next) => {
  try {
    // Verifica se o usuário está autenticado
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Acesso negado. Token de autenticação necessário.'
      });
    }

    // Verifica se o usuário é administrador
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Permissões de administrador necessárias.'
      });
    }

    // Se chegou até aqui, o usuário é admin
    next();
  } catch (error) {
    console.error('Erro no middleware admin:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = adminMiddleware;