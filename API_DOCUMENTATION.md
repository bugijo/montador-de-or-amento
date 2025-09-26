# Documentação da API - Sistema de Orçamentos

## 📋 Visão Geral

Esta API RESTful fornece funcionalidades completas para um sistema de orçamentos, incluindo gerenciamento de produtos, fórmulas de cálculo e autenticação de usuários.

**Base URL**: `http://localhost:3000/api`

## 🔐 Autenticação

A API utiliza JWT (JSON Web Tokens) para autenticação. Após o login, inclua o token no header `Authorization`:

```
Authorization: Bearer <seu_token_aqui>
```

### Roles de Usuário

- **admin**: Acesso completo (CRUD em todos os recursos)
- **vendedor**: Acesso de leitura e cálculo de fórmulas

## 📡 Endpoints

### 🔑 Autenticação

#### POST /auth/login
Realiza login do usuário.

**Request:**
```json
{
  "email": "admin@sistema-orcamentos.com",
  "senha": "admin123"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login realizado com sucesso",
  "data": {
    "user": {
      "id": 1,
      "nome": "Administrador",
      "email": "admin@sistema-orcamentos.com",
      "role": "admin",
      "ativo": true
    },
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": "24h"
  }
}
```

#### POST /auth/register
Registra novo usuário (apenas admins).

**Headers:** `Authorization: Bearer <admin_token>`

**Request:**
```json
{
  "nome": "Novo Vendedor",
  "email": "vendedor@exemplo.com",
  "senha": "senha123",
  "role": "vendedor"
}
```

#### POST /auth/refresh
Renova o token de acesso.

**Request:**
```json
{
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### GET /auth/me
Retorna informações do usuário atual.

**Headers:** `Authorization: Bearer <token>`

#### PUT /auth/change-password
Altera senha do usuário.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "senha_atual": "senha_antiga",
  "nova_senha": "nova_senha123"
}
```

### 🏭 Produtos

