'use strict';

require('dotenv').config();

const express = require('express');
const compression = require('compression');
const morgan = require('morgan');
const cors = require('cors');

// Importa middlewares customizados
const {
  corsOptions,
  generalLimiter,
  authLimiter,
  createLimiter,
  helmetConfig,
  securityLogger,
  sanitizeInput,
  customSecurityHeaders,
  validateContentType
} = require('./middleware/security');

const {
  errorHandler,
  notFoundHandler,
  requestLogger,
  validateRequiredHeaders
} = require('./middleware/errorHandler');

// Importa rotas
const apiRoutes = require('./routes');

// Importa modelos para sincronização
const { sequelize } = require('./models');

class App {
  constructor() {
    this.app = express();
    this.setupMiddlewares();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddlewares() {
    // Middleware de segurança básica
    this.app.use(helmetConfig);
    
    // CORS
    this.app.use(cors(corsOptions));
    
    // Compressão de resposta
    this.app.use(compression());
    
    // Logging de requests
    if (process.env.NODE_ENV === 'development') {
      this.app.use(morgan('dev'));
    } else {
      this.app.use(morgan('combined'));
    }
    
    // Rate limiting geral
    this.app.use(generalLimiter);
    
    // Middleware de segurança customizado
    this.app.use(securityLogger);
    this.app.use(customSecurityHeaders);
    this.app.use(requestLogger);
    
    // Parsing de JSON com limite de tamanho
    this.app.use(express.json({ 
      limit: '10mb',
      strict: true
    }));
    
    // Parsing de URL encoded
    this.app.use(express.urlencoded({ 
      extended: true, 
      limit: '10mb' 
    }));
    
    // Validação de headers obrigatórios
    this.app.use(validateRequiredHeaders);
    
    // Validação de Content-Type
    this.app.use(validateContentType);
    
    // Sanitização de entrada
    this.app.use(sanitizeInput);
    
    // Rate limiting específico para autenticação
    this.app.use('/api/auth/login', authLimiter);
    this.app.use('/api/auth/register', authLimiter);
    
    // Rate limiting para criação de recursos
    this.app.use('/api/produtos', (req, res, next) => {
      if (req.method === 'POST') {
        return createLimiter(req, res, next);
      }
      next();
    });
    
    this.app.use('/api/formulas', (req, res, next) => {
      if (req.method === 'POST') {
        return createLimiter(req, res, next);
      }
      next();
    });
  }

  setupRoutes() {
    // Rota raiz
    this.app.get('/', (req, res) => {
      res.json({
        success: true,
        message: 'Sistema de Orçamentos API',
        version: '1.0.0',
        documentation: '/api/info',
        health_check: '/api/health',
        timestamp: new Date().toISOString()
      });
    });

    // Rotas da API
    this.app.use('/api', apiRoutes);

    // Middleware para rotas não encontradas
    this.app.use(notFoundHandler);
  }

  setupErrorHandling() {
    // Middleware de tratamento de erros
    this.app.use(errorHandler);
  }

  async connectDatabase() {
    try {
      await sequelize.authenticate();
      console.log('✅ Conexão com banco de dados estabelecida com sucesso');
      
      // Sincroniza modelos em desenvolvimento
      if (process.env.NODE_ENV === 'development') {
        await sequelize.sync({ alter: false });
        console.log('✅ Modelos sincronizados com sucesso');
      }
      
      return true;
    } catch (error) {
      console.error('❌ Erro ao conectar com banco de dados:', error);
      return false;
    }
  }

  async start() {
    const PORT = process.env.PORT || 3000;
    const NODE_ENV = process.env.NODE_ENV || 'development';

    try {
      // Conecta ao banco de dados
      const dbConnected = await this.connectDatabase();
      
      if (!dbConnected) {
        console.error('❌ Falha ao conectar com banco de dados. Servidor não iniciado.');
        process.exit(1);
      }

      // Inicia o servidor
      const server = this.app.listen(PORT, () => {
        console.log(`
🚀 Servidor iniciado com sucesso!
📍 Ambiente: ${NODE_ENV}
🌐 URL: http://localhost:${PORT}
📚 API Info: http://localhost:${PORT}/api/info
❤️  Health Check: http://localhost:${PORT}/api/health
⏰ Iniciado em: ${new Date().toISOString()}
        `);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        console.log('🛑 SIGTERM recebido. Encerrando servidor graciosamente...');
        server.close(() => {
          console.log('✅ Servidor encerrado');
          sequelize.close().then(() => {
            console.log('✅ Conexão com banco de dados encerrada');
            process.exit(0);
          });
        });
      });

      process.on('SIGINT', () => {
        console.log('🛑 SIGINT recebido. Encerrando servidor graciosamente...');
        server.close(() => {
          console.log('✅ Servidor encerrado');
          sequelize.close().then(() => {
            console.log('✅ Conexão com banco de dados encerrada');
            process.exit(0);
          });
        });
      });

      return server;
    } catch (error) {
      console.error('❌ Erro ao iniciar servidor:', error);
      process.exit(1);
    }
  }

  getApp() {
    return this.app;
  }
}

module.exports = App;