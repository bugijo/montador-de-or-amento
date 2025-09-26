# 🧪 Plano de Testes - API Sistema de Orçamentos

## 📋 Visão Geral

Este plano de testes garante que todas as funcionalidades da API estejam funcionando corretamente antes da integração com o frontend. Os testes cobrem autenticação, CRUD de produtos e fórmulas, cálculos e controle de acesso.

## 🚀 Pré-requisitos

1. **Servidor da API rodando**: `npm run dev` (porta 3000)
2. **Banco de dados configurado** com migrations e seeders executados
3. **Ferramenta de teste**: cURL, Postman, Insomnia ou HTTPie

## 📊 Cenários de Teste

### 🔐 1. Teste de Login de Administrador

**Objetivo**: Verificar se o login com credenciais de admin funciona corretamente.

#### cURL:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sistema-orcamentos.com",
    "senha": "admin123"
  }'
```

#### Postman:
```json
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@sistema-orcamentos.com",
  "senha": "admin123"
}
```

#### ✅ Resultado Esperado:
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

**⚠️ Importante**: Salve o `access_token` para usar nos próximos testes!

---

### 🔐 2. Teste de Login de Vendedor

**Objetivo**: Verificar se o login com credenciais de vendedor funciona.

#### cURL:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "vendedor@sistema-orcamentos.com",
    "senha": "vendedor123"
  }'
```

#### ✅ Resultado Esperado:
- Status: 200
- Estrutura similar ao admin, mas com `"role": "vendedor"`

---

### 🏭 3. Criação de Novo Produto (Admin)

**Objetivo**: Testar criação de produto usando token de admin.

#### cURL:
```bash
curl -X POST http://localhost:3000/api/produtos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN_AQUI" \
  -d '{
    "nome": "Máquina de Teste API",
    "descricao": "Máquina criada durante teste da API",
    "tipo": "Máquina",
    "preco_base": 25000.00,
    "unidade_medida": "unidade",
    "codigo_interno": "TEST-API-001",
    "categoria": "Teste",
    "peso": 150.5,
    "dimensoes": {
      "largura": 100,
      "altura": 80,
      "profundidade": 60
    },
    "especificacoes_tecnicas": {
      "potencia": "3HP",
      "voltagem": "220V",
      "frequencia": "60Hz"
    }
  }'
```

#### Postman:
```json
POST http://localhost:3000/api/produtos
Authorization: Bearer {{admin_token}}
Content-Type: application/json

{
  "nome": "Máquina de Teste API",
  "descricao": "Máquina criada durante teste da API",
  "tipo": "Máquina",
  "preco_base": 25000.00,
  "unidade_medida": "unidade",
  "codigo_interno": "TEST-API-001",
  "categoria": "Teste",
  "peso": 150.5,
  "dimensoes": {
    "largura": 100,
    "altura": 80,
    "profundidade": 60
  },
  "especificacoes_tecnicas": {
    "potencia": "3HP",
    "voltagem": "220V",
    "frequencia": "60Hz"
  }
}
```

#### ✅ Resultado Esperado:
```json
{
  "success": true,
  "message": "Produto criado com sucesso",
  "data": {
    "produto": {
      "id": 6,
      "nome": "Máquina de Teste API",
      "tipo": "Máquina",
      "preco_base": "25000.00",
      "codigo_interno": "TEST-API-001",
      "created_at": "2024-12-01T...",
      "updated_at": "2024-12-01T..."
    }
  }
}
```

**⚠️ Importante**: Anote o `id` do produto criado para os próximos testes!

---

### 🔧 4. Criação de Acessório Compatível

**Objetivo**: Criar um acessório compatível com a máquina criada.

#### cURL:
```bash
curl -X POST http://localhost:3000/api/produtos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN_AQUI" \
  -d '{
    "nome": "Acessório de Teste API",
    "descricao": "Acessório criado durante teste da API",
    "tipo": "Acessório",
    "maquinas_compativeis": [6],
    "preco_base": 500.00,
    "unidade_medida": "unidade",
    "codigo_interno": "ACC-TEST-001",
    "categoria": "Teste"
  }'
```

**⚠️ Substitua `[6]` pelo ID da máquina criada no teste anterior!

