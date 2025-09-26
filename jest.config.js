module.exports = {
  // Ambiente de teste
  testEnvironment: 'node',
  
  // Padrões de arquivos de teste
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  
  // Arquivos de configuração executados antes dos testes
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  
  // Diretórios a serem ignorados
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/'
  ],
  
  // Configuração de cobertura
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Arquivos incluídos na cobertura
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/migrations/**',
    '!src/seeders/**',
    '!src/config/**',
    '!**/node_modules/**'
  ],
  
  // Limites de cobertura
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Timeout para testes
  testTimeout: 30000,
  
  // Configurações para módulos
  moduleFileExtensions: ['js', 'json'],
  
  // Transformações
  transform: {},
  
  // Variáveis de ambiente para testes
  setupFiles: ['<rootDir>/tests/env.setup.js'],
  
  // Configuração para testes em paralelo
  maxWorkers: 1, // Executar testes sequencialmente para evitar conflitos de banco
  
  // Configuração de relatórios
  reporters: [
    'default',
    ['jest-html-reporters', {
      publicPath: './coverage',
      filename: 'test-report.html',
      expand: true
    }]
  ],
  
  // Configuração para detectar handles abertos
  detectOpenHandles: true,
  forceExit: true,
  
  // Configuração para logs
  verbose: true,
  
  // Configuração para cache
  cache: false
};