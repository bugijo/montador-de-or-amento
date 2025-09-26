import React, { useState } from 'react';
import { useQuery } from 'react-query';
import { motion } from 'framer-motion';
import { 
  FiTrendingUp, 
  FiUsers, 
  FiPackage, 
  FiDollarSign,
  FiBarChart,
  FiPieChart,
  FiRefreshCw
} from 'react-icons/fi';
import styled from 'styled-components';

import { adminService } from '../../../services/api';
import { 
  Container, 
  Card, 
  Button, 
  Flex, 
  Text, 
  Heading,
  LoadingSpinner,
  ErrorMessage 
} from '../../../styles/GlobalStyles';
import { theme } from '../../../styles/GlobalStyles';

// Styled Components
const DashboardContainer = styled(Container)`
  padding-top: ${theme.spacing.xl};
  padding-bottom: ${theme.spacing.xl};
`;

const DashboardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.xl};
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
`;

const StatCard = styled(Card)`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.lg};
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${theme.colors.shadows.lg};
  }
`;

const StatIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: ${theme.borderRadius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
  
  ${props => props.variant === 'primary' && `background: ${theme.colors.primary};`}
  ${props => props.variant === 'success' && `background: ${theme.colors.success};`}
  ${props => props.variant === 'warning' && `background: ${theme.colors.warning};`}
  ${props => props.variant === 'info' && `background: ${theme.colors.info};`}
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatValue = styled.div`
  font-size: ${theme.fontSize['2xl']};
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing.xs};
`;

const StatLabel = styled.div`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textMuted};
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.xl};
`;

const ChartCard = styled(Card)`
  padding: ${theme.spacing.xl};
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.lg};
`;

const PeriodSelector = styled.div`
  display: flex;
  gap: ${theme.spacing.xs};
`;

const PeriodButton = styled(Button).withConfig({
  shouldForwardProp: (prop) => !['active'].includes(prop),
})`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  font-size: ${theme.fontSize.sm};
  
  ${props => props.active && `
    background: ${theme.colors.primary};
    color: white;
  `}
`;

const SimpleChart = styled.div`
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${theme.colors.gray50};
  border-radius: ${theme.borderRadius.md};
  color: ${theme.colors.textMuted};
  font-style: italic;
`;

const TopMaquinasList = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.md};
`;

const MaquinaItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.md};
  background: ${theme.colors.gray50};
  border-radius: ${theme.borderRadius.md};
  transition: background 0.2s ease;
  
  &:hover {
    background: ${theme.colors.gray100};
  }
`;

const MaquinaInfo = styled.div`
  flex: 1;
`;

const MaquinaNome = styled.div`
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.textPrimary};
  margin-bottom: ${theme.spacing.xs};
`;

const MaquinaStats = styled.div`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textMuted};
`;

const MaquinaValue = styled.div`
  font-weight: ${theme.fontWeight.bold};
  color: ${theme.colors.primary};