#### ✅ Resultado Esperado:
- Status: 201
- Produto criado com tipo "Acessório"
- Campo `maquinas_compativeis` preenchido

---

### 🧮 5. Criação de Nova Fórmula

**Objetivo**: Criar fórmula associando o acessório à máquina.

#### cURL:
```bash
curl -X POST http://localhost:3000/api/formulas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_ADMIN_AQUI" \
  -d '{
    "produto_id": 7,
    "maquina_id": 6,
    "formula": "area * 0.05 + 1",
    "nome": "Fórmula de Teste API",
    "descricao": "Fórmula criada durante teste da API",
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
    "validacao_maxima": 50
  }'
```

**⚠️ Ajuste os IDs conforme os produtos criados!

#### ✅ Resultado Esperado:
```json
{
  "success": true,
  "message": "Fórmula criada com sucesso",
  "data": {
    "formula": {
      "id": 5,
      "nome": "Fórmula de Teste API",
      "formula": "area * 0.05 + 1",
      "produto_id": 7,
      "maquina_id": 6,
      "created_at": "2024-12-01T..."
    }
  }
}
```

---

### 📋 6. Listagem de Produtos

**Objetivo**: Verificar se os endpoints de listagem retornam dados corretamente.

#### 6.1 Listar Todas as Máquinas:
```bash
curl -X GET "http://localhost:3000/api/produtos/maquinas" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### 6.2 Listar Todos os Acessórios:
```bash
curl -X GET "http://localhost:3000/api/produtos/acessorios" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### 6.3 Listar Produtos com Paginação:
```bash
curl -X GET "http://localhost:3000/api/produtos?page=1&limit=5" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### ✅ Resultado Esperado:
- Status: 200
- Lista de produtos com estrutura de paginação
- Produtos criados nos testes anteriores devem aparecer

---

### 📋 7. Listagem de Fórmulas

**Objetivo**: Verificar listagem de fórmulas.

#### 7.1 Listar Todas as Fórmulas:
```bash
curl -X GET "http://localhost:3000/api/formulas" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

#### 7.2 Buscar Fórmulas por Produto e Máquina:
```bash
curl -X GET "http://localhost:3000/api/formulas/produto/7/maquina/6" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

**⚠️ Ajuste os IDs conforme seus produtos!

#### ✅ Resultado Esperado:
- Status: 200
- Lista de fórmulas incluindo a criada no teste
- Relacionamentos com produtos carregados

---

### 🧮 8. Cálculo de Fórmula

**Objetivo**: Testar a funcionalidade de cálculo com a fórmula criada.

#### cURL:
```bash
curl -X POST http://localhost:3000/api/formulas/5/calcular \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "variaveis": {
      "area": 100
    }
  }'
```

**⚠️ Use o ID da fórmula criada no teste 5!

#### ✅ Resultado Esperado:
```json
{
  "success": true,
  "message": "Cálculo realizado com sucesso",
  "data": {
    "formula_id": 5,
    "formula_nome": "Fórmula de Teste API",
    "resultado": 6.0,
    "unidade": "unidade",
    "formula_usada": "area * 0.05 + 1",
    "variaveis_usadas": {
      "area": 100
    }
  }
}
```

**🧮 Verificação Manual**: 100 * 0.05 + 1 = 6.0 ✅

---

### 🚫 9. Teste de Acesso Negado

**Objetivo**: Verificar se o controle de acesso está funcionando.

#### 9.1 Tentar Criar Produto sem Token:
```bash
curl -X POST http://localhost:3000/api/produtos \
  -H "Content-Type: application/json" \
  -d '{
    "nome": "Produto Sem Auth",
    "tipo": "Máquina"
  }'
```

#### ✅ Resultado Esperado:
```json
{
  "success": false,
  "message": "Token de acesso não fornecido",
  "error": "MISSING_TOKEN"
}
```

#### 9.2 Tentar Criar Produto com Token de Vendedor:
```bash
curl -X POST http://localhost:3000/api/produtos \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_VENDEDOR_AQUI" \
  -d '{
    "nome": "Produto Vendedor",
    "tipo": "Máquina"
  }'
