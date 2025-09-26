# Montador de Orçamento - Sistema de Vendas FINITI

Sistema completo para montagem de orçamentos e gestão de vendas de máquinas industriais da FINITI.

## 🚀 Funcionalidades

### Frontend (React)
- **Catálogo de Máquinas**: Interface moderna com glassmorphism e animações
- **Calculadora de Orçamento**: Sistema inteligente de cálculo de preços
- **Gerador de PDF**: Criação automática de propostas comerciais
- **Dashboard Administrativo**: Gestão completa do sistema
- **Autenticação**: Sistema seguro de login e perfis de usuário
- **Responsivo**: Interface adaptada para desktop e mobile

### Backend (Node.js + Express)
- **API RESTful**: Endpoints completos para todas as funcionalidades
- **Autenticação JWT**: Sistema seguro de tokens
- **Banco de Dados**: SQLite com Sequelize ORM
- **Validação**: Middleware de validação de dados
- **Segurança**: Implementação de boas práticas de segurança

## 🛠️ Tecnologias Utilizadas

### Frontend
- React 18
- React Router DOM
- React Query (TanStack Query)
- Styled Components
- Framer Motion
- React Icons
- React Loading Skeleton
- React Toastify

### Backend
- Node.js
- Express.js
- Sequelize ORM
- SQLite
- JWT (JSON Web Tokens)
- Bcrypt
- Helmet
- CORS

## 📦 Instalação e Configuração

### Pré-requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/bugijo/montador-de-or-amento.git
cd montador-de-or-amento
```

2. Instale as dependências do backend:
```bash
npm install
```

3. Instale as dependências do frontend:
```bash
cd frontend
npm install
cd ..
```

4. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

5. Execute as migrações do banco de dados:
```bash
npm run migrate
```

6. Popule o banco com dados iniciais:
```bash
npm run seed
```

## 🚀 Execução

### Desenvolvimento

1. Inicie o backend:
```bash
npm start
```

2. Em outro terminal, inicie o frontend:
```bash
cd frontend
npm start
```

O sistema estará disponível em:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

### Produção

```bash
npm run build
npm run start:prod
```

## 📁 Estrutura do Projeto

```
├── frontend/                 # Aplicação React
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── contexts/        # Contextos React
│   │   ├── services/        # Serviços de API
│   │   └── styles/          # Estilos globais
│   └── public/              # Arquivos públicos
├── src/                     # Backend Node.js
│   ├── controllers/         # Controladores
│   ├── models/             # Modelos Sequelize
│   ├── routes/             # Rotas da API
│   ├── middleware/         # Middlewares
│   └── utils/              # Utilitários
├── migrations/             # Migrações do banco
├── seeders/               # Seeds do banco
└── tests/                 # Testes automatizados
```

## 🔐 Usuários Padrão

### Administrador
- **Email**: admin@finiti.com.br
- **Senha**: admin123

### Vendedor
- **Email**: vendedor@finiti.com.br
- **Senha**: vendedor123

## 📊 Funcionalidades Principais

### Catálogo de Máquinas
- Visualização em grid ou lista
- Busca e filtros avançados
- Animações e efeitos visuais
- Lazy loading para performance

### Calculadora de Orçamento
- Cálculo automático baseado em fórmulas
- Aplicação de descontos e margens
- Validação de dados em tempo real
- Histórico de cálculos

### Gerador de PDF
- Templates profissionais
- Dados dinâmicos da empresa
- Assinatura digital
- Download automático

### Dashboard Administrativo
- Gestão de produtos e máquinas
- Controle de usuários
- Configuração de fórmulas
- Relatórios e estatísticas

## 🧪 Testes

Execute os testes automatizados:

```bash
npm test
```

Para coverage:
```bash
npm run test:coverage
```

## 🔧 Scripts Disponíveis

- `npm start`: Inicia o servidor backend
- `npm run dev`: Inicia em modo desenvolvimento
- `npm run build`: Build para produção
- `npm test`: Executa testes
- `npm run migrate`: Executa migrações
- `npm run seed`: Popula banco com dados

## 📝 API Documentation

A documentação completa da API está disponível em `API_DOCUMENTATION.md`.

## 🚀 Deploy

Instruções detalhadas de deploy estão disponíveis em `DEPLOY.md`.

## 📈 Performance

- Lazy loading de componentes
- Memoização com React.memo
- Otimização de imagens
- Cache de dados com React Query
- Bundle splitting automático

## 🔒 Segurança

- Autenticação JWT
- Validação de dados
- Sanitização de inputs
- Headers de segurança
- Rate limiting

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

## 📞 Suporte

Para suporte técnico, entre em contato:
- Email: suporte@finiti.com.br
- Telefone: (11) 99999-9999

---

Desenvolvido com ❤️ para FINITI