const request = require('supertest');
const { sequelize } = require('../../src/models');
const App = require('../../src/app');

describe('Testes de Integração - Orçamentos', () => {
  let app;
  let authToken;
  let adminToken;
  let produtoId;
  let formulaId;
  let orcamentoId;

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
      nome: 'Fórmula Teste',
      descricao: 'Fórmula para testes',
      categoria: 'categoria_teste',
      formula: 'preco_base * 1.2',
      variaveis: ['preco_base'],
      ativo: true
    });
    formulaId = formula.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/orcamentos', () => {
    test('Vendedor deve conseguir criar orçamento', async () => {
      const novoOrcamento = {
        cliente_nome: 'Cliente Teste',
        cliente_email: 'cliente@exemplo.com',
        cliente_telefone: '(11) 99999-9999',
        cliente_empresa: 'Empresa Teste Ltda',
        itens: [
          {
            produto_id: produtoId,
            quantidade: 2,
            preco_unitario: 10000.00,
            desconto_percentual: 5,
            observacoes: 'Item de teste'
          }
        ],
        observacoes: 'Orçamento de teste',
        validade_dias: 30
      };

      const response = await request(app)
        .post('/api/orcamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(novoOrcamento)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('cliente_nome', novoOrcamento.cliente_nome);
      expect(response.body.data).toHaveProperty('numero');
      expect(response.body.data).toHaveProperty('status', 'rascunho');
      expect(response.body.data).toHaveProperty('itens');
      expect(response.body.data.itens).toHaveLength(1);

      orcamentoId = response.body.data.id;
    });

    test('Deve validar campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/orcamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
    });

    test('Deve validar email do cliente', async () => {
      const orcamentoInvalido = {
        cliente_nome: 'Cliente Teste',
        cliente_email: 'email-invalido',
        itens: [
          {
            produto_id: produtoId,
            quantidade: 1,
            preco_unitario: 10000.00
          }
        ]
      };

      const response = await request(app)
        .post('/api/orcamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orcamentoInvalido)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
    });

    test('Deve rejeitar criação sem autenticação', async () => {
      const novoOrcamento = {
        cliente_nome: 'Cliente Teste',
        cliente_email: 'cliente@exemplo.com',
        itens: []
      };

      const response = await request(app)
        .post('/api/orcamentos')
        .send(novoOrcamento)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'MISSING_TOKEN');
    });
  });

  describe('GET /api/orcamentos', () => {
    test('Vendedor deve listar seus orçamentos', async () => {
      const response = await request(app)
        .get('/api/orcamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('Admin deve listar todos os orçamentos', async () => {
      const response = await request(app)
        .get('/api/orcamentos')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    test('Deve filtrar orçamentos por status', async () => {
      const response = await request(app)
        .get('/api/orcamentos?status=rascunho')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.every(o => o.status === 'rascunho')).toBe(true);
    });

    test('Deve paginar resultados', async () => {
      const response = await request(app)
        .get('/api/orcamentos?page=1&limit=5')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 5);
    });
  });

  describe('GET /api/orcamentos/:id', () => {
    test('Vendedor deve acessar seu próprio orçamento', async () => {
      const response = await request(app)
        .get(`/api/orcamentos/${orcamentoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', orcamentoId);
      expect(response.body.data).toHaveProperty('itens');
    });

    test('Deve retornar 404 para orçamento inexistente', async () => {
      const response = await request(app)
        .get('/api/orcamentos/99999')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'ORCAMENTO_NOT_FOUND');
    });
  });

  describe('PUT /api/orcamentos/:id', () => {
    test('Vendedor deve conseguir atualizar seu orçamento', async () => {
      const atualizacao = {
        cliente_nome: 'Cliente Atualizado',
        observacoes: 'Orçamento atualizado'
      };

      const response = await request(app)
        .put(`/api/orcamentos/${orcamentoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(atualizacao)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('cliente_nome', atualizacao.cliente_nome);
      expect(response.body.data).toHaveProperty('observacoes', atualizacao.observacoes);
    });

    test('Não deve permitir atualizar orçamento aprovado', async () => {
      // Primeiro, aprovar o orçamento
      await request(app)
        .patch(`/api/orcamentos/${orcamentoId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'aprovado' })
        .expect(200);

      // Tentar atualizar orçamento aprovado
      const atualizacao = {
        cliente_nome: 'Tentativa de Atualização'
      };

      const response = await request(app)
        .put(`/api/orcamentos/${orcamentoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(atualizacao)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'ORCAMENTO_CANNOT_BE_UPDATED');
    });
  });

  describe('PATCH /api/orcamentos/:id/status', () => {
    beforeEach(async () => {
      // Criar novo orçamento para cada teste de status
      const novoOrcamento = {
        cliente_nome: 'Cliente Status',
        cliente_email: 'status@exemplo.com',
        itens: [
          {
            produto_id: produtoId,
            quantidade: 1,
            preco_unitario: 10000.00
          }
        ]
      };

      const response = await request(app)
        .post('/api/orcamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(novoOrcamento);

      orcamentoId = response.body.data.id;
    });

    test('Admin deve conseguir aprovar orçamento', async () => {
      const response = await request(app)
        .patch(`/api/orcamentos/${orcamentoId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'aprovado' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status', 'aprovado');
    });

    test('Vendedor não deve conseguir aprovar orçamento', async () => {
      const response = await request(app)
        .patch(`/api/orcamentos/${orcamentoId}/status`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ status: 'aprovado' })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'INSUFFICIENT_PERMISSIONS');
    });

    test('Deve validar status válido', async () => {
      const response = await request(app)
        .patch(`/api/orcamentos/${orcamentoId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'status_invalido' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'INVALID_STATUS');
    });
  });

  describe('POST /api/orcamentos/:id/calcular', () => {
    test('Deve calcular orçamento com fórmula', async () => {
      const response = await request(app)
        .post(`/api/orcamentos/${orcamentoId}/calcular`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ formula_id: formulaId })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('valor_total');
      expect(response.body.data).toHaveProperty('itens');
    });

    test('Deve retornar erro para fórmula inexistente', async () => {
      const response = await request(app)
        .post(`/api/orcamentos/${orcamentoId}/calcular`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ formula_id: 99999 })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'FORMULA_NOT_FOUND');
    });
  });

  describe('GET /api/orcamentos/:id/pdf', () => {
    test('Deve gerar PDF do orçamento', async () => {
      const response = await request(app)
        .get(`/api/orcamentos/${orcamentoId}/pdf`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toContain('attachment');
    });
  });

  describe('DELETE /api/orcamentos/:id', () => {
    test('Admin deve conseguir deletar orçamento', async () => {
      // Criar orçamento para deletar
      const novoOrcamento = {
        cliente_nome: 'Cliente Para Deletar',
        cliente_email: 'deletar@exemplo.com',
        itens: [
          {
            produto_id: produtoId,
            quantidade: 1,
            preco_unitario: 5000.00
          }
        ]
      };

      const createResponse = await request(app)
        .post('/api/orcamentos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(novoOrcamento);

      const orcamentoParaDeletar = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/orcamentos/${orcamentoParaDeletar}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Orçamento removido com sucesso');
    });

    test('Vendedor não deve conseguir deletar orçamento', async () => {
      const response = await request(app)
        .delete(`/api/orcamentos/${orcamentoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'INSUFFICIENT_PERMISSIONS');
    });
  });
});