import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../services/api';
import { toast } from 'react-toastify';

// Estado inicial
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null
};

// Actions
const AUTH_ACTIONS = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SET_USER: 'SET_USER',
  SET_LOADING: 'SET_LOADING',
  CLEAR_ERROR: 'CLEAR_ERROR'
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_START:
      return {
        ...state,
        isLoading: true,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isAuthenticated: true,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.LOGIN_FAILURE:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload
      };

    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      };

    case AUTH_ACTIONS.SET_USER:
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false
      };

    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      };

    case AUTH_ACTIONS.CLEAR_ERROR:
      return {
        ...state,
        error: null
      };

    default:
      return state;
  }
};

// Context
const AuthContext = createContext();

// Provider
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar se há usuário logado ao inicializar
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('access_token');
      const userData = localStorage.getItem('user');

      if (token && userData) {
        try {
          // Usar dados do localStorage primeiro para evitar chamadas desnecessárias
          const user = JSON.parse(userData);
          dispatch({
            type: AUTH_ACTIONS.SET_USER,
            payload: user
          });
          
          // Verificar se o token ainda é válido em background
          await authService.getProfile();
        } catch (error) {
          // Token inválido, limpar dados
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          dispatch({
            type: AUTH_ACTIONS.SET_USER,
            payload: null
          });
        }
      } else {
        dispatch({
          type: AUTH_ACTIONS.SET_USER,
          payload: null
        });
      }
    };

    checkAuth();
  }, []);

  // Função de login
  const login = async (email, senha) => {
    dispatch({ type: AUTH_ACTIONS.LOGIN_START });

    try {
      const response = await authService.login(email, senha);
      const { user, access_token, refresh_token } = response.data;

      // Salvar tokens e dados do usuário
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', refresh_token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({
        type: AUTH_ACTIONS.LOGIN_SUCCESS,
        payload: { user }
      });

      toast.success('Login realizado com sucesso!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao fazer login';
      
      dispatch({
        type: AUTH_ACTIONS.LOGIN_FAILURE,
        payload: errorMessage
      });

      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Função de logout
  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Erro no logout:', error);
    }

    dispatch({ type: AUTH_ACTIONS.LOGOUT });
    toast.info('Logout realizado com sucesso');
  };

  // Função para atualizar dados do usuário
  const updateUser = (userData) => {
    localStorage.setItem('user', JSON.stringify(userData));
    dispatch({
      type: AUTH_ACTIONS.SET_USER,
      payload: userData
    });
  };

  // Função para alterar senha
  const changePassword = async (senhaAtual, novaSenha) => {
    try {
      await authService.changePassword(senhaAtual, novaSenha);
      toast.success('Senha alterada com sucesso!');
      return { success: true };
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao alterar senha';
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }
  };

  // Limpar erro
  const clearError = () => {
    dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
  };

  const value = {
    ...state,
    login,
    logout,
    updateUser,
    changePassword,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar o contexto
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export default AuthContext;
