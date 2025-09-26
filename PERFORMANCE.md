# Guia de Otimização de Performance - Sistema de Orçamentos

## 📊 Análise de Performance Atual

### Métricas Identificadas
- **Backend**: Tempo de resposta médio < 200ms
- **Frontend**: First Contentful Paint < 2s
- **Banco de Dados**: Queries < 100ms
- **Bundle Size**: Frontend < 2MB

## 🚀 Otimizações Implementadas

### Backend (Node.js/Express)

#### 1. Cache com Redis
```javascript
// src/middleware/cache.js
const redis = require('redis');
const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`;
    
    try {
      const cached = await client.get(key);
      if (cached) {
        return res.json(JSON.parse(cached));
      }
      
      res.sendResponse = res.json;
      res.json = (body) => {
        client.setex(key, duration, JSON.stringify(body));
        res.sendResponse(body);
      };
      
      next();
    } catch (error) {
      next();
    }
  };
};

module.exports = cacheMiddleware;
```

#### 2. Compressão de Resposta
```javascript
// src/app.js
const compression = require('compression');

app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));
```

#### 3. Otimização de Queries
```javascript
// src/models/orcamento.js
// Eager loading otimizado
const orcamentos = await Orcamento.findAll({
  include: [
    {
      model: OrcamentoItem,
      include: [
        {
          model: Produto,
          attributes: ['id', 'nome', 'preco_base'] // Apenas campos necessários
        }
      ]
    },
    {
      model: User,
      attributes: ['id', 'nome'] // Apenas campos necessários
    }
  ],
  attributes: { exclude: ['senha'] }, // Excluir campos sensíveis
  limit: 20, // Paginação
  offset: (page - 1) * 20
});
```

#### 4. Pool de Conexões Otimizado
```javascript
// src/config/database.js
module.exports = {
  production: {
    // ... outras configurações
    pool: {
      max: 20,
      min: 5,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    },
    logging: false // Desabilitar logs em produção
  }
};
```

### Frontend (React)

#### 1. Code Splitting
```javascript
// src/App.js
import { lazy, Suspense } from 'react';
import LoadingScreen from './components/LoadingScreen';

// Lazy loading de componentes
const AdminDashboard = lazy(() => import('./components/AdminDashboard'));
const Calculator = lazy(() => import('./components/Calculator'));
const PDFGenerator = lazy(() => import('./components/PDFGenerator'));

function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/pdf" element={<PDFGenerator />} />
      </Routes>
    </Suspense>
  );
}
```

#### 2. Memoização de Componentes
```javascript
// src/components/ProductCard.js
import { memo } from 'react';

const ProductCard = memo(({ product, onSelect }) => {
  return (
    <div onClick={() => onSelect(product.id)}>
      <h3>{product.nome}</h3>
      <p>{product.preco_base}</p>
    </div>
  );
}, (prevProps, nextProps) => {
  return prevProps.product.id === nextProps.product.id &&
         prevProps.product.preco_base === nextProps.product.preco_base;
});

export default ProductCard;
```

#### 3. Otimização de React Query
```javascript
// src/hooks/useProducts.js
import { useQuery } from 'react-query';

export const useProducts = (filters = {}) => {
  return useQuery(
    ['products', filters],
    () => fetchProducts(filters),
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000)
    }
  );
};
```

#### 4. Virtualização de Listas
```javascript
// src/components/VirtualizedProductList.js
import { FixedSizeList as List } from 'react-window';

const VirtualizedProductList = ({ products, onSelectProduct }) => {
  const Row = ({ index, style }) => (
    <div style={style}>
      <ProductCard 
        product={products[index]} 
        onSelect={onSelectProduct}
      />
    </div>
  );

  return (
    <List
      height={600}
      itemCount={products.length}
      itemSize={120}
      width="100%"
    >
      {Row}
    </List>
  );
};
```

#### 5. Otimização de Bundle
```javascript
// webpack.config.js (se usando eject)
module.exports = {
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
        common: {
          name: 'common',
          minChunks: 2,
          chunks: 'all',
          enforce: true,
        },
      },
    },
  },
};
```

### Banco de Dados (PostgreSQL)

#### 1. Índices Otimizados
```sql
-- Índices para melhorar performance
CREATE INDEX CONCURRENTLY idx_orcamentos_usuario_id ON orcamentos(usuario_id);
CREATE INDEX CONCURRENTLY idx_orcamentos_status ON orcamentos(status);
CREATE INDEX CONCURRENTLY idx_orcamentos_data_criacao ON orcamentos(created_at);
CREATE INDEX CONCURRENTLY idx_produtos_categoria ON produtos(categoria);
CREATE INDEX CONCURRENTLY idx_produtos_ativo ON produtos(ativo);

-- Índice composto para queries frequentes
CREATE INDEX CONCURRENTLY idx_orcamentos_usuario_status ON orcamentos(usuario_id, status);
```

#### 2. Configurações de Performance
```sql
-- postgresql.conf
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