```

#### ✅ Resultado Esperado:
```json
{
  "success": false,
  "message": "Acesso negado. Permissões insuficientes.",
  "error": "INSUFFICIENT_PERMISSIONS"
}
```

---

### 🔄 10. Teste de Refresh Token

**Objetivo**: Verificar renovação de tokens.

#### cURL:
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "SEU_REFRESH_TOKEN_AQUI"
  }'
```

#### ✅ Resultado Esperado:
```json
{
  "success": true,
  "message": "Tokens renovados com sucesso",
  "data": {
    "access_token": "novo_token...",
    "refresh_token": "novo_refresh_token...",
    "token_type": "Bearer",
    "expires_in": "24h"
  }
}
```

---

### ❤️ 11. Health Check

**Objetivo**: Verificar se a API está funcionando.

#### cURL:
```bash
curl -X GET http://localhost:3000/api/health
```

#### ✅ Resultado Esperado:
```json
{
  "success": true,
  "message": "API Sistema de Orçamentos funcionando",
  "timestamp": "2024-12-01T10:00:00.000Z",
  "version": "1.0.0",
  "environment": "development"
}
```

---

## 📊 Checklist de Validação

### ✅ Autenticação
- [ ] Login de admin funciona
- [ ] Login de vendedor funciona
- [ ] Refresh token funciona
- [ ] Logout funciona
- [ ] Acesso negado sem token
- [ ] Acesso negado com role insuficiente

### ✅ Produtos
- [ ] Criar máquina (admin)
- [ ] Criar acessório (admin)
- [ ] Listar máquinas
- [ ] Listar acessórios
- [ ] Buscar produto por ID
- [ ] Paginação funciona
- [ ] Filtros funcionam

### ✅ Fórmulas
- [ ] Criar fórmula (admin)
- [ ] Listar fórmulas
- [ ] Buscar por produto/máquina
- [ ] Calcular fórmula
- [ ] Validação de variáveis
- [ ] Teste de fórmula

### ✅ Segurança
- [ ] Rate limiting funciona
- [ ] Validação de dados
- [ ] Headers de segurança
- [ ] CORS configurado

### ✅ Performance
- [ ] Respostas em < 500ms
- [ ] Paginação eficiente
- [ ] Cache funcionando

---

## 🐛 Troubleshooting

### Problemas Comuns:

1. **Erro 500 - Internal Server Error**
   - Verificar se o banco está rodando
   - Verificar logs do servidor
   - Verificar variáveis de ambiente

2. **Erro 401 - Unauthorized**
   - Verificar se o token está correto
   - Verificar se o token não expirou
   - Verificar formato do header Authorization

3. **Erro 403 - Forbidden**
   - Verificar role do usuário
   - Verificar se o endpoint requer admin

4. **Erro 404 - Not Found**
   - Verificar URL do endpoint
   - Verificar se o recurso existe

5. **Erro de Conexão**
   - Verificar se a API está rodando
   - Verificar porta (3000)
   - Verificar firewall

---

## 📝 Scripts de Automação

### Script Bash para Testes Rápidos:
```bash
#!/bin/bash

# Configurações
API_URL="http://localhost:3000/api"
ADMIN_EMAIL="admin@sistema-orcamentos.com"
ADMIN_PASSWORD="admin123"

echo "🧪 Iniciando testes da API..."

# 1. Health Check
echo "1. Health Check..."
curl -s "$API_URL/health" | jq .

# 2. Login Admin
echo "2. Login Admin..."
ADMIN_TOKEN=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"senha\":\"$ADMIN_PASSWORD\"}" | \
  jq -r '.data.access_token')

echo "Token obtido: ${ADMIN_TOKEN:0:20}..."

# 3. Listar Máquinas
echo "3. Listando máquinas..."
curl -s -H "Authorization: Bearer $ADMIN_TOKEN" \
  "$API_URL/produtos/maquinas" | jq '.data.maquinas | length'

echo "✅ Testes básicos concluídos!"
```

---

## 🎯 Conclusão

Este plano de testes garante que:
- ✅ Autenticação funciona corretamente
- ✅ CRUD de produtos está operacional
- ✅ Sistema de fórmulas calcula corretamente
- ✅ Controle de acesso está funcionando
- ✅ API está estável para integração

Execute todos os testes antes de integrar com o frontend para garantir uma base sólida! 🚀