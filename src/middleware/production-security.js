'use strict';

const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

/**
 * Rate limiting mais agressivo para produção
 */
const productionRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'production' ? 50 : 100, // Mais restritivo em produção
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em 15 minutos.',
    error: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Pula apenas health check
    return req.path === '/api/health';
  }
});

/**
 * Slow down para requisições suspeitas
 */
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutos
  delayAfter: 10, // Após 10 requests, começar a atrasar
  delayMs: 500, // Atraso de 500ms por request adicional
  maxDelayMs: 20000, // Máximo de 20 segundos de atraso
  skipSuccessfulRequests: true
});

/**
 * Middleware para detectar e bloquear IPs suspeitos
 */
const suspiciousActivityDetector = (req, res, next) => {
  const suspiciousPatterns = [
    // SQL Injection
    /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute)\b)/i,
    // XSS
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/i,
    /vbscript:/i,
    /onload\s*=/i,
    /onerror\s*=/i,
    // Path Traversal
    /\.\.\//g,
    /\.\.\\/g,
    // Command Injection
    /(\||;|&|`|\$\(|\$\{)/,
    // LDAP Injection
    /(\(|\)|&|\||!)/,
  ];

  const userAgent = req.get('User-Agent') || '';
  const url = req.originalUrl;
  const body = JSON.stringify(req.body);
  const query = JSON.stringify(req.query);

  const testString = `${url} ${body} ${query} ${userAgent}`;

  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(testString));

  if (isSuspicious) {
    console.error('🚨 ATIVIDADE SUSPEITA DETECTADA:', {
      ip: req.ip,
      userAgent,
      url,
      method: req.method,
      body: req.body,
      query: req.query,
      timestamp: new Date().toISOString(),
      headers: req.headers
    });

    return res.status(403).json({
      success: false,
      message: 'Atividade suspeita detectada',
      error: 'SUSPICIOUS_ACTIVITY'
    });
  }

  next();
};

/**
 * Middleware para validar origem das requisições
 */
const validateOrigin = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  const origin = req.get('Origin') || req.get('Referer');
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || '').split(',');

  // Permite requisições sem origin (APIs, mobile apps)
  if (!origin) {
    return next();
  }

  const isAllowed = allowedOrigins.some(allowed => 
    origin.startsWith(allowed.trim())
  );

  if (!isAllowed) {
    console.warn('🚫 Origem não autorizada:', {
      ip: req.ip,
      origin,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl,
      timestamp: new Date().toISOString()
    });

    return res.status(403).json({
      success: false,
      message: 'Origem não autorizada',
      error: 'UNAUTHORIZED_ORIGIN'
    });
  }

  next();
};

/**
 * Middleware para logging de segurança avançado
 */
const advancedSecurityLogger = (req, res, next) => {
  const start = Date.now();

  // Captura informações da requisição
  const requestInfo = {
    ip: req.ip,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    origin: req.get('Origin'),
    referer: req.get('Referer'),
    timestamp: new Date().toISOString(),
    sessionId: req.sessionID,
    userId: req.user?.id
  };

  // Log de requisições sensíveis
  const sensitiveEndpoints = ['/api/auth/', '/api/admin/', '/api/users/'];
  const isSensitive = sensitiveEndpoints.some(endpoint => 
    req.originalUrl.includes(endpoint)
  );

  if (isSensitive || process.env.LOG_LEVEL === 'debug') {
    console.log('🔍 Requisição:', requestInfo);
  }

  // Intercepta a resposta
  const originalSend = res.send;
  res.send = function(data) {
    const duration = Date.now() - start;
    
    // Log de respostas com erro
    if (res.statusCode >= 400) {
      console.warn('⚠️ Resposta com erro:', {
        ...requestInfo,
        statusCode: res.statusCode,
        duration,
        responseSize: data?.length || 0
      });
    }

    originalSend.call(this, data);
  };

  next();
};

/**
 * Middleware para proteção contra ataques de força bruta
 */
const bruteForceProtection = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Máximo 3 tentativas por hora para endpoints críticos
  message: {
    success: false,
    message: 'Muitas tentativas falharam. Conta temporariamente bloqueada.',
    error: 'BRUTE_FORCE_PROTECTION'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  keyGenerator: (req) => {
    // Combina IP + email para identificar tentativas
    const email = req.body?.email || req.body?.usuario || 'unknown';
    return `${req.ip}-${email}`;
  }
});

module.exports = {
  productionRateLimit,
  speedLimiter,
  suspiciousActivityDetector,
  validateOrigin,
  advancedSecurityLogger,
  bruteForceProtection
};