`;

const AdminDashboard = () => {
  const [periodo, setPeriodo] = useState('30d');

  // Queries para buscar dados
  const { 
    data: dashboardStats, 
    isLoading: statsLoading, 
    error: statsError,
    refetch: refetchStats
  } = useQuery(
    'dashboard-stats',
    adminService.getDashboardStats,
    {
      refetchInterval: 5 * 60 * 1000, // Atualiza a cada 5 minutos
    }
  );

  const { 
    isLoading: orcamentosLoading 
  } = useQuery(
    ['orcamentos-stats', periodo],
    () => adminService.getOrcamentosStats(periodo),
    {
      enabled: !!periodo,
    }
  );

  const { 
    data: topMaquinas, 
    isLoading: maquinasLoading 
  } = useQuery(
    'top-maquinas',
    () => adminService.getTopMaquinas(5),
    {
      refetchInterval: 10 * 60 * 1000, // Atualiza a cada 10 minutos
    }
  );

  const { 
    isLoading: vendasLoading 
  } = useQuery(
    ['vendas-por-vendedor', periodo],
    () => adminService.getVendasPorVendedor(periodo),
    {
      enabled: !!periodo,
    }
  );

  const handleRefresh = () => {
    refetchStats();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('pt-BR').format(value || 0);
  };

  if (statsLoading) {
    return (
      <DashboardContainer>
        <Flex justify="center" align="center" style={{ minHeight: '400px' }}>
          <LoadingSpinner size="lg" />
        </Flex>
      </DashboardContainer>
    );
  }

  if (statsError) {
    return (
      <DashboardContainer>
        <ErrorMessage>
          Erro ao carregar dados do dashboard. Tente novamente.
        </ErrorMessage>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <DashboardHeader>
          <div>
            <Heading size="2xl" color="primary">
              Dashboard Administrativo
            </Heading>
            <Text color="muted" style={{ marginTop: theme.spacing.xs }}>
              Visão geral do sistema e métricas de performance
            </Text>
          </div>
          
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={statsLoading}
          >
            <FiRefreshCw />
            Atualizar
          </Button>
        </DashboardHeader>

        {/* Cards de Estatísticas */}
        <StatsGrid>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <StatCard>
              <StatIcon variant="primary">
                <FiDollarSign />
              </StatIcon>
              <StatContent>
                <StatValue>
                  {formatCurrency(dashboardStats?.data?.totalVendas)}
                </StatValue>
                <StatLabel>Total em Vendas</StatLabel>
              </StatContent>
            </StatCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <StatCard>
              <StatIcon variant="success">
                <FiTrendingUp />
              </StatIcon>
              <StatContent>
                <StatValue>
                  {formatNumber(dashboardStats?.data?.totalOrcamentos)}
                </StatValue>
                <StatLabel>Orçamentos Gerados</StatLabel>
              </StatContent>
            </StatCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <StatCard>
              <StatIcon variant="info">
                <FiUsers />
              </StatIcon>
              <StatContent>
                <StatValue>
                  {formatNumber(dashboardStats?.data?.totalVendedores)}
                </StatValue>
                <StatLabel>Vendedores Ativos</StatLabel>
              </StatContent>
            </StatCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <StatCard>
              <StatIcon variant="warning">
                <FiPackage />
              </StatIcon>
              <StatContent>
                <StatValue>
                  {formatNumber(dashboardStats?.data?.totalProdutos)}
                </StatValue>
                <StatLabel>Produtos Cadastrados</StatLabel>
              </StatContent>
            </StatCard>
          </motion.div>
        </StatsGrid>

        {/* Gráficos */}
        <ChartsGrid>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <ChartCard>
              <ChartHeader>
                <div>
                  <Heading size="lg">Orçamentos por Período</Heading>
                  <Text color="muted" size="sm">
                    Evolução dos orçamentos gerados
                  </Text>
                </div>
                
                <PeriodSelector>
                  {['7d', '30d', '90d'].map((p) => (
                    <PeriodButton
                      key={p}
                      variant="outline"
                      active={periodo === p}
                      onClick={() => setPeriodo(p)}
                    >
                      {p === '7d' ? '7 dias' : p === '30d' ? '30 dias' : '90 dias'}
                    </PeriodButton>
                  ))}
                </PeriodSelector>
              </ChartHeader>
              
              {orcamentosLoading ? (
                <Flex justify="center" align="center" style={{ height: '300px' }}>
                  <LoadingSpinner />
                </Flex>
              ) : (
                <SimpleChart>
                  <div>
                    <FiBarChart size={48} />
                    <div style={{ marginTop: theme.spacing.md }}>
                      Gráfico de orçamentos será renderizado aqui
                    </div>
                    <div style={{ fontSize: theme.fontSize.sm, marginTop: theme.spacing.sm }}>
                      (Instale recharts para visualizar)
                    </div>
                  </div>
                </SimpleChart>
              )}
            </ChartCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <ChartCard>
              <ChartHeader>
                <div>
                  <Heading size="lg">Top Máquinas</Heading>
                  <Text color="muted" size="sm">
                    Máquinas mais vendidas
                  </Text>
                </div>
              </ChartHeader>
              
              {maquinasLoading ? (
                <Flex justify="center" align="center" style={{ height: '300px' }}>
                  <LoadingSpinner />
                </Flex>
              ) : (
                <TopMaquinasList>
                  {(Array.isArray(topMaquinas?.data?.maquinas) && topMaquinas.data.maquinas.map((maquina, index) => (
                    <motion.div
                      key={maquina.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                    >
                      <MaquinaItem>
                        <MaquinaInfo>
                          <MaquinaNome>{maquina.nome}</MaquinaNome>
                          <MaquinaStats>
                            {formatNumber(maquina.total_orcamentos)} orçamentos
                          </MaquinaStats>
                        </MaquinaInfo>
                        <MaquinaValue>
                          {formatCurrency(maquina.valor_total)}
                        </MaquinaValue>
                      </MaquinaItem>
                    </motion.div>
                  ))) || (
                    <Text color="muted" style={{ textAlign: 'center', padding: theme.spacing.xl }}>
                      Nenhum dado disponível
                    </Text>
                  )}
                </TopMaquinasList>
              )}
            </ChartCard>
          </motion.div>
        </ChartsGrid>

        {/* Vendas por Vendedor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <ChartCard>
            <ChartHeader>
              <div>
                <Heading size="lg">Performance dos Vendedores</Heading>
                <Text color="muted" size="sm">
                  Vendas por vendedor no período selecionado
                </Text>
              </div>
            </ChartHeader>
            
            {vendasLoading ? (
              <Flex justify="center" align="center" style={{ height: '200px' }}>
                <LoadingSpinner />
              </Flex>
            ) : (
              <SimpleChart style={{ height: '200px' }}>
                <div>
                  <FiPieChart size={48} />
                  <div style={{ marginTop: theme.spacing.md }}>
                    Gráfico de vendas por vendedor será renderizado aqui
                  </div>
                  <div style={{ fontSize: theme.fontSize.sm, marginTop: theme.spacing.sm }}>
                    (Instale recharts para visualizar)
                  </div>
                </div>
              </SimpleChart>
            )}
          </ChartCard>
        </motion.div>
      </motion.div>
    </DashboardContainer>
  );
};

export default AdminDashboard;
