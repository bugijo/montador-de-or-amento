// Configuração de variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.PORT = '3001';

// Banco de dados de teste
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'sistema_orcamentos_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'postgres';
process.env.DB_SSL = 'false';

// JWT para testes
process.env.JWT_SECRET = 'test_jwt_secret_key_for_testing_only_do_not_use_in_production';
process.env.JWT_REFRESH_SECRET = 'test_jwt_refresh_secret_key_for_testing_only';
process.env.JWT_EXPIRES_IN = '1h';

// Configurações de segurança para testes
process.env.BCRYPT_ROUNDS = '4'; // Reduzir para testes mais rápidos
process.env.RATE_LIMIT_WINDOW_MS = '60000';
process.env.RATE_LIMIT_MAX_REQUESTS = '1000'; // Mais permissivo para testes

// CORS para testes
process.env.CORS_ORIGIN = 'http://localhost:3000,http://localhost:3001';

// Upload para testes
process.env.UPLOAD_PATH = './tests/uploads';
process.env.MAX_FILE_SIZE = '5242880'; // 5MB
process.env.ALLOWED_FILE_TYPES = 'image/jpeg,image/png,image/gif,application/pdf';

// Log para testes
process.env.LOG_LEVEL = 'error'; // Reduzir logs durante testes
process.env.LOG_FILE = './tests/logs/test.log';

// Redis para testes (opcional)
process.env.REDIS_HOST = 'localhost';
process.env.REDIS_PORT = '6379';
process.env.REDIS_PASSWORD = '';

// Email para testes (mock)
process.env.EMAIL_HOST = 'localhost';
process.env.EMAIL_PORT = '587';
process.env.EMAIL_USER = 'test@exemplo.com';
process.env.EMAIL_PASSWORD = 'test_password';
process.env.EMAIL_FROM = 'Sistema Orçamentos <test@exemplo.com>';

// Frontend para testes
process.env.FRONTEND_URL = 'http://localhost:3000';

// Suprimir warnings específicos
process.env.SUPPRESS_NO_CONFIG_WARNING = 'true';

console.log('Variáveis de ambiente para testes configuradas');