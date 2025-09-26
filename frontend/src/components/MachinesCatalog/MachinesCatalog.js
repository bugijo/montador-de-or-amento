import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from 'react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiSearch, 
  FiGrid, 
  FiList, 
  FiFilter,
  FiTrendingUp,
  FiPackage,
  FiUsers,
  FiDollarSign,
  FiStar,
  FiArrowRight
} from 'react-icons/fi';
import styled from 'styled-components';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

import { produtoService } from '../../services/produtoService';
import { Button } from '../../styles/GlobalStyles';
import { theme } from '../../styles/GlobalStyles';

const CatalogContainer = styled(Container)`
  padding-top: ${theme.spacing.xl};
  padding-bottom: ${theme.spacing.xl};
  position: relative;
`;

const Header = styled(motion.div)`
  margin-bottom: ${theme.spacing.xl};
  text-align: center;
  position: relative;
`;

const HeaderBackground = styled.div`
  position: absolute;
  top: -50px;
  left: -50px;
  right: -50px;
  bottom: -50px;
  background: ${theme.colors.gradients.primary};
  border-radius: ${theme.borderRadius['3xl']};
  opacity: 0.1;
  filter: blur(40px);
  z-index: -1;
`;

const StatsBar = styled(motion.div)`
  display: flex;
  justify-content: center;
  gap: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.xl};
  flex-wrap: wrap;
`;

const StatItem = styled(motion.div)`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  background: ${theme.colors.gradients.glass};
  backdrop-filter: blur(20px);
  border: ${theme.colors.borders.light};
  border-radius: ${theme.borderRadius.xl};
  box-shadow: ${theme.colors.shadows.glass};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${theme.colors.shadows.lg};
  }
`;

const StatIcon = styled.div`
  width: 40px;
  height: 40px;
  background: ${theme.colors.gradients.secondary};
  border-radius: ${theme.borderRadius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const StatContent = styled.div`
  h4 {
    font-size: 1.25rem;
    font-weight: 700;
    color: ${theme.colors.textPrimary};
    margin: 0;
    line-height: 1;
  }
  
  span {
    font-size: 0.85rem;
    color: ${theme.colors.textMuted};
    line-height: 1;
  }
`;

const SearchAndFilters = styled(motion.div)`
  background: ${theme.colors.gradients.glass};
  backdrop-filter: blur(20px);
  border: ${theme.colors.borders.light};
  border-radius: ${theme.borderRadius['2xl']};
  box-shadow: ${theme.colors.shadows.glass};
  padding: ${theme.spacing.xl};
  margin-bottom: ${theme.spacing.xl};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    pointer-events: none;
  }
`;

const SearchContainer = styled.div`
  position: relative;
  flex: 1;
  max-width: 500px;
`;

const SearchIcon = styled.div`
  position: absolute;
  left: ${theme.spacing.lg};
  top: 50%;
  transform: translateY(-50%);
  color: ${theme.colors.textMuted};
  z-index: 2;
`;

const SearchInput = styled(Input)`
  padding-left: 3.5rem;
  padding-right: 3.5rem;
  height: 56px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: ${theme.borderRadius.xl};
  font-size: 1rem;
  transition: all ${theme.transitions.normal};
  
  &:focus {
    background: rgba(255, 255, 255, 0.15);
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    transform: translateY(-1px);
  }
  
  &::placeholder {
    color: ${theme.colors.textMuted};
  }
`;

const FilterButton = styled(motion.button)`
  position: absolute;
  right: ${theme.spacing.md};
  top: 50%;
  transform: translateY(-50%);
  background: ${theme.colors.gradients.primary};
  border: none;
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.sm};
  color: white;
  cursor: pointer;
  transition: all ${theme.transitions.normal};
  
  &:hover {
    transform: translateY(-50%) scale(1.1);
    box-shadow: ${theme.colors.shadows.lg};
  }
`;

const ViewToggle = styled.div`
  display: flex;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: ${theme.borderRadius.xl};
  padding: 4px;
  gap: 4px;
`;

const ViewButton = styled(motion.button).withConfig({
  shouldForwardProp: (prop) => !['active'].includes(prop),
})`
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border: none;
  background: ${props => props.active ? theme.colors.gradients.primary : 'transparent'};
  color: ${props => props.active ? 'white' : theme.colors.textMuted};
  border-radius: ${theme.borderRadius.lg};
  cursor: pointer;
  transition: all ${theme.transitions.normal};
  display: flex;
  align-items: center;
  gap: ${theme.spacing.sm};
  font-weight: 500;
  
  &:hover {
    color: ${props => props.active ? 'white' : theme.colors.textPrimary};
    background: ${props => props.active ? theme.colors.gradients.primary : 'rgba(255, 255, 255, 0.1)'};
  }
