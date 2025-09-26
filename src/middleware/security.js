'use strict';

const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');

/**
 * Configuração do CORS
 */
const corsOptions = {
  origin: function (origin, callback) {
    // Lista de origens permitidas (configurar conforme necessário)
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:8080',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:8080'
    ];

    // Permite requisições sem origin (ex: mobile apps, Postman)
    if (!origin) return callback(null, true);

    // Em desenvolvimento, permite qualquer origin
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

/**
 * Rate limiting geral
 */
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // máximo 100 requests por IP
  message: {
    success: false,
    message: 'Muitas requisições deste IP, tente novamente mais tarde.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Pula rate limiting para health check
    return req.path === '/api/health';
  }
});

/**
 * Rate limiting mais restritivo para autenticação
 */
const authLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutos ou configuração de ambiente
  max: process.env.NODE_ENV === 'test' ? 1000 : 5, // máximo 1000 para testes, 5 para produção
  message: {
    success: false,
    message: 'Muitas tentativas de login, tente novamente em 15 minutos.',
    error: 'AUTH_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true // não conta requests bem-sucedidos
});

/**
 * Rate limiting para criação de recursos
 */
const createLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // máximo 10 criações por minuto
  message: {
    success: false,
    message: 'Muitas criações de recursos, tente novamente em 1 minuto.',
    error: 'CREATE_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Configuração do Helmet para segurança
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

/**
 * Middleware para logging de segurança
 */
const securityLogger = (req, res, next) => {
  // Log de tentativas de acesso suspeitas
  const suspiciousPatterns = [
    /\.\./,  // path traversal
    /<script/i,  // XSS
    /union.*select/i,  // SQL injection
    /javascript:/i,  // javascript injection
    /vbscript:/i,  // vbscript injection
    /onload=/i,  // event handler injection
    /onerror=/i  // event handler injection
  ];

  const userAgent = req.get('User-Agent') || '';
  const url = req.originalUrl;
  const body = JSON.stringify(req.body);

  const isSuspicious = suspiciousPatterns.some(pattern => 
    pattern.test(url) || pattern.test(body) || pattern.test(userAgent)
  );

  if (isSuspicious) {
    console.warn('Tentativa de acesso suspeita detectada:', {
      ip: req.ip,
      userAgent,
      url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  }

  next();
};

/**
 * Middleware para sanitização de entrada
 */
const sanitizeInput = (req, res, next) => {
  // Remove caracteres potencialmente perigosos
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
        .replace(/javascript:/gi, '') // Remove javascript:
        .replace(/vbscript:/gi, '') // Remove vbscript:
        .replace(/on\w+\s*=/gi, ''); // Remove event handlers
    }
    
    if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
      const sanitized = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => sanitize(item));
    }
    
    return obj;
  };

  try {
    if (req.body && typeof req.body === 'object') {
      req.body = sanitize(req.body);
    }

    if (req.query && typeof req.query === 'object') {
      req.query = sanitize(req.query);
    }

    if (req.params && typeof req.params === 'object') {
      req.params = sanitize(req.params);
    }
  } catch (error) {
    console.error('Erro no sanitizeInput:', error);
    // Continue sem sanitização em caso de erro
  }

  next();
};

/**
 * Middleware para headers de segurança customizados
 */
const customSecurityHeaders = (req, res, next) => {
  // Remove header que expõe tecnologia
  res.removeHeader('X-Powered-By');
  
  // Headers customizados
  res.setHeader('X-API-Version', '1.0.0');
  res.setHeader('X-Response-Time', Date.now());
  
  // Previne cache de dados sensíveis
  if (req.path.includes('/auth/') || req.path.includes('/admin/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }

  next();
};

/**
 * Middleware para validação de Content-Type
 */
const validateContentType = (req, res, next) => {
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    const contentLength = req.get('Content-Length');
    const hasBody = contentLength && parseInt(contentLength) > 0;
    
    // Se há body, exigir Content-Type application/json
    if (hasBody) {
      const contentType = req.get('Content-Type');
      
      if (!contentType || !contentType.includes('application/json')) {
        return res.status(400).json({
          success: false,
          message: 'Content-Type deve ser application/json',
          error: 'INVALID_CONTENT_TYPE'
        });
      }
    }
  }

  next();
};

module.exports = {
  corsOptions,
  generalLimiter,
  authLimiter,
  createLimiter,
  helmetConfig,
  securityLogger,
  sanitizeInput,
  customSecurityHeaders,
  validateContentType
};