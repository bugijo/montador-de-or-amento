# Multi-stage build para React
FROM node:18-alpine AS base

# Instalar dependências do sistema
RUN apk add --no-cache curl

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Stage de desenvolvimento
FROM base AS development

# Instalar todas as dependências
RUN npm ci

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 3000

# Comando para desenvolvimento
CMD ["npm", "start"]

# Stage de build
FROM base AS build

# Argumentos de build
ARG REACT_APP_API_URL
ARG REACT_APP_ENVIRONMENT

# Definir variáveis de ambiente
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_ENVIRONMENT=$REACT_APP_ENVIRONMENT
ENV GENERATE_SOURCEMAP=false
ENV NODE_OPTIONS="--max-old-space-size=4096"

# Instalar dependências
RUN npm ci --only=production

# Copiar código fonte
COPY . .

# Build da aplicação
RUN npm run build

# Stage de produção
FROM nginx:alpine AS production

# Copiar configuração customizada do Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar arquivos buildados
COPY --from=build /app/build /usr/share/nginx/html

# Criar usuário não-root
RUN addgroup -g 1001 -S nginx && \
    adduser -S nginx -u 1001 -G nginx

# Ajustar permissões
RUN chown -R nginx:nginx /usr/share/nginx/html && \
    chown -R nginx:nginx /var/cache/nginx && \
    chown -R nginx:nginx /var/log/nginx && \
    chown -R nginx:nginx /etc/nginx/conf.d

# Criar diretório para PID
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid

USER nginx

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
    CMD curl -f http://localhost:80 || exit 1

# Comando para produção
CMD ["nginx", "-g", "daemon off;"]