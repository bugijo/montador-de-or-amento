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

class AppDemo {
  constructor() {
    this.app = express();
    this.setupMiddlewares();
    this.setupDemoRoutes();
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
    
    // Middleware de segurança customizado (simplificado para demo)
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
    
    // Aplicar middlewares de validação apenas em rotas da API
    this.app.use('/api', validateRequiredHeaders);
    this.app.use('/api', validateContentType);
    this.app.use('/api', sanitizeInput);
  }

  setupDemoRoutes() {
    // Rota de health check
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'OK',
        message: 'Servidor funcionando - Modo Demo (sem banco de dados)',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // Rota de informações da API
    this.app.get('/api/info', (req, res) => {
      res.json({
        name: 'Sistema de Orçamentos',
        version: '1.0.0',
        mode: 'DEMO',
        description: 'API para sistema de orçamentos - Modo demonstração',
        endpoints: {
          health: '/api/health',
          info: '/api/info',
          login: '/api/auth/login (POST)',
          profile: '/api/auth/profile (GET)'
        },
        credentials: {
          admin: 'admin / admin123',
          vendedor: 'vendedor / vendedor123'
        },
        note: 'Este é o modo demonstração. Para funcionalidade completa, configure o banco de dados PostgreSQL.'
      });
    });

    // Rota de login simulada
    this.app.post('/api/auth/login', (req, res) => {
      const { email, senha } = req.body;
      
      // Usuários de demonstração
      const demoUsers = {
        'admin': {
          id: 1,
          nome: 'Administrador Demo',
          email: 'admin@sistema-orcamentos.com',
          role: 'admin',
          senha: 'admin123'
        },
        'vendedor': {
          id: 2,
          nome: 'Vendedor Demo',
          email: 'vendedor@sistema-orcamentos.com',
          role: 'vendedor',
          senha: 'vendedor123'
        }
      };

      // Verifica credenciais (aceita email ou username)
      let user = null;
      if (email === 'admin' && senha === 'admin123') {
        user = demoUsers.admin;
      } else if (email === 'vendedor' && senha === 'vendedor123') {
        user = demoUsers.vendedor;
      } else if (email === 'admin@sistema-orcamentos.com' && senha === 'admin123') {
        user = demoUsers.admin;
      } else if (email === 'vendedor@sistema-orcamentos.com' && senha === 'vendedor123') {
        user = demoUsers.vendedor;
      }

      if (user) {
        // Token simulado (em produção seria JWT real)
        const token = `demo-token-${user.id}-${Date.now()}`;
        
        res.json({
          success: true,
          message: 'Login realizado com sucesso',
          data: {
            user: {
              id: user.id,
              nome: user.nome,
              email: user.email,
              role: user.role
            },
            token: token,
            refreshToken: `refresh-${token}`
          }
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Credenciais inválidas',
          error: 'Email ou senha incorretos'
        });
      }
    });

    // Rota de perfil simulada
    this.app.get('/api/auth/profile', (req, res) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Token de acesso requerido'
        });
      }

      const token = authHeader.substring(7);
      
      if (token.startsWith('demo-token-')) {
        const userId = token.includes('-1-') ? 1 : 2;
        const user = userId === 1 ? {
          id: 1,
          nome: 'Administrador Demo',
          email: 'admin@sistema-orcamentos.com',
          role: 'admin'
        } : {
          id: 2,
          nome: 'Vendedor Demo',
          email: 'vendedor@sistema-orcamentos.com',
          role: 'vendedor'
        };

        res.json({
          success: true,
          data: { user }
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Token inválido'
        });
      }
    });

    // Rota de logout simulada
    this.app.post('/api/auth/logout', (req, res) => {
      res.json({
        success: true,
        message: 'Logout realizado com sucesso'
      });
    });

    // Rota de refresh token simulada
    this.app.post('/api/auth/refresh', (req, res) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Token de acesso requerido'
        });
      }

      const token = authHeader.substring(7);
      
      if (token.startsWith('demo-token-')) {
        const userId = token.includes('-1-') ? 1 : 2;
        const newToken = `demo-token-${userId}-${Date.now()}`;
        
        res.json({
          success: true,
          data: {
            access_token: newToken,
            token_type: 'Bearer',
            expires_in: 3600
          }
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Token inválido'
        });
      }
    });

    // Rota de perfil alternativa (me)
    this.app.get('/api/auth/me', (req, res) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          message: 'Token de acesso requerido'
        });
      }

      const token = authHeader.substring(7);
      
      if (token.startsWith('demo-token-')) {
        const userId = token.includes('-1-') ? 1 : 2;
        const user = userId === 1 ? {
          id: 1,
          nome: 'Administrador Demo',
          email: 'admin@sistema-orcamentos.com',
          role: 'admin'
        } : {
          id: 2,
          nome: 'Vendedor Demo',
          email: 'vendedor@sistema-orcamentos.com',
          role: 'vendedor'
        };

        res.json({
          success: true,
          data: { user }
        });
      } else {
        res.status(401).json({
          success: false,
          message: 'Token inválido'
        });
      }
    });

    // Rotas administrativas demo
    this.app.get('/api/admin/dashboard/stats', (req, res) => {
      res.json({
        success: true,
        data: {
          total_produtos: 3,
          total_maquinas: 2,
          total_acessorios: 1,
          total_formulas: 2,
          total_usuarios: 2,
          orcamentos_mes: 15,
          vendas_mes: 8,
          receita_mes: 125000.00
        }
      });
    });

    this.app.get('/api/admin/users', (req, res) => {
      res.json({
        success: true,
        data: {
          users: [
            {
              id: 1,
              nome: 'Administrador Demo',
              email: 'admin@sistema-orcamentos.com',
              role: 'admin',
              ativo: true,
              created_at: '2024-01-01T00:00:00Z'
            },
            {
              id: 2,
              nome: 'Vendedor Demo',
              email: 'vendedor@sistema-orcamentos.com',
              role: 'vendedor',
              ativo: true,
              created_at: '2024-01-01T00:00:00Z'
            }
          ],
          pagination: {
            current_page: 1,
            total_pages: 1,
            total_items: 2,
            items_per_page: 10
          }
        }
      });
    });

    this.app.get('/api/admin/analytics/orcamentos', (req, res) => {
      res.json({
        success: true,
        data: {
          total_orcamentos: 15,
          valor_total: 125000.00,
          media_valor: 8333.33,
          orcamentos_por_dia: [
            { data: '2024-01-01', quantidade: 2, valor: 15000.00 },
            { data: '2024-01-02', quantidade: 3, valor: 22000.00 },
            { data: '2024-01-03', quantidade: 1, valor: 8000.00 }
          ]
        }
      });
    });

    this.app.get('/api/admin/analytics/top-maquinas', (req, res) => {
      res.json({
        success: true,
        data: {
          maquinas: [
            {
              id: 1,
              nome: 'Máquina de Corte Laser',
              total_orcamentos: 8,
              valor_total: 75000.00
            },
            {
              id: 2,
              nome: 'Prensa Hidráulica',
              total_orcamentos: 7,
              valor_total: 50000.00
            }
          ]
        }
      });
    });

    this.app.get('/api/admin/analytics/vendas-por-vendedor', (req, res) => {
      res.json({
        success: true,
        data: {
          vendedores: [
            {
              id: 2,
              nome: 'Vendedor Demo',
              total_vendas: 8,
              valor_total: 125000.00,
              comissao: 6250.00
            }
          ]
        }
      });
    });

    // Rotas demo para produtos
    this.app.get('/api/produtos/maquinas', (req, res) => {
      res.json({
        success: true,
        data: {
          maquinas: [
            {
              id: 1,
              nome: 'Máquina de Corte Laser',
              tipo: 'Máquina',
              categoria: 'Corte',
              preco_base: 15000.00,
              ativo: true
            },
            {
              id: 2,
              nome: 'Prensa Hidráulica',
              tipo: 'Máquina',
              categoria: 'Conformação',
              preco_base: 25000.00,
              ativo: true
            }
          ]
        }
      });
    });

    // Rotas demo para acessórios
    this.app.get('/api/produtos/acessorios', (req, res) => {
      const { maquina_id } = req.query;
      
      let acessorios = [
        {
          id: 3,
          nome: 'Lâmina de Corte',
          tipo: 'Acessório',
          categoria: 'Ferramentas',
          preco_base: 150.00,
          ativo: true,
          maquinas_compativeis: [1]
        },
        {
          id: 4,
          nome: 'Cilindro Hidráulico',
          tipo: 'Acessório',
          categoria: 'Componentes',
          preco_base: 800.00,
          ativo: true,
          maquinas_compativeis: [2]
        }
      ];

      // Filtrar por máquina se especificado
      if (maquina_id) {
        acessorios = acessorios.filter(acessorio => 
          acessorio.maquinas_compativeis.includes(parseInt(maquina_id))
        );
      }

      res.json({
        success: true,
        data: {
          acessorios,
          maquina_id: maquina_id ? parseInt(maquina_id) : null
        }
      });
    });

    // Rotas demo para fórmulas
    this.app.get('/api/formulas', (req, res) => {
      const { maquina_id, produto_id } = req.query;
      
      let formulas = [
        {
          id: 1,
          nome: 'Cálculo de Corte Básico',
          descricao: 'Fórmula para calcular custo de corte laser',
          formula: 'preco_base + (area * 0.5) + (espessura * 2)',
          produto_id: 3,
          maquina_id: 1,
          prioridade: 1,
          ativo: true,
          variaveis: ['area', 'espessura'],
          produto: {
            id: 3,
            nome: 'Lâmina de Corte',
            tipo: 'Acessório'
          },
          maquina: {
            id: 1,
            nome: 'Máquina de Corte Laser',
            tipo: 'Máquina'
          }
        },
        {
          id: 2,
          nome: 'Cálculo de Prensagem',
          descricao: 'Fórmula para calcular custo de prensagem',
          formula: 'preco_base + (forca * 0.1) + (tempo * 5)',
          produto_id: 4,
          maquina_id: 2,
          prioridade: 1,
          ativo: true,
          variaveis: ['forca', 'tempo'],
          produto: {
            id: 4,
            nome: 'Cilindro Hidráulico',
            tipo: 'Acessório'
          },
          maquina: {
            id: 2,
            nome: 'Prensa Hidráulica',
            tipo: 'Máquina'
          }
        }
      ];

      // Filtrar por máquina se especificado
      if (maquina_id) {
        formulas = formulas.filter(formula => 
          formula.maquina_id === parseInt(maquina_id)
        );
      }

      // Filtrar por produto se especificado
      if (produto_id) {
        formulas = formulas.filter(formula => 
          formula.produto_id === parseInt(produto_id)
        );
      }

      res.json({
        success: true,
        data: {
          formulas,
          pagination: {
            current_page: 1,
            total_pages: 1,
            total_items: formulas.length,
            items_per_page: 10,
            has_next: false,
            has_prev: false
          }
        }
      });
    });

    this.app.get('/api/produtos', (req, res) => {
      res.json({
        success: true,
        data: {
          produtos: [
            {
              id: 1,
              nome: 'Máquina de Corte Laser',
              tipo: 'Máquina',
              categoria: 'Corte',
              preco_base: 15000.00,
              ativo: true
            },
            {
              id: 2,
              nome: 'Prensa Hidráulica',
              tipo: 'Máquina',
              categoria: 'Conformação',
              preco_base: 25000.00,
              ativo: true
            },
            {
              id: 3,
              nome: 'Lâmina de Corte',
              tipo: 'Acessório',
              categoria: 'Ferramentas',
              preco_base: 150.00,
              ativo: true,
              maquinas_compativeis: [1]
            }
          ],
          pagination: {
            current_page: 1,
            total_pages: 1,
            total_items: 3,
            items_per_page: 10,
            has_next: false,
            has_prev: false
          }
        }
      });
    });

    // Rota raiz
    this.app.get('/', (req, res) => {
      res.json({
        message: 'Sistema de Orçamentos - API Demo',
        status: 'Funcionando',
        endpoints: {
          health: '/api/health',
          info: '/api/info',
          login: '/api/auth/login',
          profile: '/api/auth/profile'
        },
        testCredentials: {
          admin: 'admin / admin123',
          vendedor: 'vendedor / vendedor123'
        }
      });
    });

    // Rota de login - redireciona para o frontend
    this.app.get('/login', (req, res) => {
      res.redirect('http://localhost:3001/login');
    });

    // Rotas do Vite client - retorna 204 (No Content) para evitar erros
    this.app.get('/@vite/client', (req, res) => {
      res.status(204).send();
    });

    this.app.get('/@vite/*', (req, res) => {
      res.status(204).send();
    });
  }

  setupErrorHandling() {
    this.app.use(notFoundHandler);
    this.app.use(errorHandler);
  }

  async start() {
    const PORT = process.env.PORT || 3000;
    const NODE_ENV = process.env.NODE_ENV || 'development';

    try {
      // Inicia o servidor sem conexão com banco
      const server = this.app.listen(PORT, () => {
        console.log(`
🚀 Servidor DEMO iniciado com sucesso!
📍 Ambiente: ${NODE_ENV}
🌐 URL: http://localhost:${PORT}
📚 API Info: http://localhost:${PORT}/api/info
❤️  Health Check: http://localhost:${PORT}/api/health
⚠️  MODO DEMO: Sem conexão com banco de dados
⏰ Iniciado em: ${new Date().toISOString()}
        `);
      });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        console.log('🛑 SIGTERM recebido. Encerrando servidor graciosamente...');
        server.close(() => {
          console.log('✅ Servidor encerrado');
          process.exit(0);
        });
      });

      process.on('SIGINT', () => {
        console.log('🛑 SIGINT recebido. Encerrando servidor graciosamente...');
        server.close(() => {
          console.log('✅ Servidor encerrado');
          process.exit(0);
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

module.exports = AppDemo;