#### GET /produtos
Lista produtos com paginação e filtros.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page` (int): Página (padrão: 1)
- `limit` (int): Itens por página (padrão: 10, máx: 100)
- `sort` (string): Campo de ordenação (id, nome, created_at, updated_at)
- `order` (string): Ordem (ASC, DESC)
- `tipo` (string): Filtro por tipo (Máquina, Acessório)
- `categoria` (string): Filtro por categoria
- `ativo` (boolean): Filtro por status ativo
- `search` (string): Busca por nome, descrição ou código

**Response (200):**
```json
{
  "success": true,
  "data": {
    "produtos": [
      {
        "id": 1,
        "nome": "Máquina de Corte Industrial MCI-2000",
        "descricao": "Máquina de corte industrial de alta precisão",
        "tipo": "Máquina",
        "preco_base": "15000.00",
        "unidade_medida": "unidade",
        "ativo": true,
        "codigo_interno": "MCI-2000",
        "categoria": "Corte Industrial",
        "formulas": []
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 50,
      "items_per_page": 10,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

#### GET /produtos/:id
Busca produto específico.

**Headers:** `Authorization: Bearer <token>`

**Response (200):**
```json
{
  "success": true,
  "data": {
    "produto": {
      "id": 1,
      "nome": "Máquina de Corte Industrial MCI-2000",
      "descricao": "Máquina de corte industrial de alta precisão",
      "tipo": "Máquina",
      "preco_base": "15000.00",
      "unidade_medida": "unidade",
      "ativo": true,
      "codigo_interno": "MCI-2000",
      "categoria": "Corte Industrial",
      "peso": "250.500",
      "dimensoes": {
        "largura": 120,
        "altura": 80,
        "profundidade": 60
      },
      "especificacoes_tecnicas": {
        "potencia": "5HP",
        "voltagem": "220V",
        "frequencia": "60Hz"
      },
      "formulas": []
    }
  }
}
```

#### POST /produtos
Cria novo produto (apenas admins).

**Headers:** `Authorization: Bearer <admin_token>`

**Request:**
```json
{
  "nome": "Nova Máquina XYZ",
  "descricao": "Descrição da nova máquina",
  "tipo": "Máquina",
  "preco_base": 20000.00,
  "unidade_medida": "unidade",
  "codigo_interno": "XYZ-001",
  "categoria": "Categoria Nova",
  "peso": 300.0,
  "dimensoes": {
    "largura": 150,
    "altura": 100,
    "profundidade": 80
  }
}
```

#### PUT /produtos/:id
Atualiza produto (apenas admins).

**Headers:** `Authorization: Bearer <admin_token>`

**Request:**
```json
{
  "nome": "Nome Atualizado",
  "preco_base": 22000.00,
  "ativo": true
}
```

#### DELETE /produtos/:id
Remove produto (apenas admins).

**Headers:** `Authorization: Bearer <admin_token>`

#### GET /produtos/maquinas
Lista apenas máquinas.

#### GET /produtos/acessorios
Lista apenas acessórios.

**Query Parameters:**
- `maquina_id` (int): Filtra acessórios compatíveis com a máquina

#### GET /produtos/categorias
Lista categorias disponíveis.

### 🧮 Fórmulas

#### GET /formulas
Lista fórmulas com paginação e filtros.

**Headers:** `Authorization: Bearer <token>`

**Query Parameters:**
- `page`, `limit`, `sort`, `order`: Paginação
- `produto_id` (int): Filtro por produto
- `maquina_id` (int): Filtro por máquina
- `ativo` (boolean): Filtro por status
- `search` (string): Busca textual

**Response (200):**
```json
{
  "success": true,
  "data": {
    "formulas": [
      {
        "id": 1,
        "nome": "Cálculo de Lâminas por Área",
        "formula": "m2 / 10",
        "descricao": "Calcula quantidade de lâminas por área",
        "unidade_resultado": "unidade",
        "ativo": true,
        "prioridade": 10,
        "produto": {
          "id": 3,
          "nome": "Lâmina de Corte Diamantada",
          "tipo": "Acessório"
        },
        "maquina": {
          "id": 1,
          "nome": "Máquina de Corte Industrial",
          "tipo": "Máquina"
        }
      }
    ],
    "pagination": { /* ... */ }
  }
}
```

#### GET /formulas/:id
Busca fórmula específica.

#### POST /formulas
Cria nova fórmula (apenas admins).

**Headers:** `Authorization: Bearer <admin_token>`

**Request:**
```json
{
  "produto_id": 3,
  "maquina_id": 1,
  "formula": "area * 0.1 + 2",
  "nome": "Nova Fórmula de Cálculo",
  "descricao": "Descrição da fórmula",
  "variaveis_entrada": [
    {
      "nome": "area",
      "tipo": "decimal",
      "descricao": "Área em metros quadrados",
      "unidade": "m²",
      "obrigatorio": true,
      "minimo": 0.1,
      "maximo": 1000
    }
  ],
  "unidade_resultado": "unidade",
  "prioridade": 5,
  "validacao_minima": 0.1,
  "validacao_maxima": 100
}
```

#### PUT /formulas/:id
Atualiza fórmula (apenas admins).

#### DELETE /formulas/:id
Remove fórmula (apenas admins).

#### POST /formulas/:id/calcular
Calcula resultado da fórmula.

**Headers:** `Authorization: Bearer <token>`

**Request:**
```json
{
  "variaveis": {
    "m2": 50,
    "area": 25.5
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Cálculo realizado com sucesso",
  "data": {
    "formula_id": 1,
    "formula_nome": "Cálculo de Lâminas por Área",
    "resultado": 5.0,
    "unidade": "unidade",
    "formula_usada": "m2 / 10",
    "variaveis_usadas": {
      "m2": 50
    }
  }
}
```

#### POST /formulas/testar
Testa fórmula sem salvar (apenas admins).

**Headers:** `Authorization: Bearer <admin_token>`

**Request:**
```json
{
  "formula": "area * 2 + 1",
  "variaveis": {
    "area": 10
  }
}
```

#### GET /formulas/produto/:produto_id/maquina/:maquina_id
Busca fórmulas por produto e máquina.

### 🔧 Utilitários

#### GET /health
Health check da API.

**Response (200):**
```json
{
  "success": true,
  "message": "API Sistema de Orçamentos funcionando",
  "timestamp": "2024-12-01T10:00:00.000Z",
  "version": "1.0.0",
  "environment": "development"
}
```

#### GET /info
Informações da API.

## 📊 Códigos de Status

- **200**: Sucesso
- **201**: Criado com sucesso
- **400**: Dados inválidos
- **401**: Não autorizado
- **403**: Acesso negado
- **404**: Não encontrado
- **409**: Conflito (recurso já existe)
- **429**: Muitas requisições
- **500**: Erro interno do servidor

## 🚨 Tratamento de Erros

Todas as respostas de erro seguem o padrão:

```json
{
  "success": false,
  "message": "Descrição do erro",
  "error": "CODIGO_DO_ERRO",
  "details": { /* detalhes adicionais */ }
}
```

### Códigos de Erro Comuns

- `VALIDATION_ERROR`: Dados de entrada inválidos
- `INVALID_CREDENTIALS`: Credenciais incorretas
- `EXPIRED_TOKEN`: Token expirado
- `INSUFFICIENT_PERMISSIONS`: Permissões insuficientes
- `RESOURCE_NOT_FOUND`: Recurso não encontrado
- `RATE_LIMIT_EXCEEDED`: Limite de requisições excedido

## 🔒 Rate Limiting

- **Geral**: 100 requisições por 15 minutos por IP
- **Autenticação**: 5 tentativas por 15 minutos por IP
- **Criação**: 10 criações por minuto por IP

## 📝 Exemplos com cURL

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sistema-orcamentos.com",
    "senha": "admin123"
  }'
```

### Listar Produtos
```bash
curl -X GET "http://localhost:3000/api/produtos?page=1&limit=5" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

### Criar Produto
```bash
curl -X POST http://localhost:3000/api/produtos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "nome": "Nova Máquina",
    "descricao": "Descrição da máquina",
    "tipo": "Máquina",
    "preco_base": 15000.00,
    "unidade_medida": "unidade"
  }'
```

### Calcular Fórmula
```bash
curl -X POST http://localhost:3000/api/formulas/1/calcular \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "variaveis": {
      "m2": 100
    }
  }'
```

## 🧪 Testando a API

Recomendamos usar ferramentas como:
- **Postman**: Interface gráfica
- **Insomnia**: Cliente REST
- **cURL**: Linha de comando
- **HTTPie**: Cliente HTTP amigável

### Collection do Postman

Uma collection do Postman está disponível com todos os endpoints configurados. Importe o arquivo `postman_collection.json` (se disponível) para começar rapidamente.

## 📚 Recursos Adicionais

- **Logs**: Verifique os logs do servidor para debugging
- **Validação**: Todos os campos são validados conforme especificação
- **Paginação**: Use os parâmetros de paginação para grandes datasets
- **Filtros**: Combine múltiplos filtros para busca precisa

Para mais informações, consulte o README.md principal do projeto.