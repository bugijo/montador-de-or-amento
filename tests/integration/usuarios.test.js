const request = require('supertest');
const app = require('../../src/app');
const { User } = require('../../src/models');
const jwt = require('jsonwebtoken');

describe('Testes de Integração - Usuários', () => {
  let adminToken;
  let vendedorToken;
  let adminUser;
  let vendedorUser;
  let testUserId;

  beforeAll(async () => {
    // Criar usuário admin para testes
    adminUser = await User.create({
      nome: 'Admin Teste',
      email: 'admin.teste@finiti.com',
      senha: 'admin123',
      role: 'admin',
      ativo: true
    });

    // Criar usuário vendedor para testes
    vendedorUser = await User.create({
      nome: 'Vendedor Teste',
      email: 'vendedor.teste@finiti.com',
      senha: 'vendedor123',
      role: 'vendedor',
      ativo: true
    });

    // Gerar tokens JWT
    adminToken = jwt.sign(
      { id: adminUser.id, email: adminUser.email, role: adminUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    vendedorToken = jwt.sign(
      { id: vendedorUser.id, email: vendedorUser.email, role: vendedorUser.role },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Limpar dados de teste
    if (testUserId) {
      await User.destroy({ where: { id: testUserId } });
    }
    await User.destroy({ where: { id: adminUser.id } });
    await User.destroy({ where: { id: vendedorUser.id } });
  });

  describe('GET /api/admin/users', () => {
    it('deve listar usuários para admin', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      
      // Verificar estrutura do usuário
      const user = response.body.data[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('nome');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('ativo');
      expect(user).not.toHaveProperty('senha'); // Senha não deve ser retornada
    });

    it('deve filtrar usuários por role', async () => {
      const response = await request(app)
        .get('/api/admin/users?role=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(user => {
        expect(user.role).toBe('admin');
      });
    });

    it('deve filtrar usuários por status', async () => {
      const response = await request(app)
        .get('/api/admin/users?status=true')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(user => {
        expect(user.ativo).toBe(true);
      });
    });

    it('deve buscar usuários por termo', async () => {
      const response = await request(app)
        .get('/api/admin/users?search=Admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      response.body.data.forEach(user => {
        expect(user.nome.toLowerCase()).toContain('admin');
      });
    });

    it('deve negar acesso para vendedor', async () => {
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .expect(403);
    });

    it('deve negar acesso sem token', async () => {
      await request(app)
        .get('/api/admin/users')
        .expect(401);
    });
  });

  describe('POST /api/admin/users', () => {
    const novoUsuario = {
      nome: 'Novo Usuário Teste',
      email: 'novo.usuario@finiti.com',
      senha: 'senha123',
      role: 'vendedor'
    };

    it('deve criar novo usuário com dados válidos', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(novoUsuario)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.nome).toBe(novoUsuario.nome);
      expect(response.body.data.email).toBe(novoUsuario.email);
      expect(response.body.data.role).toBe(novoUsuario.role);
      expect(response.body.data.ativo).toBe(true);
      expect(response.body.data).not.toHaveProperty('senha');

      testUserId = response.body.data.id;
    });

    it('deve falhar com email duplicado', async () => {
      await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(novoUsuario)
        .expect(400);
    });

    it('deve falhar com dados inválidos', async () => {
      const usuarioInvalido = {
        nome: '',
        email: 'email-invalido',
        senha: '123', // Muito curta
        role: 'role-inexistente'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(usuarioInvalido)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeInstanceOf(Array);
    });

    it('deve falhar sem campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors).toBeInstanceOf(Array);
    });

    it('deve negar acesso para vendedor', async () => {
      await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send(novoUsuario)
        .expect(403);
    });
  });

  describe('GET /api/admin/users/:id', () => {
    it('deve buscar usuário por ID', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${vendedorUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(vendedorUser.id);
      expect(response.body.data.nome).toBe(vendedorUser.nome);
      expect(response.body.data.email).toBe(vendedorUser.email);
      expect(response.body.data).not.toHaveProperty('senha');
    });

    it('deve retornar 404 para usuário inexistente', async () => {
      await request(app)
        .get('/api/admin/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('deve negar acesso para vendedor', async () => {
      await request(app)
        .get(`/api/admin/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${vendedorToken}`)
        .expect(403);
    });
  });

  describe('PUT /api/admin/users/:id', () => {
    const dadosAtualizacao = {
      nome: 'Nome Atualizado',
      email: 'email.atualizado@finiti.com',
      role: 'admin'
    };

    it('deve atualizar usuário com dados válidos', async () => {
      const response = await request(app)
        .put(`/api/admin/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(dadosAtualizacao)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.nome).toBe(dadosAtualizacao.nome);
      expect(response.body.data.email).toBe(dadosAtualizacao.email);
      expect(response.body.data.role).toBe(dadosAtualizacao.role);
    });

    it('deve atualizar senha quando fornecida', async () => {
      const dadosComSenha = {
        ...dadosAtualizacao,
        senha: 'novaSenha123'
      };

      const response = await request(app)
        .put(`/api/admin/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(dadosComSenha)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).not.toHaveProperty('senha');
    });

    it('deve falhar com email duplicado', async () => {
      const dadosComEmailDuplicado = {
        ...dadosAtualizacao,
        email: adminUser.email
      };

      await request(app)
        .put(`/api/admin/users/${testUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send(dadosComEmailDuplicado)
        .expect(400);
    });

    it('deve retornar 404 para usuário inexistente', async () => {
      await request(app)
        .put('/api/admin/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(dadosAtualizacao)
        .expect(404);
    });

    it('deve negar acesso para vendedor', async () => {
      await request(app)
        .put(`/api/admin/users/${testUserId}`)
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send(dadosAtualizacao)
        .expect(403);
    });
  });

  describe('PATCH /api/admin/users/:id/status', () => {
    it('deve ativar usuário', async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${testUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ativo).toBe(true);
    });

    it('deve desativar usuário', async () => {
      const response = await request(app)
        .patch(`/api/admin/users/${testUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.ativo).toBe(false);
    });

    it('deve falhar sem status', async () => {
      await request(app)
        .patch(`/api/admin/users/${testUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);
    });

    it('deve retornar 404 para usuário inexistente', async () => {
      await request(app)
        .patch('/api/admin/users/99999/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: true })
        .expect(404);
    });

    it('deve negar acesso para vendedor', async () => {
      await request(app)
        .patch(`/api/admin/users/${testUserId}/status`)
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send({ status: true })
        .expect(403);
    });
  });

  describe('DELETE /api/admin/users/:id', () => {
    let usuarioParaExcluir;

    beforeEach(async () => {
      usuarioParaExcluir = await User.create({
        nome: 'Usuário Para Excluir',
        email: 'excluir@finiti.com',
        senha: 'senha123',
        role: 'vendedor',
        ativo: true
      });
    });

    it('deve excluir usuário existente', async () => {
      const response = await request(app)
        .delete(`/api/admin/users/${usuarioParaExcluir.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('excluído');

      // Verificar se foi realmente excluído
      const usuarioExcluido = await User.findByPk(usuarioParaExcluir.id);
      expect(usuarioExcluido).toBeNull();
    });

    it('deve retornar 404 para usuário inexistente', async () => {
      await request(app)
        .delete('/api/admin/users/99999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('deve impedir exclusão do próprio usuário', async () => {
      await request(app)
        .delete(`/api/admin/users/${adminUser.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);
    });

    it('deve negar acesso para vendedor', async () => {
      await request(app)
        .delete(`/api/admin/users/${usuarioParaExcluir.id}`)
        .set('Authorization', `Bearer ${vendedorToken}`)
        .expect(403);
    });
  });

  describe('Testes de Permissões e Segurança', () => {
    it('deve validar token JWT válido', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('deve rejeitar token JWT inválido', async () => {
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', 'Bearer token-invalido')
        .expect(401);
    });

    it('deve rejeitar token JWT expirado', async () => {
      const tokenExpirado = jwt.sign(
        { id: adminUser.id, email: adminUser.email, role: adminUser.role },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // Token já expirado
      );

      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${tokenExpirado}`)
        .expect(401);
    });

    it('deve verificar role de admin para rotas administrativas', async () => {
      // Vendedor tentando acessar rota de admin
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .expect(403);
    });

    it('deve permitir acesso apenas a usuários ativos', async () => {
      // Desativar usuário
      await User.update({ ativo: false }, { where: { id: vendedorUser.id } });

      await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .expect(403);

      // Reativar usuário para outros testes
      await User.update({ ativo: true }, { where: { id: vendedorUser.id } });
    });
  });

  describe('Testes de Validação de Dados', () => {
    it('deve validar formato de email', async () => {
      const usuarioEmailInvalido = {
        nome: 'Teste',
        email: 'email-sem-arroba',
        senha: 'senha123',
        role: 'vendedor'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(usuarioEmailInvalido)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors.some(error => 
        error.field === 'email' && error.message.includes('válido')
      )).toBe(true);
    });

    it('deve validar tamanho mínimo da senha', async () => {
      const usuarioSenhaFraca = {
        nome: 'Teste',
        email: 'teste@finiti.com',
        senha: '123',
        role: 'vendedor'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(usuarioSenhaFraca)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors.some(error => 
        error.field === 'senha' && error.message.includes('6')
      )).toBe(true);
    });

    it('deve validar roles permitidas', async () => {
      const usuarioRoleInvalida = {
        nome: 'Teste',
        email: 'teste2@finiti.com',
        senha: 'senha123',
        role: 'role-inexistente'
      };

      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(usuarioRoleInvalida)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors.some(error => 
        error.field === 'role'
      )).toBe(true);
    });

    it('deve validar campos obrigatórios', async () => {
      const response = await request(app)
        .post('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.errors.length).toBeGreaterThan(0);
      
      const camposObrigatorios = ['nome', 'email', 'senha', 'role'];
      camposObrigatorios.forEach(campo => {
        expect(response.body.errors.some(error => error.field === campo)).toBe(true);
      });
    });
  });

  describe('Testes de Performance e Limites', () => {
    it('deve listar usuários com paginação', async () => {
      const response = await request(app)
        .get('/api/admin/users?page=1&limit=10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeLessThanOrEqual(10);
      expect(response.body).toHaveProperty('pagination');
    });

    it('deve limitar resultados de busca', async () => {
      const response = await request(app)
        .get('/api/admin/users?limit=5')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });
});