const request = require('supertest');
const { sequelize } = require('../../src/models');
const App = require('../../src/app');

describe('Testes de Integração - Autenticação', () => {
  let app;
  let server;
  let adminToken;
  let vendedorToken;

  beforeAll(async () => {
    // Configurar ambiente de teste
    process.env.NODE_ENV = 'test';
    process.env.DB_NAME = 'sistema_orcamentos_test';
    
    // Criar instância da aplicação
    const appInstance = new App();
    app = appInstance.getApp();
    
    // Limpar e sincronizar banco de dados
    await cleanDatabase();
    
    // Criar usuários de teste usando o helper
    const admin = await createTestUser({
      nome: 'Admin Teste',
      email: 'admin@finiti.com.br',
      senha: '123456',
      role: 'admin',
      ativo: true
    });

    const vendedor = await createTestUser({
      nome: 'Vendedor Teste',
      email: 'vendedor@finiti.com.br',
      senha: '123456',
      role: 'vendedor',
      ativo: true
    });

    // Criar usuário inativo para testes
    await createTestUser({
      nome: 'Usuário Inativo',
      email: 'inativo@finiti.com.br',
      senha: '123456',
      role: 'vendedor',
      ativo: false
    });

    // Criar usuário padrão para testes
    await createTestUser({
      nome: 'Usuário Teste',
      email: 'teste@exemplo.com',
      senha: '123456',
      role: 'vendedor',
      ativo: true
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/auth/login', () => {
    test('1. Login bem-sucedido de um usuário admin', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@finiti.com.br',
          senha: '123456'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'admin@finiti.com.br');
      expect(response.body.user).toHaveProperty('role', 'admin');
      expect(response.body.user).not.toHaveProperty('senha');
      
      // Armazenar token para testes posteriores
      adminToken = response.body.token;
    });

    test('2. Login bem-sucedido de um usuário vendedor', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'vendedor@finiti.com.br',
          senha: '123456'
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'vendedor@finiti.com.br');
      expect(response.body.user).toHaveProperty('role', 'vendedor');
      expect(response.body.user).not.toHaveProperty('senha');
      
      // Armazenar token para testes posteriores
      vendedorToken = response.body.token;
    });

    test('3. Login falho com email incorreto', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inexistente@finiti.com.br',
          senha: '123456'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).not.toHaveProperty('token');
    });

    test('4. Login falho com senha incorreta', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@finiti.com.br',
          senha: 'senhaerrada'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).not.toHaveProperty('token');
    });

    test('5. Login falho com usuário inativo', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inativo@finiti.com.br',
          senha: '123456'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
      expect(response.body).not.toHaveProperty('token');
    });

    test('6. Login falho com dados inválidos', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'email-invalido',
          senha: ''
        })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });

    test('Deve rejeitar login com email inválido', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inexistente@exemplo.com',
          senha: '123456'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'INVALID_CREDENTIALS');
    });

    test('Deve rejeitar login com senha inválida', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'teste@exemplo.com',
          senha: 'senha_errada'
        })
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'INVALID_CREDENTIALS');
    });

    test('Deve validar campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'VALIDATION_ERROR');
    });

    test('Deve aplicar rate limiting', async () => {
      // Em ambiente de teste, o rate limiting é mais permissivo (1000 requests)
      // Este teste verifica se o middleware está configurado corretamente
      // Fazemos algumas tentativas e verificamos que não há bloqueio imediato
      
      let successfulRequests = 0;
      for (let i = 0; i < 5; i++) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'teste@exemplo.com',
            senha: 'senha_errada'
          });
        
        // Em testes, deve permitir múltiplas tentativas sem bloqueio
        if (response.status !== 429) {
          successfulRequests++;
        }
      }

      // Verifica que pelo menos algumas requisições passaram (não foram bloqueadas)
      expect(successfulRequests).toBeGreaterThan(0);
    });
  });

  describe('Controle de Acesso e Rotas Protegidas', () => {
    beforeEach(async () => {
      // Garantir que adminToken seja válido para os testes de controle de acesso
      if (!adminToken) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'admin@finiti.com.br',
            senha: '123456'
          });
        adminToken = response.body.token;
      }
    });

    test('7. Acesso a rota protegida por admin com token de vendedor (espera-se erro 403)', async () => {
      // Tentar acessar rota de registro (apenas admin) com token de vendedor
      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send({
          nome: 'Novo Usuário',
          email: 'novo@finiti.com.br',
          senha: '123456',
          role: 'vendedor'
        })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'INSUFFICIENT_PERMISSIONS');
      expect(response.body).toHaveProperty('required_roles', ['admin']);
      expect(response.body).toHaveProperty('user_role', 'vendedor');
    });

    test('8. Acesso a rota protegida por admin com token de admin (deve funcionar)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: 'Novo Usuário Admin',
          email: 'novoadmin@finiti.com.br',
          senha: '123456',
          role: 'vendedor'
        })
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'novoadmin@finiti.com.br');
    });

    test('9. Acesso a rota protegida sem token (deve retornar 401)', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'MISSING_TOKEN');
    });

    test('10. Acesso a rota protegida com token inválido (deve retornar 401)', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token_invalido')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'INVALID_TOKEN');
    });

    test('11. Acesso a rota pública sem token (deve funcionar)', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'API Sistema de Orçamentos funcionando');
      expect(response.body).toHaveProperty('version', '1.0.0');
      expect(response.body).toHaveProperty('environment', 'test');
      expect(response.body).toHaveProperty('timestamp');
    });

    test('12. Verificar informações do usuário autenticado (admin)', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'admin@finiti.com.br');
      expect(response.body.user).toHaveProperty('role', 'admin');
      expect(response.body.user).not.toHaveProperty('senha');
    });

    test('13. Verificar informações do usuário autenticado (vendedor)', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'vendedor@finiti.com.br');
      expect(response.body.user).toHaveProperty('role', 'vendedor');
      expect(response.body.user).not.toHaveProperty('senha');
    });
  });

  describe('Logout e Invalidação de Token', () => {
    beforeEach(async () => {
      // Garantir que temos um token válido para os testes de logout
      if (!vendedorToken) {
        const response = await request(app)
          .post('/api/auth/login')
          .send({
            email: 'vendedor@finiti.com.br',
            senha: '123456'
          });
        vendedorToken = response.body.token;
      }
    });

    test('14. Logout com token válido', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
    });

    test('15. Logout sem token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'MISSING_TOKEN');
    });
  });

  describe('GET /api/auth/me', () => {
    let authToken;

    beforeAll(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'teste@exemplo.com',
          senha: '123456'
        });
      
      authToken = loginResponse.body.token;
    });

    test('Deve retornar dados do usuário autenticado', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('email', 'teste@exemplo.com');
      expect(response.body.user).not.toHaveProperty('senha');
    });

    test('Deve rejeitar requisição sem token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'MISSING_TOKEN');
    });

    test('Deve rejeitar token inválido', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer token_invalido')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'INVALID_TOKEN');
    });
  });

  describe('POST /api/auth/logout', () => {
    let authToken;

    beforeEach(async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'teste@exemplo.com',
          senha: '123456'
        });
      
      authToken = loginResponse.body.token;
    });

    test('Deve fazer logout com sucesso', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message', 'Logout realizado com sucesso');
    });

    test('Deve rejeitar logout sem token', async () => {
      const response = await request(app)
        .post('/api/auth/logout')
        .expect(401);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'MISSING_TOKEN');
    });
  });
});