import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ReactQueryDevtools } from 'react-query/devtools';
import { ThemeProvider } from 'styled-components';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GlobalStyles, theme } from './styles/GlobalStyles';

// Components (carregamento imediato)
import Login from './components/Login/Login';
import Profile from './components/Profile/Profile';
import Layout from './components/Layout/Layout';
import LoadingScreen from './components/LoadingScreen/LoadingScreen';
import AdminRoute from './components/AdminRoute/AdminRoute';

// Lazy loaded components (carregamento sob demanda)
const MachinesCatalog = React.lazy(() => import('./components/MachinesCatalog/MachinesCatalog'));
const Calculator = React.lazy(() => import('./components/Calculator/Calculator'));
const PDFGenerator = React.lazy(() => import('./components/PDFGenerator/PDFGenerator'));

// Admin Components (lazy loaded)
const AdminDashboard = React.lazy(() => import('./components/Admin/Dashboard/AdminDashboard'));
const ProductsManagement = React.lazy(() => import('./components/Admin/Products/ProductsManagement'));
const FormulasManagement = React.lazy(() => import('./components/Admin/Formulas/FormulasManagement'));
const UsersManagement = React.lazy(() => import('./components/Admin/Users/UsersManagement'));

// Configuração do React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Componente para rotas protegidas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Componente para rotas públicas (redireciona se já autenticado)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

// Componente principal de rotas
const AppRoutes = () => {
  return (
    <Routes>
      {/* Rotas públicas */}
      <Route 
        path="/login" 
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } 
      />

      {/* Rotas protegidas */}
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard - Catálogo de máquinas */}
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={
          <Suspense fallback={<LoadingScreen />}>
            <MachinesCatalog />
          </Suspense>
        } />
        
        {/* Calculadora de orçamento */}
        <Route path="calculator/:machineId" element={
          <Suspense fallback={<LoadingScreen />}>
            <Calculator />
          </Suspense>
        } />
        
        {/* Gerador de PDF */}
        <Route path="pdf-generator" element={
          <Suspense fallback={<LoadingScreen />}>
            <PDFGenerator />
          </Suspense>
        } />
        
        {/* Perfil do usuário */}
        <Route path="profile" element={<Profile />} />
        
        {/* Rotas administrativas */}
        <Route path="admin/*" element={<AdminRoute />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={
            <Suspense fallback={<LoadingScreen />}>
              <AdminDashboard />
            </Suspense>
          } />
          <Route path="products" element={
            <Suspense fallback={<LoadingScreen />}>
              <ProductsManagement />
            </Suspense>
          } />
          <Route path="formulas" element={
            <Suspense fallback={<LoadingScreen />}>
              <FormulasManagement />
            </Suspense>
          } />
          <Route path="users" element={
            <Suspense fallback={<LoadingScreen />}>
              <UsersManagement />
            </Suspense>
          } />
        </Route>
      </Route>

      {/* Rota 404 */}
      <Route 
        path="*" 
        element={
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100vh',
            textAlign: 'center',
            padding: '2rem'
          }}>
            <h1 style={{ fontSize: '4rem', margin: '0', color: theme.colors.primary }}>404</h1>
            <h2 style={{ margin: '1rem 0', color: theme.colors.textPrimary }}>Página não encontrada</h2>
            <p style={{ color: theme.colors.textMuted, marginBottom: '2rem' }}>
              A página que você está procurando não existe.
            </p>
            <button
              onClick={() => window.location.href = '/dashboard'}
              style={{
                background: theme.colors.primary,
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px'
              }}
            >
              Voltar ao Dashboard
            </button>
          </div>
        } 
      />
    </Routes>
  );
};

// Componente principal da aplicação
const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <Router
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true
            }}
          >
            <GlobalStyles />
            <AppRoutes />
            
            {/* Toast notifications */}
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
            />
            
            {/* React Query DevTools (apenas em desenvolvimento) */}
            {process.env.NODE_ENV === 'development' && (
              <ReactQueryDevtools initialIsOpen={false} />
            )}
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
