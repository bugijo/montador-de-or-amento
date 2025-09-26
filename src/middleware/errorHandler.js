'use strict';

/**
 * Middleware de tratamento de erros centralizado
 */
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log do erro
  console.error('Erro capturado pelo middleware:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Erro de validação do Sequelize
  if (err.name === 'SequelizeValidationError') {
    const message = 'Dados de entrada inválidos';
    const errors = err.errors.map(error => ({
      field: error.path,
      message: error.message,
      value: error.value
    }));

    return res.status(400).json({
      success: false,
      message,
      error: 'VALIDATION_ERROR',
      errors
    });
  }

  // Erro de constraint única do Sequelize
  if (err.name === 'SequelizeUniqueConstraintError') {
    const message = 'Recurso já existe';
    const field = err.errors[0]?.path || 'campo';
    
    return res.status(409).json({
      success: false,
      message: `${field} já está em uso`,
      error: 'DUPLICATE_ENTRY',
      field
    });
  }

  // Erro de foreign key do Sequelize
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    const message = 'Referência inválida';
    
    return res.status(400).json({
      success: false,
      message: 'Referência a recurso inexistente',
      error: 'FOREIGN_KEY_ERROR'
    });
  }

  // Erro de conexão com banco de dados
  if (err.name === 'SequelizeConnectionError') {
    return res.status(503).json({
      success: false,
      message: 'Erro de conexão com banco de dados',
      error: 'DATABASE_CONNECTION_ERROR'
    });
  }

  // Erro de timeout do banco de dados
  if (err.name === 'SequelizeTimeoutError') {
    return res.status(504).json({
      success: false,
      message: 'Timeout na operação do banco de dados',
      error: 'DATABASE_TIMEOUT'
    });
  }

  // Erro de JSON malformado
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      message: 'JSON malformado',
      error: 'INVALID_JSON'
    });
  }

  // Erro de payload muito grande
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'Payload muito grande',
      error: 'PAYLOAD_TOO_LARGE'
    });
  }

  // Erro de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido',
      error: 'INVALID_TOKEN'
    });
  }

  // Erro de JWT expirado
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token expirado',
      error: 'EXPIRED_TOKEN'
    });
  }

  // Erro de CORS
  if (err.message && err.message.includes('CORS')) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado pelo CORS',
      error: 'CORS_ERROR'
    });
  }

  // Erro de rate limiting
  if (err.status === 429) {
    return res.status(429).json({
      success: false,
      message: 'Muitas requisições',
      error: 'RATE_LIMIT_EXCEEDED'
    });
  }

  // Erro de cast (tipo inválido)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: 'Formato de ID inválido',
      error: 'INVALID_ID_FORMAT'
    });
  }

  // Erro 404 - Recurso não encontrado
  if (err.status === 404) {
    return res.status(404).json({
      success: false,
      message: 'Recurso não encontrado',
      error: 'RESOURCE_NOT_FOUND'
    });
  }

  // Erro 403 - Acesso negado
  if (err.status === 403) {
    return res.status(403).json({
      success: false,
      message: 'Acesso negado',
      error: 'ACCESS_DENIED'
    });
  }

  // Erro 401 - Não autorizado
  if (err.status === 401) {
    return res.status(401).json({
      success: false,
      message: 'Não autorizado',
      error: 'UNAUTHORIZED'
    });
  }

  // Erro 400 - Bad Request
  if (err.status === 400) {
    return res.status(400).json({
      success: false,
      message: err.message || 'Requisição inválida',
      error: 'BAD_REQUEST'
    });
  }

  // Erro interno do servidor (padrão)
  res.status(err.status || 500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' 
      ? 'Erro interno do servidor' 
      : err.message || 'Erro interno do servidor',
    error: 'INTERNAL_SERVER_ERROR',
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      details: err
    })
  });
};

/**
 * Middleware para capturar rotas não encontradas
 */
const notFoundHandler = (req, res, next) => {
  // Ignora requisições do Vite em desenvolvimento
  if (process.env.NODE_ENV === 'development' && 
      (req.originalUrl.startsWith('/@vite/') || 
       req.originalUrl.startsWith('/node_modules/') ||
       req.originalUrl.startsWith('/__vite_ping') ||
       req.originalUrl.includes('.js.map') ||
       req.originalUrl.includes('.css.map'))) {
    return res.status(404).end();
  }

  const error = new Error(`Rota não encontrada - ${req.originalUrl}`);
  error.status = 404;
  next(error);
};

/**
 * Middleware para capturar erros assíncronos
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Middleware para logging de requests
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();
  
  // Captura o final da resposta
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    // Log apenas em desenvolvimento ou para erros
    if (process.env.NODE_ENV === 'development' || res.statusCode >= 400) {
      console.log(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms - ${req.ip}`);
    }
    
    originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware para validação de headers obrigatórios
 */
const validateRequiredHeaders = (req, res, next) => {
  // Valida User-Agent (opcional, mas recomendado)
  if (!req.get('User-Agent')) {
    console.warn('Requisição sem User-Agent:', {
      ip: req.ip,
      url: req.originalUrl,
      method: req.method
    });
  }

  // Valida Content-Length para requests com body (apenas se Content-Type indica JSON)
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    const contentLength = req.get('Content-Length');
    
    // Só exigir Content-Length se há Content-Type indicando JSON
    if (contentType && contentType.includes('application/json')) {
      if (!contentLength || contentLength === '0') {
        return res.status(400).json({
          success: false,
          message: 'Content-Length é obrigatório para este método',
          error: 'MISSING_CONTENT_LENGTH'
        });
      }
    }
  }

  next();
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  requestLogger,
  validateRequiredHeaders
};