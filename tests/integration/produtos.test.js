const request = require('supertest');
const { sequelize } = require('../../src/models');
const App = require('../../src/app');

describe('Testes de Integração - Produtos', () => {
  let app;
  let authToken;
  let adminToken;
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
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('GET /api/produtos', () => {
    test('Deve listar produtos sem autenticação', async () => {
      const response = await request(app)
        .get('/api/produtos')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('Deve filtrar produtos por categoria', async () => {
      const response = await request(app)
        .get('/api/produtos?categoria=categoria_teste')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.every(p => p.categoria === 'categoria_teste')).toBe(true);
    });

    test('Deve buscar produtos por nome', async () => {
      const response = await request(app)
        .get('/api/produtos?search=Máquina')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.some(p => p.nome.includes('Máquina'))).toBe(true);
    });

    test('Deve paginar resultados', async () => {
      const response = await request(app)
        .get('/api/produtos?page=1&limit=5')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('page', 1);
      expect(response.body.pagination).toHaveProperty('limit', 5);
    });
  });

  describe('GET /api/produtos/:id', () => {
    test('Deve retornar produto específico', async () => {
      const response = await request(app)
        .get(`/api/produtos/${produtoId}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id', produtoId);
      expect(response.body.data).toHaveProperty('nome', 'Máquina Teste');
    });

    test('Deve retornar 404 para produto inexistente', async () => {
      const response = await request(app)
        .get('/api/produtos/99999')
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'PRODUTO_NOT_FOUND');
    });
  });

  describe('POST /api/produtos', () => {
    test('Admin deve conseguir criar produto', async () => {
      const novoProduto = {
        nome: 'Nova Máquina',
        descricao: 'Descrição da nova máquina',
        categoria: 'nova_categoria',
        preco_base: 15000.00,
        especificacoes: {
          potencia: '150HP',
          peso: '1200kg'
        }
      };

      const response = await request(app)
        .post('/api/produtos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(novoProduto)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('nome', novoProduto.nome);
      expect(response.body.data).toHaveProperty('preco_base', novoProduto.preco_base);
    });

    test('Vendedor não deve conseguir criar produto', async () => {
      const novoProduto = {
        nome: 'Máquina Não Autorizada',
        descricao: 'Descrição',
        categoria: 'categoria',
        preco_base: 10000.00
      };

      const response = await request(app)
        .post('/api/produtos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(novoProduto)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'INSUFFICIENT_PERMISSIONS');
    });

    test('Deve validar campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/produtos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
    });

    test('Deve rejeitar criação sem autenticação', async () => {
      const novoProduto = {
        nome: 'Máquina Sem Auth',
        descricao: 'Descrição',
        categoria: 'categoria',
        preco_base: 10000.00
      };

      const response = await request(app)
        .post('/api/produtos')
        .send(novoProduto)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'MISSING_TOKEN');
    });
  });

  describe('PUT /api/produtos/:id', () => {
    test('Admin deve conseguir atualizar produto', async () => {
      const atualizacao = {
        nome: 'Máquina Atualizada',
        preco_base: 12000.00
      };

      const response = await request(app)
        .put(`/api/produtos/${produtoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(atualizacao)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('nome', atualizacao.nome);
      expect(response.body.data).toHaveProperty('preco_base', atualizacao.preco_base);
    });

    test('Vendedor não deve conseguir atualizar produto', async () => {
      const atualizacao = {
        nome: 'Tentativa de Atualização'
      };

      const response = await request(app)
        .put(`/api/produtos/${produtoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(atualizacao)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('DELETE /api/produtos/:id', () => {
    test('Admin deve conseguir deletar produto', async () => {
      // Criar produto para deletar
      const produto = await sequelize.models.Produto.create({
        nome: 'Produto Para Deletar',
        descricao: 'Será deletado',
        categoria: 'teste',
        preco_base: 5000.00,
        ativo: true
      });

      const response = await request(app)
        .delete(`/api/produtos/${produto.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Produto removido com sucesso');

      // Verificar se foi realmente deletado
      const produtoDeletado = await sequelize.models.Produto.findByPk(produto.id);
      expect(produtoDeletado).toBeNull();
    });

    test('Vendedor não deve conseguir deletar produto', async () => {
      const response = await request(app)
        .delete(`/api/produtos/${produtoId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'INSUFFICIENT_PERMISSIONS');
    });
  });
});