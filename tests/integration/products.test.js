const request = require('supertest');
const { sequelize } = require('../../src/models');
const App = require('../../src/app');

describe('Testes de Integração - Produtos', () => {
  let app;
  let adminToken;
  let vendedorToken;
  let produtoId;

  beforeAll(async () => {
    // Configurar ambiente de teste
    process.env.NODE_ENV = 'test';
    process.env.DB_NAME = 'sistema_orcamentos_test';
    
    // Inicializar aplicação
    app = new App().getApp();
    
    // Limpar banco de dados
    await cleanDatabase();

    // Criar usuários de teste diretamente no banco
    console.log('Criando usuários de teste...');
    const adminUser = await createTestUser({
      nome: 'Admin Teste',
      email: 'admin@teste.com',
      senha: '123456', // Senha em texto plano para que o modelo faça o hash
      role: 'admin',
      ativo: true
    });
    console.log('Admin user criado:', adminUser.id, adminUser.email);

    const vendedorUser = await createTestUser({
      nome: 'Vendedor Teste',
      email: 'vendedor@teste.com',
      senha: '123456', // Senha em texto plano para que o modelo faça o hash
      role: 'vendedor',
      ativo: true
    });
    console.log('Vendedor user criado:', vendedorUser.id, vendedorUser.email);

    // Obter tokens de autenticação
    try {
      const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@teste.com', senha: '123456' });
      
      const vendedorLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'vendedor@teste.com', senha: '123456' });

      console.log('Admin login response:', adminLogin.status, adminLogin.body);
      console.log('Vendedor login response:', vendedorLogin.status, vendedorLogin.body);

      adminToken = adminLogin.body.token;
      vendedorToken = vendedorLogin.body.token;

      console.log('Admin token:', adminToken);
      console.log('Vendedor token:', vendedorToken);
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('Criação de Produtos', () => {
    test('1. Criação de um novo produto (Máquina) com dados válidos', async () => {
      const produtoData = {
        nome: 'Escavadeira Hidráulica CAT 320',
        descricao: 'Escavadeira hidráulica de alta performance para construção civil',
        tipo: 'Máquina',
        categoria: 'maquinas',
        subcategoria: 'escavadeiras',
        preco_base: 450000.00,
        marca: 'Caterpillar',
        modelo: '320',
        ano: 2024,
        especificacoes_tecnicas: {
          peso: '20000kg',
          potencia: '122kW',
          capacidade_balde: '1.2m³',
          alcance_maximo: '9.5m'
        },
        disponivel: true,
        imagens: [
          'https://exemplo.com/cat320-1.jpg',
          'https://exemplo.com/cat320-2.jpg'
        ]
      };

      const response = await request(app)
        .post('/api/produtos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(produtoData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('produto');
      expect(response.body.data.produto).toHaveProperty('id');
      expect(response.body.data.produto).toHaveProperty('nome', produtoData.nome);
      expect(response.body.data.produto).toHaveProperty('categoria', produtoData.categoria);
      expect(response.body.data.produto).toHaveProperty('tipo', produtoData.tipo);
      expect(response.body.data.produto).toHaveProperty('especificacoes_tecnicas');
      expect(response.body.data.produto.especificacoes_tecnicas).toHaveProperty('peso', produtoData.especificacoes_tecnicas.peso);

      // Salvar ID do produto para testes posteriores
      produtoId = response.body.data.produto.id;
    });

    test('2. Tentativa de criação de produto com dados inválidos (sem nome)', async () => {
      const produtoInvalido = {
        descricao: 'Produto sem nome',
        categoria: 'maquinas',
        preco_base: 100000.00
      };

      const response = await request(app)
        .post('/api/produtos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(produtoInvalido)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
      expect(response.body).toHaveProperty('errors');
      expect(response.body.errors).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            field: 'nome'
          })
        ])
      );
    });

    test('3. Tentativa de criação de produto sem autenticação', async () => {
      const produtoData = {
        nome: 'Produto Teste',
        categoria: 'maquinas',
        preco_base: 50000.00
      };

      const response = await request(app)
        .post('/api/produtos')
        .send(produtoData)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'MISSING_TOKEN');
    });

    test('4. Tentativa de criação de produto com token de vendedor (sem permissão)', async () => {
      const produtoData = {
        nome: 'Produto Vendedor',
        categoria: 'maquinas',
        preco_base: 75000.00
      };

      const response = await request(app)
        .post('/api/produtos')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send(produtoData)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('Busca de Produtos', () => {
    test('5. Busca de todos os produtos e verificação se o produto recém-criado está na lista', async () => {
      const response = await request(app)
        .get('/api/produtos')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('produtos');
      expect(Array.isArray(response.body.data.produtos)).toBe(true);
      expect(response.body.data.produtos.length).toBeGreaterThan(0);

      // Verificar se o produto criado está na lista
      const produtoEncontrado = response.body.data.produtos.find(p => p.id === produtoId);
      expect(produtoEncontrado).toBeDefined();
      expect(produtoEncontrado).toHaveProperty('nome', 'Escavadeira Hidráulica CAT 320');
    });

    test('6. Busca de produto por ID', async () => {
      const response = await request(app)
        .get(`/api/produtos/${produtoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('produto');
      expect(response.body.data.produto).toHaveProperty('id', produtoId);
      expect(response.body.data.produto).toHaveProperty('nome', 'Escavadeira Hidráulica CAT 320');
      expect(response.body.data.produto).toHaveProperty('especificacoes_tecnicas');
    });

    test('7. Busca de produto por ID inexistente', async () => {
      const response = await request(app)
        .get('/api/produtos/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'PRODUCT_NOT_FOUND');
    });

    test('8. Busca de produtos por categoria (máquinas)', async () => {
      const response = await request(app)
        .get('/api/produtos/maquinas')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('maquinas');
      expect(Array.isArray(response.body.data.maquinas)).toBe(true);
      
      // Todos os produtos devem ser do tipo máquinas
      response.body.data.maquinas.forEach(produto => {
        expect(produto).toHaveProperty('tipo', 'Máquina');
      });
    });

    test('9. Busca com filtros de preço', async () => {
      const response = await request(app)
        .get('/api/produtos?precoMin=400000&precoMax=500000')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('produtos');
      
      // Verificar se os produtos estão dentro da faixa de preço
      response.body.data.produtos.forEach(produto => {
        expect(produto.preco_base).toBeGreaterThanOrEqual(400000);
        expect(produto.preco_base).toBeLessThanOrEqual(500000);
      });
    });
  });

  describe('Atualização de Produtos', () => {
    test('10. Atualização de um produto existente', async () => {
      const dadosAtualizacao = {
        nome: 'Escavadeira Hidráulica CAT 320 - ATUALIZADA',
        preco_base: 475000.00,
        descricao: 'Escavadeira hidráulica de alta performance - Versão atualizada',
        especificacoes_tecnicas: {
          peso: '20500kg',
          potencia: '125kW',
          capacidade_balde: '1.3m³',
          alcance_maximo: '9.8m'
        }
      };

      const response = await request(app)
        .put(`/api/produtos/${produtoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(dadosAtualizacao)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('produto');
      expect(response.body.data.produto).toHaveProperty('nome', dadosAtualizacao.nome);
      expect(response.body.data.produto).toHaveProperty('preco_base', dadosAtualizacao.preco_base);
      expect(response.body.data.produto.especificacoes_tecnicas).toHaveProperty('peso', dadosAtualizacao.especificacoes_tecnicas.peso);
    });

    test('11. Tentativa de atualização de produto inexistente', async () => {
      const response = await request(app)
        .put('/api/produtos/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Produto Inexistente'
        })
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'PRODUCT_NOT_FOUND');
    });

    test('12. Tentativa de atualização sem autenticação', async () => {
      const response = await request(app)
        .put(`/api/produtos/${produtoId}`)
        .send({
          nome: 'Tentativa sem auth'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'MISSING_TOKEN');
    });

    test('13. Tentativa de atualização com token de vendedor (sem permissão)', async () => {
      const response = await request(app)
        .put(`/api/produtos/${produtoId}`)
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send({
          nome: 'Tentativa vendedor'
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'INSUFFICIENT_PERMISSIONS');
    });
  });

  describe('Exclusão de Produtos', () => {
    test('14. Tentativa de exclusão sem autenticação', async () => {
      const response = await request(app)
        .delete(`/api/produtos/${produtoId}`)
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'MISSING_TOKEN');
    });

    test('15. Tentativa de exclusão com token de vendedor (sem permissão)', async () => {
      const response = await request(app)
        .delete(`/api/produtos/${produtoId}`)
        .set('Authorization', `Bearer ${vendedorToken}`)
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'INSUFFICIENT_PERMISSIONS');
    });

    test('16. Tentativa de exclusão de produto inexistente', async () => {
      const response = await request(app)
        .delete('/api/produtos/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'PRODUCT_NOT_FOUND');
    });

    test('17. Exclusão de um produto (deve ser o último teste)', async () => {
      const response = await request(app)
        .delete(`/api/produtos/${produtoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');

      // Verificar se o produto foi realmente excluído
      const verificacao = await request(app)
        .get(`/api/produtos/${produtoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(verificacao.body).toHaveProperty('success', false);
      expect(verificacao.body).toHaveProperty('error', 'PRODUCT_NOT_FOUND');
    });
  });

  describe('Testes de Validação e Edge Cases', () => {
    test('18. Criação de produto com preço negativo (deve falhar)', async () => {
      const produtoInvalido = {
        nome: 'Produto Preço Negativo',
        tipo: 'Máquina',
        preco_base: -1000.00
      };

      const response = await request(app)
        .post('/api/produtos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(produtoInvalido)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
    });

    test('19. Criação de produto com tipo inválido', async () => {
      const produtoInvalido = {
        nome: 'Produto Tipo Inválido',
        tipo: 'TipoInexistente',
        preco_base: 50000.00
      };

      const response = await request(app)
        .post('/api/produtos')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(produtoInvalido)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
    });

    test('20. Busca com parâmetros de paginação', async () => {
      // Primeiro criar alguns produtos para testar paginação
      for (let i = 1; i <= 3; i++) {
        await request(app)
          .post('/api/produtos')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            nome: `Produto Paginação ${i}`,
            tipo: 'Acessório',
            preco_base: 1000 * i
          });
      }

      const response = await request(app)
        .get('/api/produtos?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('produtos');
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('current_page', 1);
      expect(response.body.data.pagination).toHaveProperty('items_per_page', 2);
      expect(response.body.data.produtos.length).toBeLessThanOrEqual(2);
    });
  });
});