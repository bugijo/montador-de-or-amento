import axios from 'axios';
import { toast } from 'react-toastify';

// Configuração base da API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

// Instância do axios
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token nas requisições
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Se o token expirou (401) e não é uma tentativa de refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem('refresh_token');
      const accessToken = localStorage.getItem('access_token');
      
      // Só tentar refresh se temos ambos os tokens
      if (refreshToken && accessToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refresh_token: refreshToken
          });

          const { access_token, refresh_token: newRefreshToken } = response.data.data;
          
          localStorage.setItem('access_token', access_token);
          localStorage.setItem('refresh_token', newRefreshToken);

          // Retry da requisição original
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh falhou, fazer logout silencioso
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          
          // Só redirecionar se não estamos já na página de login
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        }
      } else {
        // Não há tokens válidos, limpar dados sem redirecionar
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
      }
    }

    // Tratamento de outros erros (não mostrar toast para 401 se não há token)
    const errorMessage = error.response?.data?.message || 'Erro na requisição';
    const hasToken = localStorage.getItem('access_token');
    
    if (error.response?.status !== 401 || hasToken) {
      // Só mostrar toast se não for 401 ou se há token (usuário logado)
      if (error.response?.status !== 401) {
        toast.error(errorMessage);
      }
    }

    return Promise.reject(error);
  }
);

// Serviços de autenticação
export const authService = {
  login: async (email, senha) => {
    const response = await api.post('/auth/login', { email, senha });
    return response.data;
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erro no logout:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  },

  getProfile: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  changePassword: async (senhaAtual, novaSenha) => {
    const response = await api.put('/auth/change-password', {
      senha_atual: senhaAtual,
      nova_senha: novaSenha
    });
    return response.data;
  }
};

// Serviços de produtos
export const produtoService = {
  getMaquinas: async () => {
    const response = await api.get('/produtos/maquinas');
    return response.data;
  },

  getAcessorios: async (maquinaId) => {
    const params = maquinaId ? { maquina_id: maquinaId } : {};
    const response = await api.get('/produtos/acessorios', { params });
    return response.data;
  },

  getProduto: async (id) => {
    const response = await api.get(`/produtos/${id}`);
    return response.data;
  },

  getProdutos: async (params = {}) => {
    const response = await api.get('/produtos', { params });
    return response.data;
  }
};

// Serviços de fórmulas
export const formulaService = {
  getFormulas: async (params = {}) => {
    const response = await api.get('/formulas', { params });
    return response.data;
  },

  getFormulasByProdutoMaquina: async (produtoId, maquinaId) => {
    const response = await api.get(`/formulas/produto/${produtoId}/maquina/${maquinaId}`);
    return response.data;
  },

  calcularFormula: async (formulaId, variaveis) => {
    const response = await api.post(`/formulas/${formulaId}/calcular`, { variaveis });
    return response.data;
  },

  // CRUD de fórmulas (admin)
  createFormula: async (formulaData) => {
    const response = await api.post('/formulas', formulaData);
    return response.data;
  },

  updateFormula: async (id, formulaData) => {
    const response = await api.put(`/formulas/${id}`, formulaData);
    return response.data;
  },

  deleteFormula: async (id) => {
    const response = await api.delete(`/formulas/${id}`);
    return response.data;
  },

  testarFormula: async (formulaData) => {
    const response = await api.post('/formulas/testar', formulaData);
    return response.data;
  }
};

// Serviços administrativos
export const adminService = {
  // Analytics e Dashboard
  getDashboardStats: async () => {
    const response = await api.get('/admin/dashboard/stats');
    return response.data;
  },

  getOrcamentosStats: async (periodo = '30d') => {
    const response = await api.get(`/admin/analytics/orcamentos?periodo=${periodo}`);
    return response.data;
  },

  getTopMaquinas: async (limite = 10) => {
    const response = await api.get(`/admin/analytics/top-maquinas?limite=${limite}`);
    return response.data;
  },

  getVendasPorVendedor: async (periodo = '30d') => {
    const response = await api.get(`/admin/analytics/vendas-por-vendedor?periodo=${periodo}`);
    return response.data;
  },

  // Gerenciamento de Usuários
  getUsers: async (params = {}) => {
    const response = await api.get('/admin/users', { params });
    return response.data;
  },

  createUser: async (userData) => {
    const response = await api.post('/admin/users', userData);
    return response.data;
  },

  updateUser: async (id, userData) => {
    const response = await api.put(`/admin/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id) => {
    const response = await api.delete(`/admin/users/${id}`);
    return response.data;
  },

  updateUserStatus: async (id, status) => {
    const response = await api.patch(`/admin/users/${id}/status`, { status });
    return response.data;
  },

  // CRUD completo de Produtos (admin)
  createProduto: async (produtoData) => {
    const response = await api.post('/admin/produtos', produtoData);
    return response.data;
  },

  updateProduto: async (id, produtoData) => {
    const response = await api.put(`/admin/produtos/${id}`, produtoData);
    return response.data;
  },

  deleteProduto: async (id) => {
    const response = await api.delete(`/admin/produtos/${id}`);
    return response.data;
  },

  // Relatórios
  getRelatorioVendas: async (dataInicio, dataFim) => {
    const response = await api.get('/admin/relatorios/vendas', {
      params: { data_inicio: dataInicio, data_fim: dataFim }
    });
    return response.data;
  },

  exportarRelatorio: async (tipo, formato = 'pdf') => {
    const response = await api.get(`/admin/relatorios/${tipo}/export`, {
      params: { formato },
      responseType: 'blob'
    });
    return response.data;
  }
};

// Utilitários
export const utilService = {
  healthCheck: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  getApiInfo: async () => {
    const response = await api.get('/info');
    return response.data;
  }
};

export default api;