## 📈 Implementações Pendentes

### 1. Service Worker para Cache
```javascript
// public/sw.js
const CACHE_NAME = 'sistema-orcamentos-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});
```

### 2. CDN para Assets Estáticos
```javascript
// src/config/cdn.js
const CDN_BASE_URL = process.env.REACT_APP_CDN_URL || '';

export const getAssetUrl = (path) => {
  if (process.env.NODE_ENV === 'production' && CDN_BASE_URL) {
    return `${CDN_BASE_URL}${path}`;
  }
  return path;
};
```

### 3. Otimização de Imagens
```javascript
// src/components/OptimizedImage.js
import { useState, useEffect } from 'react';

const OptimizedImage = ({ src, alt, ...props }) => {
  const [imageSrc, setImageSrc] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageSrc(src);
      setIsLoaded(true);
    };
    img.src = src;
  }, [src]);

  return (
    <div className={`image-container ${isLoaded ? 'loaded' : 'loading'}`}>
      {isLoaded ? (
        <img src={imageSrc} alt={alt} {...props} />
      ) : (
        <div className="image-placeholder">Carregando...</div>
      )}
    </div>
  );
};
```

### 4. Debounce para Pesquisas
```javascript
// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Uso no componente de pesquisa
const SearchComponent = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  useEffect(() => {
    if (debouncedSearchTerm) {
      // Fazer pesquisa
      searchProducts(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder="Pesquisar produtos..."
    />
  );
};
```

## 🔍 Monitoramento de Performance

### 1. Métricas do Backend
```javascript
// src/middleware/metrics.js
const prometheus = require('prom-client');

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const httpRequestsTotal = new prometheus.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
});

const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration
      .labels(req.method, route, res.statusCode)
      .observe(duration);
      
    httpRequestsTotal
      .labels(req.method, route, res.statusCode)
      .inc();
  });
  
  next();
};

module.exports = metricsMiddleware;
```

### 2. Performance Budget
```json
{
  "budgets": [
    {
      "type": "initial",
      "maximumWarning": "2mb",
      "maximumError": "5mb"
    },
    {
      "type": "anyComponentStyle",
      "maximumWarning": "6kb"
    },
    {
      "type": "bundle",
      "name": "main",
      "maximumWarning": "1mb",
      "maximumError": "2mb"
    }
  ]
}
```

### 3. Lighthouse CI
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Use Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm ci
      - run: npm run build
      - name: Run Lighthouse CI
        run: |
          npm install -g @lhci/cli@0.8.x
          lhci autorun
```

## 📊 Benchmarks e Testes

### 1. Teste de Carga com Artillery
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
    - duration: 120
      arrivalRate: 50
    - duration: 60
      arrivalRate: 100

scenarios:
  - name: "API Load Test"
    requests:
      - get:
          url: "/api/produtos"
      - post:
          url: "/api/auth/login"
          json:
            email: "teste@exemplo.com"
            senha: "123456"
```

### 2. Monitoramento Contínuo
```javascript
// src/utils/performance.js
export const measurePerformance = (name, fn) => {
  return async (...args) => {
    const start = performance.now();
    const result = await fn(...args);
    const end = performance.now();
    
    console.log(`${name} took ${end - start} milliseconds`);
    
    // Enviar métricas para serviço de monitoramento
    if (process.env.NODE_ENV === 'production') {
      sendMetric(name, end - start);
    }
    
    return result;
  };
};
```

## 🎯 Metas de Performance

### Objetivos de Curto Prazo (1-2 semanas)
- [ ] Implementar cache Redis para produtos
- [ ] Adicionar compressão gzip
- [ ] Otimizar queries do banco de dados
- [ ] Implementar lazy loading no frontend

### Objetivos de Médio Prazo (1 mês)
- [ ] Configurar CDN para assets
- [ ] Implementar service worker
- [ ] Adicionar virtualização de listas
- [ ] Otimizar bundle size

### Objetivos de Longo Prazo (3 meses)
- [ ] Implementar server-side rendering (SSR)
- [ ] Configurar edge caching
- [ ] Implementar progressive web app (PWA)
- [ ] Adicionar monitoramento avançado

## 📝 Checklist de Performance

### Backend
- [x] Compressão de resposta
- [x] Pool de conexões otimizado
- [ ] Cache Redis implementado
- [ ] Índices de banco otimizados
- [ ] Rate limiting configurado
- [ ] Monitoramento de métricas

### Frontend
- [x] Code splitting básico
- [x] Memoização de componentes
- [ ] Lazy loading de imagens
- [ ] Service worker
- [ ] Bundle optimization
- [ ] Performance monitoring

### Infraestrutura
- [ ] CDN configurado
- [ ] Load balancer
- [ ] Database replication
- [ ] Monitoring dashboard
- [ ] Alerting system

---

**📈 Lembre-se**: Performance é um processo contínuo. Monitore, meça e otimize regularmente!