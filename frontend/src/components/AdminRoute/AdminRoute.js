import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from '../LoadingScreen/LoadingScreen';

/**
 * Componente para proteger rotas administrativas
 * Verifica se o usuário está autenticado e tem role 'admin'
 */
const AdminRoute = () => {
  const { isAuthenticated, isLoading, user } = useAuth();

  // Mostra loading enquanto verifica autenticação
  if (isLoading) {
    return <LoadingScreen />;
  }

  // Redireciona para login se não estiver autenticado
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verifica se o usuário tem role de admin
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default AdminRoute;