`;

const MachinesGrid = styled(Grid)`
  ${props => props.view === 'list' && `
    grid-template-columns: 1fr;
    gap: ${theme.spacing.lg};
  `}
  
  ${props => props.view === 'grid' && `
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: ${theme.spacing.xl};
  `}
  
  @media (max-width: ${theme.breakpoints.md}) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.lg};
  }
`;

const MachineCard = styled(motion.div)`
  background: ${theme.colors.gradients.glass};
  backdrop-filter: blur(20px);
  border: ${theme.colors.borders.light};
  border-radius: ${theme.borderRadius['2xl']};
  box-shadow: ${theme.colors.shadows.glass};
  cursor: pointer;
  transition: all ${theme.transitions.normal};
  overflow: hidden;
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%);
    pointer-events: none;
    z-index: 1;
  }
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: ${theme.colors.shadows.xl};
    border-color: rgba(255, 255, 255, 0.3);
    
    &::before {
      background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, rgba(255, 255, 255, 0.1) 100%);
    }
  }
  
  ${props => props.view === 'list' && `
    display: flex;
    align-items: center;
    gap: ${theme.spacing.xl};
    padding: ${theme.spacing.xl};
    
    @media (max-width: ${theme.breakpoints.sm}) {
      flex-direction: column;
      text-align: center;
    }
  `}
  
  ${props => props.view === 'grid' && `
    padding: 0;
  `}
`;

const MachineImage = styled.div`
  width: ${props => props.view === 'list' ? '160px' : '100%'};
  height: ${props => props.view === 'list' ? '160px' : '240px'};
  background: ${props => props.src ? `url(${props.src})` : theme.colors.gradients.secondary};
  background-size: cover;
  background-position: center;
  border-radius: ${props => props.view === 'list' ? theme.borderRadius.xl : `${theme.borderRadius['2xl']} ${theme.borderRadius['2xl']} 0 0`};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: ${props => props.view === 'grid' ? '0' : '0'};
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }
  
  ${MachineCard}:hover &::after {
    transform: translateX(100%);
  }
  
  ${props => !props.src && `
    color: white;
    font-size: ${theme.fontSize.sm};
    text-align: center;
    padding: ${theme.spacing.lg};
    font-weight: 500;
  `}
  
  @media (max-width: ${theme.breakpoints.sm}) {
    width: 100%;
    height: 200px;
    margin-bottom: ${theme.spacing.lg};
  }
`;

const MachineContent = styled.div`
  padding: ${props => props.view === 'grid' ? theme.spacing.xl : '0'};
  flex: 1;
  position: relative;
  z-index: 2;
`;

const MachineHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${theme.spacing.md};
`;

const MachineTitle = styled(Heading)`
  margin: 0;
  color: ${theme.colors.textPrimary};
  font-weight: 700;
  line-height: 1.2;
`;

const PopularityBadge = styled.div`
  background: ${theme.colors.gradients.warning};
  color: white;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.full};
  font-size: 0.75rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  box-shadow: ${theme.colors.shadows.sm};
`;

const MachineDescription = styled(Text)`
  margin-bottom: ${theme.spacing.lg};
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.5;
`;

const MachineSpecs = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${theme.spacing.sm};
  margin-bottom: ${theme.spacing.lg};
`;

const SpecTag = styled.span`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  color: ${theme.colors.textPrimary};
  padding: ${theme.spacing.xs} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSize.sm};
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all ${theme.transitions.normal};
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-1px);
  }
`;

const MachineFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const PriceTag = styled.div`
  background: ${theme.colors.gradients.success};
  color: white;
  padding: ${theme.spacing.sm} ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.xl};
  font-weight: 700;
  font-size: 1.1rem;
  box-shadow: ${theme.colors.shadows.md};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover::before {
    left: 100%;
  }
