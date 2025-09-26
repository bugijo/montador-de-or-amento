const request = require('supertest');
const { sequelize } = require('../../src/models');
const App = require('../../src/app');

describe('Testes de Integração - Vendas/Orçamentos', () => {
  let app;
  let vendedorToken;
  let adminToken;
  let produtoId;
  let vendaId;

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
    vendedorToken = vendedorLogin.body.token;

    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@exemplo.com',
        senha: '123456'
      });
    adminToken = adminLogin.body.token;

    // Criar produto de teste
    const produto = await sequelize.models.Produto.create({
      nome: 'Máquina de Corte Laser',
      descricao: 'Máquina para corte de metais',
      tipo: 'Máquina',
      categoria: 'Corte',
      preco_base: 15000.00,
      ativo: true,
      especificacoes: {
        potencia: '2000W',
        area_corte: '1000x600mm'
      }
    });
    produtoId = produto.id;
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/vendas', () => {
    test('Vendedor deve conseguir criar nova venda/orçamento', async () => {
      const novaVenda = {
        cliente_nome: 'Empresa ABC Ltda',
        cliente_email: 'contato@empresaabc.com',
        cliente_telefone: '(11) 99999-9999',
        cliente_cnpj: '12.345.678/0001-90',
        cliente_endereco: {
          rua: 'Rua das Indústrias, 123',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01234-567'
        },
        itens: [
          {
            produto_id: produtoId,
            quantidade: 1,
            preco_unitario: 15000.00,
            desconto_percentual: 5,
            observacoes: 'Máquina com garantia estendida'
          }
        ],
        observacoes: 'Cliente interessado em financiamento',
        validade_dias: 30,
        forma_pagamento: 'À vista com desconto',
        prazo_entrega: '45 dias úteis'
      };

      const response = await request(app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send(novaVenda)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('numero_orcamento');
      expect(response.body.data).toHaveProperty('cliente_nome', novaVenda.cliente_nome);
      expect(response.body.data).toHaveProperty('status', 'rascunho');
      expect(response.body.data).toHaveProperty('valor_total');
      expect(response.body.data).toHaveProperty('itens');
      expect(response.body.data.itens).toHaveLength(1);

      vendaId = response.body.data.id;
    });

    test('Deve validar dados obrigatórios', async () => {
      const vendaInvalida = {
        cliente_nome: '',
        itens: []
      };

      const response = await request(app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send(vendaInvalida)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });

    test('Deve calcular valores corretamente', async () => {
      const vendaComDesconto = {
        cliente_nome: 'Cliente Teste Desconto',
        cliente_email: 'desconto@teste.com',
        itens: [
          {
            produto_id: produtoId,
            quantidade: 2,
            preco_unitario: 10000.00,
            desconto_percentual: 10
          }
        ]
      };

      const response = await request(app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send(vendaComDesconto)
        .expect(201);

      expect(response.body.data.valor_bruto).toBe(20000.00);
      expect(response.body.data.valor_desconto).toBe(2000.00);
      expect(response.body.data.valor_total).toBe(18000.00);
    });

    test('Deve rejeitar acesso sem autenticação', async () => {
      const novaVenda = {
        cliente_nome: 'Teste',
        itens: [{ produto_id: produtoId, quantidade: 1, preco_unitario: 1000 }]
      };

      await request(app)
        .post('/api/vendas')
        .send(novaVenda)
        .expect(401);
    });
  });

  describe('GET /api/vendas', () => {
    test('Vendedor deve listar suas vendas', async () => {
      const response = await request(app)
        .get('/api/vendas')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('vendas');
      expect(response.body.data).toHaveProperty('pagination');
      expect(Array.isArray(response.body.data.vendas)).toBe(true);
    });

    test('Admin deve listar todas as vendas', async () => {
      const response = await request(app)
        .get('/api/vendas')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.vendas.length).toBeGreaterThanOrEqual(1);
    });

    test('Deve filtrar vendas por status', async () => {
      const response = await request(app)
        .get('/api/vendas?status=rascunho')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      response.body.data.vendas.forEach(venda => {
        expect(venda.status).toBe('rascunho');
      });
    });

    test('Deve implementar paginação', async () => {
      const response = await request(app)
        .get('/api/vendas?page=1&limit=5')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .expect(200);

      expect(response.body.data.pagination).toHaveProperty('current_page', 1);
      expect(response.body.data.pagination).toHaveProperty('items_per_page', 5);
    });
  });

  describe('GET /api/vendas/:id', () => {
    test('Deve buscar venda específica', async () => {
      const response = await request(app)
        .get(`/api/vendas/${vendaId}`)
        .set('Authorization', `Bearer ${vendedorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('id', vendaId);
      expect(response.body.data).toHaveProperty('itens');
      expect(response.body.data).toHaveProperty('cliente_nome');
    });

    test('Deve retornar erro para venda inexistente', async () => {
      const response = await request(app)
        .get('/api/vendas/99999')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'VENDA_NOT_FOUND');
    });
  });

  describe('PUT /api/vendas/:id', () => {
    test('Vendedor deve conseguir atualizar sua venda em rascunho', async () => {
      const atualizacao = {
        cliente_nome: 'Empresa ABC Ltda - Atualizada',
        observacoes: 'Observações atualizadas'
      };

      const response = await request(app)
        .put(`/api/vendas/${vendaId}`)
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send(atualizacao)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('cliente_nome', atualizacao.cliente_nome);
      expect(response.body.data).toHaveProperty('observacoes', atualizacao.observacoes);
    });

    test('Não deve permitir atualizar venda aprovada', async () => {
      // Primeiro aprovar a venda
      await request(app)
        .patch(`/api/vendas/${vendaId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'aprovado' })
        .expect(200);

      // Tentar atualizar venda aprovada
      const atualizacao = {
        cliente_nome: 'Tentativa de Atualização'
      };

      const response = await request(app)
        .put(`/api/vendas/${vendaId}`)
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send(atualizacao)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'VENDA_CANNOT_BE_UPDATED');
    });
  });

  describe('PATCH /api/vendas/:id/status', () => {
    beforeEach(async () => {
      // Criar nova venda para cada teste de status
      const novaVenda = {
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
        .post('/api/vendas')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send(novaVenda);

      vendaId = response.body.data.id;
    });

    test('Admin deve conseguir aprovar venda', async () => {
      const response = await request(app)
        .patch(`/api/vendas/${vendaId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'aprovado' })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('status', 'aprovado');
    });

    test('Vendedor não deve conseguir aprovar venda', async () => {
      const response = await request(app)
        .patch(`/api/vendas/${vendaId}/status`)
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send({ status: 'aprovado' })
        .expect(403);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'INSUFFICIENT_PERMISSIONS');
    });

    test('Deve validar status válidos', async () => {
      const response = await request(app)
        .patch(`/api/vendas/${vendaId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'status_invalido' })
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('errors');
    });
  });

  describe('POST /api/vendas/:id/calcular', () => {
    test('Deve recalcular valores da venda', async () => {
      const response = await request(app)
        .post(`/api/vendas/${vendaId}/calcular`)
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send({
          aplicar_desconto_global: 5,
          incluir_frete: true,
          valor_frete: 500.00
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('valor_total');
      expect(response.body.data).toHaveProperty('valor_frete', 500.00);
    });

    test('Deve retornar erro para venda inexistente', async () => {
      const response = await request(app)
        .post('/api/vendas/99999/calcular')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send({})
        .expect(404);

      expect(response.body).toHaveProperty('success', false);
    });
  });

  describe('GET /api/vendas/:id/pdf', () => {
    test('Deve gerar PDF da venda', async () => {
      const response = await request(app)
        .get(`/api/vendas/${vendaId}/pdf`)
        .set('Authorization', `Bearer ${vendedorToken}`)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/application\/pdf/);
    });
  });

  describe('DELETE /api/vendas/:id', () => {
    test('Admin deve conseguir deletar venda em rascunho', async () => {
      // Criar venda para deletar
      const novaVenda = {
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
        .post('/api/vendas')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send(novaVenda);

      const vendaParaDeletar = createResponse.body.data.id;

      const response = await request(app)
        .delete(`/api/vendas/${vendaParaDeletar}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
    });

    test('Não deve permitir deletar venda aprovada', async () => {
      const response = await request(app)
        .delete(`/api/vendas/${vendaId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'VENDA_CANNOT_BE_DELETED');
    });
  });

  describe('Testes de Validação e Casos de Borda', () => {
    test('Deve validar quantidade mínima de itens', async () => {
      const vendaSemItens = {
        cliente_nome: 'Cliente Sem Itens',
        cliente_email: 'semitens@exemplo.com',
        itens: []
      };

      const response = await request(app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send(vendaSemItens)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors).toContain('Pelo menos um item é obrigatório');
    });

    test('Deve validar produto existente nos itens', async () => {
      const vendaComProdutoInexistente = {
        cliente_nome: 'Cliente Produto Inexistente',
        cliente_email: 'inexistente@exemplo.com',
        itens: [
          {
            produto_id: 99999,
            quantidade: 1,
            preco_unitario: 1000.00
          }
        ]
      };

      const response = await request(app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send(vendaComProdutoInexistente)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('error', 'PRODUTO_NOT_FOUND');
    });

    test('Deve validar desconto máximo permitido', async () => {
      const vendaComDescontoExcessivo = {
        cliente_nome: 'Cliente Desconto Excessivo',
        cliente_email: 'desconto@exemplo.com',
        itens: [
          {
            produto_id: produtoId,
            quantidade: 1,
            preco_unitario: 1000.00,
            desconto_percentual: 101
          }
        ]
      };

      const response = await request(app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send(vendaComDescontoExcessivo)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors).toContain('Desconto não pode ser maior que 100%');
    });

    test('Deve validar formato de email do cliente', async () => {
      const vendaEmailInvalido = {
        cliente_nome: 'Cliente Email Inválido',
        cliente_email: 'email-invalido',
        itens: [
          {
            produto_id: produtoId,
            quantidade: 1,
            preco_unitario: 1000.00
          }
        ]
      };

      const response = await request(app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send(vendaEmailInvalido)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body.errors).toContain('Email deve ter formato válido');
    });

    test('Deve permitir busca por período de datas', async () => {
      const dataInicio = new Date();
      dataInicio.setDate(dataInicio.getDate() - 30);
      const dataFim = new Date();

      const response = await request(app)
        .get(`/api/vendas?data_inicio=${dataInicio.toISOString()}&data_fim=${dataFim.toISOString()}`)
        .set('Authorization', `Bearer ${vendedorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('vendas');
    });

    test('Deve permitir busca por cliente', async () => {
      const response = await request(app)
        .get('/api/vendas?cliente=Empresa ABC')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data).toHaveProperty('vendas');
    });
  });

  describe('Testes de Performance e Limites', () => {
    test('Deve lidar com muitos itens em uma venda', async () => {
      const itens = Array.from({ length: 50 }, (_, index) => ({
        produto_id: produtoId,
        quantidade: 1,
        preco_unitario: 100.00 + index,
        desconto_percentual: 0
      }));

      const vendaComMuitosItens = {
        cliente_nome: 'Cliente Muitos Itens',
        cliente_email: 'muitos@exemplo.com',
        itens
      };

      const response = await request(app)
        .post('/api/vendas')
        .set('Authorization', `Bearer ${vendedorToken}`)
        .send(vendaComMuitosItens)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body.data.itens).toHaveLength(50);
    });

    test('Deve implementar rate limiting para criação de vendas', async () => {
      const vendaRapida = {
        cliente_nome: 'Cliente Rate Limit',
        cliente_email: 'rate@exemplo.com',
        itens: [
          {
            produto_id: produtoId,
            quantidade: 1,
            preco_unitario: 1000.00
          }
        ]
      };

      // Fazer múltiplas requisições rapidamente
      const promises = Array.from({ length: 10 }, () =>
        request(app)
          .post('/api/vendas')
          .set('Authorization', `Bearer ${vendedorToken}`)
          .send(vendaRapida)
      );

      const responses = await Promise.all(promises);
      
      // Pelo menos uma deve ser rejeitada por rate limiting
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });
});