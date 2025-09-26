const { sequelize } = require('../src/models');

// Configuração global para testes
beforeAll(async () => {
  // Configurar variáveis de ambiente para teste
  process.env.NODE_ENV = 'test';
  process.env.DB_NAME = 'sistema_orcamentos_test';
  process.env.DB_HOST = 'localhost';
  process.env.DB_PORT = '5432';
  process.env.DB_USER = 'postgres';
  process.env.DB_PASSWORD = 'postgres';
  process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.BCRYPT_ROUNDS = '4'; // Reduzir rounds para testes mais rápidos
  
  // Configurar timeouts para testes
  jest.setTimeout(30000);
});

afterAll(async () => {
  // Fechar conexão com banco de dados
  if (sequelize && sequelize.connectionManager && !sequelize.connectionManager.pool.destroyed) {
    try {
      await sequelize.close();
    } catch (error) {
      // Ignorar erros de fechamento para SQLite em memória
      if (!error.message.includes('Database is closed')) {
        console.error('Erro ao fechar conexão:', error);
      }
    }
  }
});

// Mock para console.log em testes para reduzir ruído (temporariamente desabilitado para debug)
global.console = {
  ...console,
  log: console.log, // Temporariamente habilitado para debug
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: console.error // Manter errors visíveis
};

// Helper para limpar banco de dados entre testes
global.cleanDatabase = async () => {
  if (sequelize) {
    try {
      await sequelize.sync({ force: true });
    } catch (error) {
      console.error('Erro ao limpar banco de dados:', error);
      // Tentar reconectar se necessário
      if (error.message.includes('Database is closed')) {
        await sequelize.authenticate();
        await sequelize.sync({ force: true });
      }
    }
  }
};

// Helper para criar usuário de teste
global.createTestUser = async (userData = {}) => {
  const defaultUser = {
    nome: 'Usuário Teste',
    email: 'teste@exemplo.com',
    senha: '$2b$4$rQZ8kHWKtGKVQZ8kHWKtGOyQZ8kHWKtGKVQZ8kHWKtGKVQZ8kHWKtG', // 123456
    role: 'vendedor',
    ativo: true
  };

  return await sequelize.models.User.create({
    ...defaultUser,
    ...userData
  });
};

// Helper para criar produto de teste
global.createTestProduct = async (productData = {}) => {
  const defaultProduct = {
    nome: 'Produto Teste',
    descricao: 'Descrição do produto teste',
    categoria: 'categoria_teste',
    preco_base: 1000.00,
    ativo: true,
    especificacoes: {
      caracteristica1: 'valor1',
      caracteristica2: 'valor2'
    }
  };

  return await sequelize.models.Produto.create({
    ...defaultProduct,
    ...productData
  });
};

// Helper para criar fórmula de teste
global.createTestFormula = async (formulaData = {}) => {
  const defaultFormula = {
    nome: 'Fórmula Teste',
    descricao: 'Fórmula para testes',
    categoria: 'teste',
    formula: 'preco_base * quantidade',
    variaveis: ['preco_base', 'quantidade'],
    ativo: true
  };

  return await sequelize.models.Formula.create({
    ...defaultFormula,
    ...formulaData
  });
};

// Helper para fazer login e obter token
global.loginUser = async (app, email = 'teste@exemplo.com', senha = '123456') => {
  const request = require('supertest');
  
  const response = await request(app)
    .post('/api/auth/login')
    .send({ email, senha });
    
  return response.body.token;
};

// Configuração para suprimir warnings específicos do Sequelize em testes
process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';