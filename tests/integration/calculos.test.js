const request = require('supertest');
const { sequelize } = require('../../src/models');
const App = require('../../src/app');

describe('Testes de Integração - Cálculos e Fórmulas', () => {
  let app;
  let authToken;
  let adminToken;
  let formulaId;
  let produtoId;

  beforeAll(async () => {
    // Configurar ambiente de teste
    process.env.NODE_ENV = 'test';
    process.env.DB_NAME = 'sistema_orcamentos_test';
    
    // Criar instância da aplicação
    const appInstance = new App();
    app = appInstance.getApp();
    
    // Sincronizar banco de dados
    await sequelize.sync({ force: true });
    
    // Criar usuários de teste
    const vendedor = await sequelize.models.User.create({
      nome: 'Vendedor Teste',
      email: 'vendedor@exemplo.com',
      senha: '$2b$10$rQZ8kHWKtGKVQZ8kHWKtGOyQZ8kHWKtGKVQZ8kHWKtGKVQZ8kHWKtG',
      role: 'vendedor',
      ativo: true
    });

    const admin = await sequelize.models.User.create({
      nome: 'Admin Teste',
      email: 'admin@exemplo.com',
      senha: '$2b$10$rQZ8kHWKtGKVQZ8kHWKtGOyQZ8kHWKtGKVQZ8kHWKtGKVQZ8kHWKtG',
      role: 'admin',
      ativo: true
    });

    // Fazer login para obter tokens
    const vendedorLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'vendedor@exemplo.com',
        senha: '123456'
      });
    authToken = vendedorLogin.body.token;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@exemplo.com',
        senha: '123456'
      });
    adminToken = adminLogin.body.token;

    // Criar produto de teste
    const produto = await sequelize.models.Produto.create({
      nome: 'Máquina Teste',
      descricao: 'Descrição da máquina teste',
      categoria: 'categoria_teste',
      preco_base: 10000.00,
      ativo: true,
      especificacoes: {
        potencia: '100HP',
        peso: '1000kg'
      }
    });
    produtoId = produto.id;

    // Criar fórmula de teste
    const formula = await sequelize.models.Formula.create({
      nome: 'Fórmula Básica',
      descricao: 'Fórmula para cálculo básico',
      categoria: 'basica',
      formula: 'preco_base * quantidade * (1 + margem / 100)',
      variaveis: ['preco_base', 'quantidade', 'margem'],
      ativo: true
    });
    formulaId = formula.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/formulas', () => {
    test('Deve listar fórmulas ativas', async () => {
      const response = await request(app)
        .get('/api/formulas')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.every(f => f.ativo === true)).toBe(true);
    });

    test('Deve filtrar fórmulas por categoria', async () => {
      const response = await request(app)
        .get('/api/formulas?categoria=basica')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.every(f => f.categoria === 'basica')).toBe(true);
    });
  });

  describe('POST /api/formulas', () => {
    test('Admin deve conseguir criar fórmula', async () => {
      const novaFormula = {
        nome: 'Fórmula Avançada',
        descricao: 'Fórmula com cálculo avançado',
        categoria: 'avancada',
        formula: 'preco_base * quantidade * (1 + margem / 100) + taxa_fixa',
        variaveis: ['preco_base', 'quantidade', 'margem', 'taxa_fixa']
      };

      const response = await request(app)
        .post('/api/formulas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(novaFormula)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('nome', novaFormula.nome);
      expect(response.body.data).toHaveProperty('formula', novaFormula.formula);
      expect(response.body.data).toHaveProperty('ativo', true);
    });

    test('Vendedor não deve conseguir criar fórmula', async () => {
      const novaFormula = {
        nome: 'Fórmula Não Autorizada',
        descricao: 'Tentativa de criação',
        categoria: 'teste',
        formula: 'preco_base * 2',
        variaveis: ['preco_base']
      };

      const response = await request(app)
        .post('/api/formulas')
        .set('Authorization', `Bearer ${authToken}`)
        .send(novaFormula)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'INSUFFICIENT_PERMISSIONS');
    });

    test('Deve validar sintaxe da fórmula', async () => {
      const formulaInvalida = {
        nome: 'Fórmula Inválida',
        descricao: 'Fórmula com sintaxe incorreta',
        categoria: 'teste',
        formula: 'preco_base * quantidade +',
        variaveis: ['preco_base', 'quantidade']
      };

      const response = await request(app)
        .post('/api/formulas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(formulaInvalida)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'INVALID_FORMULA_SYNTAX');
    });
  });

  describe('POST /api/calculos/executar', () => {
    test('Deve executar cálculo com fórmula válida', async () => {
      const dadosCalculo = {
        formula_id: formulaId,
        variaveis: {
          preco_base: 10000,
          quantidade: 2,
          margem: 20
        }
      };

      const response = await request(app)
        .post('/api/calculos/executar')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dadosCalculo)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('resultado');
      expect(response.body.data).toHaveProperty('formula_utilizada');
      expect(response.body.data).toHaveProperty('variaveis_utilizadas');
      
      // Verificar se o cálculo está correto: 10000 * 2 * (1 + 20/100) = 24000
      expect(response.body.data.resultado).toBe(24000);
    });

    test('Deve retornar erro para variáveis faltantes', async () => {
      const dadosCalculo = {
        formula_id: formulaId,
        variaveis: {
          preco_base: 10000,
          // quantidade e margem faltantes
        }
      };

      const response = await request(app)
        .post('/api/calculos/executar')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dadosCalculo)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'MISSING_VARIABLES');
      expect(response.body).toHaveProperty('missing_variables');
    });

    test('Deve retornar erro para fórmula inexistente', async () => {
      const dadosCalculo = {
        formula_id: 99999,
        variaveis: {
          preco_base: 10000,
          quantidade: 1,
          margem: 10
        }
      };

      const response = await request(app)
        .post('/api/calculos/executar')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dadosCalculo)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'FORMULA_NOT_FOUND');
    });

    test('Deve lidar com divisão por zero', async () => {
      // Criar fórmula com divisão
      const formulaDivisao = await sequelize.models.Formula.create({
        nome: 'Fórmula Divisão',
        descricao: 'Fórmula com divisão',
        categoria: 'teste',
        formula: 'preco_base / divisor',
        variaveis: ['preco_base', 'divisor'],
        ativo: true
      });

      const dadosCalculo = {
        formula_id: formulaDivisao.id,
        variaveis: {
          preco_base: 10000,
          divisor: 0
        }
      };

      const response = await request(app)
        .post('/api/calculos/executar')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dadosCalculo)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'CALCULATION_ERROR');
    });
  });

  describe('POST /api/calculos/validar', () => {
    test('Deve validar fórmula correta', async () => {
      const dadosValidacao = {
        formula: 'preco_base * quantidade * (1 + margem / 100)',
        variaveis: ['preco_base', 'quantidade', 'margem'],
        valores_teste: {
          preco_base: 1000,
          quantidade: 1,
          margem: 10
        }
      };

      const response = await request(app)
        .post('/api/calculos/validar')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dadosValidacao)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('valida', true);
      expect(response.body.data).toHaveProperty('resultado_teste');
    });

    test('Deve detectar fórmula inválida', async () => {
      const dadosValidacao = {
        formula: 'preco_base * quantidade +',
        variaveis: ['preco_base', 'quantidade'],
        valores_teste: {
          preco_base: 1000,
          quantidade: 1
        }
      };

      const response = await request(app)
        .post('/api/calculos/validar')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dadosValidacao)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('valida', false);
      expect(response.body.data).toHaveProperty('erro');
    });

    test('Deve detectar variáveis não utilizadas', async () => {
      const dadosValidacao = {
        formula: 'preco_base * quantidade',
        variaveis: ['preco_base', 'quantidade', 'margem'], // margem não é usada
        valores_teste: {
          preco_base: 1000,
          quantidade: 1,
          margem: 10
        }
      };

      const response = await request(app)
        .post('/api/calculos/validar')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dadosValidacao)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('variaveis_nao_utilizadas');
      expect(response.body.data.variaveis_nao_utilizadas).toContain('margem');
    });
  });

  describe('POST /api/calculos/orcamento', () => {
    test('Deve calcular orçamento completo', async () => {
      const dadosOrcamento = {
        itens: [
          {
            produto_id: produtoId,
            quantidade: 2,
            preco_unitario: 10000,
            desconto_percentual: 5
          },
          {
            produto_id: produtoId,
            quantidade: 1,
            preco_unitario: 15000,
            desconto_percentual: 10
          }
        ],
        formula_id: formulaId,
        variaveis_globais: {
          margem: 15
        }
      };

      const response = await request(app)
        .post('/api/calculos/orcamento')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dadosOrcamento)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('itens');
      expect(response.body.data).toHaveProperty('valor_total');
      expect(response.body.data).toHaveProperty('valor_desconto');
      expect(response.body.data).toHaveProperty('valor_liquido');
      expect(response.body.data.itens).toHaveLength(2);
    });

    test('Deve aplicar descontos corretamente', async () => {
      const dadosOrcamento = {
        itens: [
          {
            produto_id: produtoId,
            quantidade: 1,
            preco_unitario: 1000,
            desconto_percentual: 10
          }
        ],
        formula_id: formulaId,
        variaveis_globais: {
          margem: 0
        }
      };

      const response = await request(app)
        .post('/api/calculos/orcamento')
        .set('Authorization', `Bearer ${authToken}`)
        .send(dadosOrcamento)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      
      const item = response.body.data.itens[0];
      expect(item).toHaveProperty('valor_unitario', 1000);
      expect(item).toHaveProperty('valor_desconto', 100);
      expect(item).toHaveProperty('valor_liquido', 900);
    });
  });

  describe('GET /api/calculos/historico', () => {
    test('Deve retornar histórico de cálculos do usuário', async () => {
      // Primeiro, executar um cálculo para criar histórico
      await request(app)
        .post('/api/calculos/executar')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          formula_id: formulaId,
          variaveis: {
            preco_base: 5000,
            quantidade: 1,
            margem: 10
          }
        });

      const response = await request(app)
        .get('/api/calculos/historico')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('Deve paginar histórico', async () => {
      const response = await request(app)
        .get('/api/calculos/historico?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 5);
    });
  });
});