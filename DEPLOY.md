# Guia de Deploy - Sistema de Orçamentos

## 📋 Índice
1. [Pré-requisitos](#pré-requisitos)
2. [Configuração do Ambiente](#configuração-do-ambiente)
3. [Deploy com Docker](#deploy-com-docker)
4. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
5. [Configuração de Segurança](#configuração-de-segurança)
6. [Monitoramento e Logs](#monitoramento-e-logs)
7. [Backup e Recuperação](#backup-e-recuperação)
8. [Troubleshooting](#troubleshooting)

## 🔧 Pré-requisitos

### Servidor de Produção
- **Sistema Operacional**: Ubuntu 20.04+ ou CentOS 8+
- **RAM**: Mínimo 4GB (Recomendado 8GB+)
- **CPU**: Mínimo 2 cores (Recomendado 4+ cores)
- **Armazenamento**: Mínimo 50GB SSD
- **Rede**: Conexão estável com internet

### Software Necessário
- Docker 20.10+
- Docker Compose 2.0+
- Git
- Nginx (se não usar Docker para proxy)
- Certbot (para SSL)

### Instalação do Docker (Ubuntu)
```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install apt-transport-https ca-certificates curl gnupg lsb-release

# Adicionar chave GPG do Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Adicionar repositório
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Adicionar usuário ao grupo docker
sudo usermod -aG docker $USER

# Verificar instalação
docker --version
docker compose version
```

## ⚙️ Configuração do Ambiente

### 1. Clonar o Repositório
```bash
git clone <url-do-repositorio>
cd sistema-orcamentos
```

### 2. Configurar Variáveis de Ambiente

#### Backend (.env)
```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar variáveis de produção
nano .env
```

**Variáveis Obrigatórias para Produção:**
```env
# Servidor
NODE_ENV=production
PORT=3001

# Banco de Dados
DB_HOST=postgres
DB_PORT=5432
DB_NAME=sistema_orcamentos_prod
DB_USER=postgres_user
DB_PASSWORD=senha_super_segura_aqui
DB_SSL=true

# JWT (GERAR CHAVES SEGURAS!)
JWT_SECRET=chave_jwt_super_segura_256_bits_minimo
JWT_REFRESH_SECRET=chave_refresh_jwt_super_segura_256_bits
JWT_EXPIRES_IN=15m

# CORS
CORS_ORIGIN=https://seudominio.com,https://www.seudominio.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Upload
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf

# Log
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# Redis
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=senha_redis_segura

# Email
EMAIL_HOST=smtp.seudominio.com
EMAIL_PORT=587
EMAIL_USER=noreply@seudominio.com
EMAIL_PASSWORD=senha_email_segura
EMAIL_FROM=Sistema Orçamentos <noreply@seudominio.com>
```

#### Frontend (.env)
```bash
# Criar arquivo de ambiente para frontend
cat > frontend/.env << EOF
REACT_APP_API_URL=https://api.seudominio.com
REACT_APP_ENVIRONMENT=production
EOF
```

### 3. Gerar Chaves Seguras
```bash
# Gerar chave JWT (256 bits)
openssl rand -base64 32

# Gerar chave refresh JWT
openssl rand -base64 32

# Gerar senha para banco de dados
openssl rand -base64 24

# Gerar senha para Redis
openssl rand -base64 16
```

## 🐳 Deploy com Docker

### 1. Configurar Docker Compose para Produção
```bash
# Criar arquivo docker-compose.prod.yml
cp docker-compose.yml docker-compose.prod.yml
```

### 2. Executar Deploy
```bash
# Build das imagens
docker compose -f docker-compose.prod.yml build

# Iniciar serviços
docker compose -f docker-compose.prod.yml up -d

# Verificar status
docker compose -f docker-compose.prod.yml ps
```

### 3. Verificar Logs
```bash
# Logs de todos os serviços
docker compose -f docker-compose.prod.yml logs -f

# Logs específicos
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f postgres
```

## 🗄️ Configuração do Banco de Dados

### 1. Executar Migrações
```bash
# Entrar no container do backend
docker compose -f docker-compose.prod.yml exec backend bash

# Executar migrações
npm run migrate

# Executar seeds (opcional)
npm run seed

# Sair do container
exit
```

### 2. Backup Inicial
```bash
# Criar backup do banco
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U postgres_user sistema_orcamentos_prod > backup_inicial.sql
```

### 3. Configurar Backup Automático
```bash
# Criar script de backup
cat > backup.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
mkdir -p $BACKUP_DIR

# Backup do banco de dados
docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U postgres_user sistema_orcamentos_prod > $BACKUP_DIR/db_backup_$DATE.sql

# Backup dos uploads
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz uploads/

# Manter apenas os últimos 7 backups
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "uploads_backup_*.tar.gz" -mtime +7 -delete

echo "Backup concluído: $DATE"
EOF

chmod +x backup.sh

# Adicionar ao crontab (backup diário às 2h)
(crontab -l 2>/dev/null; echo "0 2 * * * /caminho/para/backup.sh") | crontab -
```

## 🔒 Configuração de Segurança

### 1. Configurar SSL/TLS com Let's Encrypt
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seudominio.com -d www.seudominio.com

# Verificar renovação automática
sudo certbot renew --dry-run
```

### 2. Configurar Firewall
```bash
# Configurar UFW
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir SSH, HTTP e HTTPS
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Verificar status
sudo ufw status
```

### 3. Configurar Nginx (se não usar Docker)
```nginx
# /etc/nginx/sites-available/sistema-orcamentos
server {
    listen 80;
    server_name seudominio.com www.seudominio.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name seudominio.com www.seudominio.com;

    ssl_certificate /etc/letsencrypt/live/seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seudominio.com/privkey.pem;

    # Configurações SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Configurações de segurança
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
}
```

### 4. Configurar Monitoramento de Segurança
```bash
# Instalar fail2ban
sudo apt install fail2ban

# Configurar fail2ban
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Editar configuração
sudo nano /etc/fail2ban/jail.local
```

## 📊 Monitoramento e Logs

### 1. Configurar Logs Centralizados
```bash
# Criar diretório de logs
mkdir -p logs

# Configurar logrotate
cat > /etc/logrotate.d/sistema-orcamentos << EOF
/caminho/para/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker compose -f docker-compose.prod.yml restart backend
    endscript
}
EOF
```

### 2. Monitoramento de Recursos
```bash
# Script de monitoramento
cat > monitor.sh << 'EOF'
#!/bin/bash
echo "=== Status dos Containers ==="
docker compose -f docker-compose.prod.yml ps

echo "=== Uso de Recursos ==="
docker stats --no-stream

echo "=== Espaço em Disco ==="
df -h

echo "=== Uso de Memória ==="
free -h

echo "=== Logs de Erro Recentes ==="
docker compose -f docker-compose.prod.yml logs --tail=10 backend | grep -i error
EOF

chmod +x monitor.sh
```

### 3. Alertas por Email
```bash
# Script de alerta
cat > alert.sh << 'EOF'
#!/bin/bash
THRESHOLD=80
USAGE=$(df / | grep -vE '^Filesystem|tmpfs|cdrom' | awk '{ print $5 }' | sed 's/%//g')

if [ $USAGE -gt $THRESHOLD ]; then
    echo "Alerta: Uso de disco em $USAGE%" | mail -s "Sistema Orçamentos - Alerta de Disco" admin@seudominio.com
fi

# Verificar se containers estão rodando
if ! docker compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    echo "Alerta: Alguns containers não estão rodando" | mail -s "Sistema Orçamentos - Alerta de Container" admin@seudominio.com
fi
EOF

chmod +x alert.sh

# Executar a cada 15 minutos
(crontab -l 2>/dev/null; echo "*/15 * * * * /caminho/para/alert.sh") | crontab -
```

## 💾 Backup e Recuperação

### 1. Estratégia de Backup
- **Banco de Dados**: Backup diário às 2h
- **Uploads**: Backup diário às 3h
- **Configurações**: Backup semanal
- **Retenção**: 30 dias local, 90 dias remoto

### 2. Script de Recuperação
```bash
cat > restore.sh << 'EOF'
#!/bin/bash
BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Uso: $0 <arquivo_backup.sql>"
    exit 1
fi

echo "Parando aplicação..."
docker compose -f docker-compose.prod.yml stop backend

echo "Restaurando banco de dados..."
docker compose -f docker-compose.prod.yml exec -T postgres psql -U postgres_user -d sistema_orcamentos_prod < $BACKUP_FILE

echo "Reiniciando aplicação..."
docker compose -f docker-compose.prod.yml start backend

echo "Restauração concluída!"
EOF

chmod +x restore.sh
```

### 3. Backup Remoto (AWS S3)
```bash
# Instalar AWS CLI
sudo apt install awscli

# Configurar credenciais
aws configure

# Script de backup remoto
cat > backup_remote.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
LOCAL_BACKUP="/backups"
S3_BUCKET="s3://seu-bucket-backup"

# Sincronizar backups com S3
aws s3 sync $LOCAL_BACKUP $S3_BUCKET/sistema-orcamentos/

echo "Backup remoto concluído: $DATE"
EOF

chmod +x backup_remote.sh
```

## 🔧 Troubleshooting

### Problemas Comuns

#### 1. Container não inicia
```bash
# Verificar logs
docker compose -f docker-compose.prod.yml logs backend

# Verificar configurações
docker compose -f docker-compose.prod.yml config

# Reconstruir imagem
docker compose -f docker-compose.prod.yml build --no-cache backend
```

#### 2. Erro de conexão com banco
```bash
# Verificar se PostgreSQL está rodando
docker compose -f docker-compose.prod.yml ps postgres

# Testar conexão
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres_user -d sistema_orcamentos_prod -c "SELECT 1;"

# Verificar logs do PostgreSQL
docker compose -f docker-compose.prod.yml logs postgres
```

#### 3. Problemas de performance
```bash
# Verificar uso de recursos
docker stats

# Verificar logs de erro
docker compose -f docker-compose.prod.yml logs backend | grep -i error

# Verificar conexões do banco
docker compose -f docker-compose.prod.yml exec postgres psql -U postgres_user -d sistema_orcamentos_prod -c "SELECT count(*) FROM pg_stat_activity;"
```

#### 4. Problemas de SSL
```bash
# Verificar certificado
sudo certbot certificates

# Renovar certificado
sudo certbot renew

# Testar configuração SSL
openssl s_client -connect seudominio.com:443
```

### Comandos Úteis

```bash
# Reiniciar aplicação
docker compose -f docker-compose.prod.yml restart

# Atualizar aplicação
git pull
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

# Verificar saúde dos containers
docker compose -f docker-compose.prod.yml exec backend curl -f http://localhost:3001/health

# Limpar recursos não utilizados
docker system prune -f

# Verificar espaço usado pelo Docker
docker system df
```

## 📞 Suporte

### Contatos de Emergência
- **Desenvolvedor**: dev@seudominio.com
- **Administrador**: admin@seudominio.com
- **Suporte**: suporte@seudominio.com

### Documentação Adicional
- [API Documentation](./API.md)
- [Security Checklist](./security-checklist.md)
- [Performance Guide](./PERFORMANCE.md)

---

**⚠️ Importante**: Sempre teste o deploy em um ambiente de staging antes de aplicar em produção!