`;

const SelectButton = styled(Button)`
  background: ${theme.colors.gradients.primary};
  border: none;
  padding: ${theme.spacing.md} ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.xl};
  font-weight: 600;
  transition: all ${theme.transitions.normal};
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s ease;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${theme.colors.shadows.lg};
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const EmptyState = styled(motion.div)`
  text-align: center;
  padding: ${theme.spacing['4xl']};
  background: ${theme.colors.gradients.glass};
  backdrop-filter: blur(20px);
  border: ${theme.colors.borders.light};
  border-radius: ${theme.borderRadius['2xl']};
  box-shadow: ${theme.colors.shadows.glass};
`;

const EmptyIcon = styled.div`
  width: 80px;
  height: 80px;
  background: ${theme.colors.gradients.secondary};
  border-radius: ${theme.borderRadius.full};
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto ${theme.spacing.lg};
  color: white;
`;

const LoadingCard = styled(motion.div)`
  background: ${theme.colors.gradients.glass};
  backdrop-filter: blur(20px);
  border: ${theme.colors.borders.light};
  border-radius: ${theme.borderRadius['2xl']};
  box-shadow: ${theme.colors.shadows.glass};
  padding: ${theme.spacing.xl};
  overflow: hidden;
`;

const MachinesCatalog = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const navigate = useNavigate();

  const {
    data: machinesData,
    isLoading,
    error,
    refetch
  } = useQuery(
    'machines',
    produtoService.getMaquinas,
    {
      staleTime: 5 * 60 * 1000, // 5 minutos
      cacheTime: 10 * 60 * 1000, // 10 minutos
    }
  );

  const machines = machinesData?.data?.maquinas || [];

  // Filtrar máquinas baseado na busca (memoizado)
  const filteredMachines = useMemo(() => {
    if (!searchTerm) return machines;
    
    const searchLower = searchTerm.toLowerCase();
    return machines.filter(machine =>
      machine.nome.toLowerCase().includes(searchLower) ||
      machine.descricao?.toLowerCase().includes(searchLower) ||
      machine.categoria?.toLowerCase().includes(searchLower)
    );
  }, [machines, searchTerm]);

  const handleMachineSelect = useCallback((machine) => {
    navigate(`/calculator/${machine.id}`, {
      state: { machine }
    });
  }, [navigate]);

  const formatPrice = useCallback((price) => {
    if (!price) return 'Consulte';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  }, []);

  const renderMachineSpecs = useCallback((machine) => {
    const specs = [];
    
    if (machine.especificacoes_tecnicas) {
      const { potencia, voltagem, frequencia } = machine.especificacoes_tecnicas;
      if (potencia) specs.push(potencia);
      if (voltagem) specs.push(voltagem);
      if (frequencia) specs.push(frequencia);
    }
    
    if (machine.peso) {
      specs.push(`${machine.peso}kg`);
    }
    
    return specs;
  }, []);

  const renderLoadingSkeleton = useCallback(() => (
    <MachinesGrid view={viewMode}>
      {Array.from({ length: 6 }).map((_, index) => (
        <LoadingCard
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
        >
          <Skeleton height={viewMode === 'grid' ? 240 : 160} style={{ marginBottom: '1rem', borderRadius: '12px' }} />
          <Skeleton height={24} style={{ marginBottom: '0.5rem', borderRadius: '6px' }} />
          <Skeleton height={16} count={2} style={{ marginBottom: '1rem', borderRadius: '4px' }} />
          <Skeleton height={32} width={120} style={{ marginBottom: '1rem', borderRadius: '16px' }} />
          <Skeleton height={48} style={{ borderRadius: '12px' }} />
        </LoadingCard>
      ))}
    </MachinesGrid>
  ), [viewMode]);

  if (error) {
    return (
      <CatalogContainer>
        <EmptyState
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <EmptyIcon>
            <FiInfo size={32} />
          </EmptyIcon>
          <Heading $level={3} style={{ marginBottom: theme.spacing.sm }}>
            Erro ao carregar máquinas
          </Heading>
          <Text color="muted" style={{ marginBottom: theme.spacing.lg }}>
            Não foi possível carregar o catálogo de máquinas.
          </Text>
          <Button variant="primary" onClick={() => refetch()}>
            Tentar Novamente
          </Button>
        </EmptyState>
      </CatalogContainer>
    );
  }

  return (
    <CatalogContainer>
      <Header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <HeaderBackground />
        <Heading $level={1} style={{ marginBottom: theme.spacing.sm, fontSize: '2.5rem', fontWeight: 800 }}>
          Catálogo de Máquinas
        </Heading>
        <Text color="muted" style={{ fontSize: '1.1rem' }}>
          Selecione uma máquina para calcular o orçamento personalizado
        </Text>
      </Header>

      <StatsBar
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <StatItem
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <StatIcon>
            <FiSettings size={20} />
          </StatIcon>
          <StatContent>
            <h4>{machines.length}</h4>
            <span>Máquinas</span>
          </StatContent>
        </StatItem>

        <StatItem
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <StatIcon>
            <FiTrendingUp size={20} />
          </StatIcon>
          <StatContent>
            <h4>{filteredMachines.length}</h4>
            <span>Disponíveis</span>
          </StatContent>
        </StatItem>

        <StatItem
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <StatIcon>
            <FiZap size={20} />
          </StatIcon>
          <StatContent>
            <h4>100%</h4>
            <span>Precisão</span>
          </StatContent>
        </StatItem>
      </StatsBar>

      <SearchAndFilters
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Flex justify="space-between" align="center" $responsive>
          <SearchContainer>
            <SearchIcon>
              <FiSearch size={20} />
            </SearchIcon>
            <SearchInput
              type="text"
              placeholder="Buscar máquinas por nome, categoria ou especificação..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FilterButton
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <FiFilter size={18} />
            </FilterButton>
          </SearchContainer>

          <ViewToggle>
            <ViewButton
              active={viewMode === 'grid'}
              onClick={() => setViewMode('grid')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiGrid size={18} />
              Grade
            </ViewButton>
            <ViewButton
              active={viewMode === 'list'}
              onClick={() => setViewMode('list')}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <FiList size={18} />
              Lista
            </ViewButton>
          </ViewToggle>
        </Flex>
      </SearchAndFilters>

      {isLoading ? (
        renderLoadingSkeleton()
      ) : filteredMachines.length === 0 ? (
        <EmptyState
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <EmptyIcon>
            <FiSearch size={32} />
          </EmptyIcon>
          <Heading $level={3} style={{ marginBottom: theme.spacing.sm }}>
            {searchTerm ? 'Nenhuma máquina encontrada' : 'Nenhuma máquina disponível'}
          </Heading>
          <Text color="muted">
            {searchTerm 
              ? 'Tente ajustar os termos de busca ou remover filtros.'
              : 'Não há máquinas cadastradas no momento.'
            }
          </Text>
        </EmptyState>
      ) : (
        <AnimatePresence>
          <MachinesGrid view={viewMode}>
            {filteredMachines.map((machine, index) => (
              <MachineCard
                key={machine.id}
                view={viewMode}
                onClick={() => handleMachineSelect(machine)}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -30 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <MachineImage
                  view={viewMode}
                  src={machine.foto_url}
                >
                  {!machine.foto_url && (
                    <div style={{ textAlign: 'center' }}>
                      <FiSettings size={32} style={{ marginBottom: '8px' }} />
                      <div>Imagem não disponível</div>
                    </div>
                  )}
                </MachineImage>

                <MachineContent view={viewMode}>
                  <MachineHeader>
                    <MachineTitle $level={viewMode === 'grid' ? 4 : 3}>
                      {machine.nome}
                    </MachineTitle>
                    {index < 3 && (
                      <PopularityBadge>
                        <FiStar size={12} />
                        Popular
                      </PopularityBadge>
                    )}
                  </MachineHeader>

                  {machine.descricao && (
                    <MachineDescription color="muted">
                      {machine.descricao}
                    </MachineDescription>
                  )}

                  {renderMachineSpecs(machine).length > 0 && (
                    <MachineSpecs>
                      {renderMachineSpecs(machine).slice(0, 4).map((spec, index) => (
                        <SpecTag key={index}>{spec}</SpecTag>
                      ))}
                    </MachineSpecs>
                  )}

                  <MachineFooter>
                    {machine.preco_base && (
                      <PriceTag>
                        {formatPrice(machine.preco_base)}
                      </PriceTag>
                    )}

                    <SelectButton
                      fullWidth={!machine.preco_base || viewMode === 'grid'}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMachineSelect(machine);
                      }}
                    >
                      Calcular Orçamento
                      <FiArrowRight size={18} />
                    </SelectButton>
                  </MachineFooter>
                </MachineContent>
              </MachineCard>
            ))}
          </MachinesGrid>
        </AnimatePresence>
      )}
    </CatalogContainer>
  );
};

export default React.memo(MachinesCatalog);
