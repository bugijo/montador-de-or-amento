'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ProjectSetup {
  constructor() {
    this.projectRoot = process.cwd();
    this.envFile = path.join(this.projectRoot, '.env');
    this.envExampleFile = path.join(this.projectRoot, '.env.example');
  }

  log(message, type = 'info') {
    const colors = {
      info: '\x1b[36m',    // Cyan
      success: '\x1b[32m', // Green
      warning: '\x1b[33m', // Yellow
      error: '\x1b[31m',   // Red
      reset: '\x1b[0m'     // Reset
    };

    console.log(`${colors[type]}${message}${colors.reset}`);
  }

  checkNodeVersion() {
    this.log('🔍 Verificando versão do Node.js...');
    
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 16) {
      this.log(`❌ Node.js ${nodeVersion} não é suportado. Versão mínima: 16.0.0`, 'error');
      process.exit(1);
    }
    
    this.log(`✅ Node.js ${nodeVersion} - OK`, 'success');
  }

  checkPostgreSQL() {
    this.log('🔍 Verificando PostgreSQL...');
    
    try {
      execSync('psql --version', { stdio: 'pipe' });
      this.log('✅ PostgreSQL encontrado', 'success');
    } catch (error) {
      this.log('⚠️  PostgreSQL não encontrado. Certifique-se de que está instalado e no PATH', 'warning');
    }
  }

  createEnvFile() {
    this.log('📝 Configurando arquivo .env...');
    
    if (fs.existsSync(this.envFile)) {
      this.log('⚠️  Arquivo .env já existe. Pulando criação...', 'warning');
      return;
    }

    if (!fs.existsSync(this.envExampleFile)) {
      this.log('❌ Arquivo .env.example não encontrado', 'error');
      return;
    }

    // Copia .env.example para .env
    fs.copyFileSync(this.envExampleFile, this.envFile);
    
    // Gera JWT secret aleatório
    const jwtSecret = require('crypto').randomBytes(64).toString('hex');
    
    // Lê o conteúdo do .env
    let envContent = fs.readFileSync(this.envFile, 'utf8');
    
    // Substitui o JWT_SECRET
    envContent = envContent.replace(
      'JWT_SECRET=seu_jwt_secret_super_seguro_aqui',
      `JWT_SECRET=${jwtSecret}`
    );
    
    // Escreve o arquivo atualizado
    fs.writeFileSync(this.envFile, envContent);
    
    this.log('✅ Arquivo .env criado com JWT secret gerado', 'success');
    this.log('⚠️  IMPORTANTE: Configure as credenciais do banco de dados no arquivo .env', 'warning');
  }

  installDependencies() {
    this.log('📦 Instalando dependências...');
    
    try {
      execSync('npm install', { stdio: 'inherit' });
      this.log('✅ Dependências instaladas com sucesso', 'success');
    } catch (error) {
      this.log('❌ Erro ao instalar dependências', 'error');
      process.exit(1);
    }
  }

  createDirectories() {
    this.log('📁 Criando diretórios necessários...');
    
    const directories = [
      'uploads',
      'logs',
      'tests/unit',
      'tests/integration'
    ];

    directories.forEach(dir => {
      const dirPath = path.join(this.projectRoot, dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        this.log(`✅ Diretório criado: ${dir}`, 'success');
      }
    });
  }

  createGitignore() {
    this.log('📝 Criando .gitignore...');
    
    const gitignorePath = path.join(this.projectRoot, '.gitignore');
    
    if (fs.existsSync(gitignorePath)) {
      this.log('⚠️  Arquivo .gitignore já existe', 'warning');
      return;
    }

    const gitignoreContent = `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs/
*.log

# Runtime data
pids/
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/

# nyc test coverage
.nyc_output

# Dependency directories
node_modules/
jspm_packages/

# Optional npm cache directory
.npm

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Uploads
uploads/*
!uploads/.gitkeep

# Database
*.sqlite
*.db

# Temporary files
tmp/
temp/
`;

    fs.writeFileSync(gitignorePath, gitignoreContent);
    this.log('✅ Arquivo .gitignore criado', 'success');
  }

  showNextSteps() {
    this.log('\n🎉 Configuração inicial concluída!', 'success');
    this.log('\n📋 Próximos passos:', 'info');
    this.log('1. Configure as credenciais do banco de dados no arquivo .env');
    this.log('2. Crie o banco de dados PostgreSQL:');
    this.log('   createdb sistema_orcamentos');
    this.log('3. Execute as migrations:');
    this.log('   npm run migrate');
    this.log('4. Execute os seeders (dados iniciais):');
    this.log('   npm run seed');
    this.log('5. Inicie o servidor:');
    this.log('   npm run dev');
    this.log('\n📚 Documentação completa disponível no README.md');
    this.log('\n🔐 Usuários padrão após seeders:');
    this.log('   Admin: admin@sistema-orcamentos.com / admin123');
    this.log('   Vendedor: vendedor@sistema-orcamentos.com / vendedor123');
  }

  async run() {
    try {
      this.log('🚀 Iniciando configuração do Sistema de Orçamentos...', 'info');
      
      this.checkNodeVersion();
      this.checkPostgreSQL();
      this.createEnvFile();
      this.createDirectories();
      this.createGitignore();
      this.installDependencies();
      
      this.showNextSteps();
      
    } catch (error) {
      this.log(`❌ Erro durante a configuração: ${error.message}`, 'error');
      process.exit(1);
    }
  }
}

// Executa o setup se o script for chamado diretamente
if (require.main === module) {
  const setup = new ProjectSetup();
  setup.run();
}

module.exports = ProjectSetup;