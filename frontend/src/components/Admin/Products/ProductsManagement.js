import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiEdit3, 
  FiTrash2, 
  FiSearch,
  FiX,
  FiSave
} from 'react-icons/fi';
import styled from 'styled-components';
import { toast } from 'react-toastify';

import { produtoService, adminService } from '../../../services/api';
import { 
  Container, 
  Button, 
  Input,
  Label,
  ErrorMessage,
  LoadingSpinner,
  Flex, 
  Text, 
  Heading 
} from '../../../styles/GlobalStyles';
import { theme } from '../../../styles/GlobalStyles';

// Styled Components
const ProductsContainer = styled(Container)`
  padding-top: ${theme.spacing.xl};
  padding-bottom: ${theme.spacing.xl};
`;

const ProductsHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.xl};
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
`;

const SearchAndFilters = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  margin-bottom: ${theme.spacing.lg};
  flex-wrap: wrap;
  align-items: center;
`;

const SearchInput = styled(Input)`
  min-width: 300px;
  
  @media (max-width: ${theme.breakpoints.sm}) {
    min-width: 100%;
  }
`;

const FilterSelect = styled.select`
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.surface};
  color: ${theme.colors.textPrimary};
  font-size: ${theme.fontSize.base};
  min-width: 150px;
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primary}20;
  }
`;

const ProductsTable = styled.div`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.lg};
  overflow: hidden;
  box-shadow: ${theme.colors.shadows.base};
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px 120px 150px 120px;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.lg};
  background: ${theme.colors.gray50};
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.textSecondary};
  font-size: ${theme.fontSize.sm};
  text-transform: uppercase;
  letter-spacing: 0.5px;
  
  @media (max-width: ${theme.breakpoints.md}) {
    grid-template-columns: 1fr 100px;
    gap: ${theme.spacing.sm};
  }
`;

const TableRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 120px 120px 150px 120px;
  gap: ${theme.spacing.md};
  padding: ${theme.spacing.lg};
  border-bottom: 1px solid ${theme.colors.border};
  align-items: center;
  transition: background 0.2s ease;
  
  &:hover {
    background: ${theme.colors.gray50};
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  @media (max-width: ${theme.breakpoints.md}) {
    grid-template-columns: 1fr 100px;
    gap: ${theme.spacing.sm};
  }
`;

const ProductInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;

const ProductName = styled.div`
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.textPrimary};
`;

const ProductDescription = styled.div`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textMuted};
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const ProductType = styled.span`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  text-transform: uppercase;
  
  ${props => props.type === 'maquina' && `
    background: ${theme.colors.primary}20;
    color: ${theme.colors.primary};
  `}
  
  ${props => props.type === 'acessorio' && `
    background: ${theme.colors.success}20;
    color: ${theme.colors.success};
  `}
`;

const ProductPrice = styled.div`
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.textPrimary};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${theme.spacing.xs};
  
  @media (max-width: ${theme.breakpoints.md}) {
    flex-direction: column;
  }
`;

const ActionButton = styled(Button)`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  min-height: 36px;
  
  @media (max-width: ${theme.breakpoints.md}) {
    width: 100%;
  }
`;

// Modal Styles
const ModalOverlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${theme.spacing.md};
`;

const ModalContent = styled(motion.div)`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.lg};
  padding: ${theme.spacing.xl};
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.xl};
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
  
  @media (max-width: ${theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.sm};
  
  &.full-width {
    grid-column: 1 / -1;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  background: ${theme.colors.surface};
  color: ${theme.colors.textPrimary};
  font-size: ${theme.fontSize.base};
  font-family: inherit;
  resize: vertical;
  min-height: 100px;
  
  &:focus {
    outline: none;
    border-color: ${theme.colors.primary};
    box-shadow: 0 0 0 3px ${theme.colors.primary}20;
  }
  
  &::placeholder {
    color: ${theme.colors.textMuted};
  }
`;

const ModalActions = styled.div`
  display: flex;
  gap: ${theme.spacing.md};
  justify-content: flex-end;
  margin-top: ${theme.spacing.xl};
  
  @media (max-width: ${theme.breakpoints.sm}) {
    flex-direction: column;
  }
`;

const ProductsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  const queryClient = useQueryClient();

  // Form hook
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue
  } = useForm();

  // Queries
  const { 
    data: produtos, 
    isLoading, 
    error 
  } = useQuery(
    ['produtos', searchTerm, typeFilter],
    () => produtoService.getProdutos({ 
      search: searchTerm,
      tipo: typeFilter 
    }),
    {
      keepPreviousData: true,
    }
  );

  // Mutations
  const createMutation = useMutation(adminService.createProduto, {
    onSuccess: () => {
      queryClient.invalidateQueries('produtos');
      toast.success('Produto criado com sucesso!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao criar produto');
    }
  });

  const updateMutation = useMutation(
    ({ id, data }) => adminService.updateProduto(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('produtos');
        toast.success('Produto atualizado com sucesso!');
        handleCloseModal();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erro ao atualizar produto');
      }
    }
  );

  const deleteMutation = useMutation(adminService.deleteProduto, {
    onSuccess: () => {
      queryClient.invalidateQueries('produtos');
      toast.success('Produto excluído com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir produto');
    }
  });

  // Handlers
  const handleOpenModal = (product = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
    
    if (product) {
      setValue('nome', product.nome);
      setValue('descricao', product.descricao);
      setValue('tipo', product.tipo);
      setValue('preco', product.preco);
      setValue('especificacoes', product.especificacoes);
    } else {
      reset();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    reset();
  };

  const handleSubmitForm = (data) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (product) => {
    if (window.confirm(`Tem certeza que deseja excluir "${product.nome}"?`)) {
      deleteMutation.mutate(product.id);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  const filteredProducts = Array.isArray(produtos?.data) ? produtos.data : [];

  return (
    <ProductsContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ProductsHeader>
          <div>
            <Heading size="2xl" color="primary">
              Gerenciamento de Produtos
            </Heading>
            <Text color="muted" style={{ marginTop: theme.spacing.xs }}>
              Gerencie máquinas e acessórios do sistema
            </Text>
          </div>
          
          <Button
            variant="primary"
            onClick={() => handleOpenModal()}
          >
            <FiPlus />
            Novo Produto
          </Button>
        </ProductsHeader>

        <SearchAndFilters>
          <SearchInput
            type="text"
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<FiSearch />}
          />
          
          <FilterSelect
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Todos os tipos</option>
            <option value="maquina">Máquinas</option>
            <option value="acessorio">Acessórios</option>
          </FilterSelect>
        </SearchAndFilters>

        {isLoading ? (
          <Flex justify="center" align="center" style={{ minHeight: '400px' }}>
            <LoadingSpinner size="lg" />
          </Flex>
        ) : error ? (
          <ErrorMessage>
            Erro ao carregar produtos. Tente novamente.
          </ErrorMessage>
        ) : (
          <ProductsTable>
            <TableHeader>
              <div>Produto</div>
              <div className="hidden-mobile">Tipo</div>
              <div className="hidden-mobile">Preço</div>
              <div className="hidden-mobile">Especificações</div>
              <div>Ações</div>
            </TableHeader>
            
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <TableRow>
                  <ProductInfo>
                    <ProductName>{product.nome}</ProductName>
                    <ProductDescription>{product.descricao}</ProductDescription>
                  </ProductInfo>
                  
                  <div className="hidden-mobile">
                    <ProductType type={product.tipo}>
                      {product.tipo}
                    </ProductType>
                  </div>
                  
                  <div className="hidden-mobile">
                    <ProductPrice>
                      {formatCurrency(product.preco)}
                    </ProductPrice>
                  </div>
                  
                  <div className="hidden-mobile">
                    <Text size="sm" color="muted">
                      {product.especificacoes ? 'Sim' : 'Não'}
                    </Text>
                  </div>
                  
                  <ActionButtons>
                    <ActionButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenModal(product)}
                    >
                      <FiEdit3 />
                    </ActionButton>
                    
                    <ActionButton
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(product)}
                      disabled={deleteMutation.isLoading}
                    >
                      <FiTrash2 />
                    </ActionButton>
                  </ActionButtons>
                </TableRow>
              </motion.div>
            ))}
            
            {filteredProducts.length === 0 && (
              <div style={{ padding: theme.spacing.xl, textAlign: 'center' }}>
                <Text color="muted">Nenhum produto encontrado</Text>
              </div>
            )}
          </ProductsTable>
        )}
      </motion.div>

      {/* Modal de Criação/Edição */}
      <AnimatePresence>
        {isModalOpen && (
          <ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCloseModal}
          >
            <ModalContent
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <ModalHeader>
                <Heading size="lg">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </Heading>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCloseModal}
                >
                  <FiX />
                </Button>
              </ModalHeader>

              <form onSubmit={handleSubmit(handleSubmitForm)}>
                <FormGrid>
                  <FormGroup>
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      {...register('nome', { 
                        required: 'Nome é obrigatório' 
                      })}
                      placeholder="Nome do produto"
                    />
                    {errors.nome && (
                      <ErrorMessage>{errors.nome.message}</ErrorMessage>
                    )}
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor="tipo">Tipo *</Label>
                    <FilterSelect
                      id="tipo"
                      {...register('tipo', { 
                        required: 'Tipo é obrigatório' 
                      })}
                    >
                      <option value="">Selecione o tipo</option>
                      <option value="maquina">Máquina</option>
                      <option value="acessorio">Acessório</option>
                    </FilterSelect>
                    {errors.tipo && (
                      <ErrorMessage>{errors.tipo.message}</ErrorMessage>
                    )}
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor="preco">Preço *</Label>
                    <Input
                      id="preco"
                      type="number"
                      step="0.01"
                      {...register('preco', { 
                        required: 'Preço é obrigatório',
                        min: { value: 0, message: 'Preço deve ser positivo' }
                      })}
                      placeholder="0.00"
                    />
                    {errors.preco && (
                      <ErrorMessage>{errors.preco.message}</ErrorMessage>
                    )}
                  </FormGroup>

                  <FormGroup className="full-width">
                    <Label htmlFor="descricao">Descrição</Label>
                    <TextArea
                      id="descricao"
                      {...register('descricao')}
                      placeholder="Descrição do produto"
                    />
                  </FormGroup>

                  <FormGroup className="full-width">
                    <Label htmlFor="especificacoes">Especificações (JSON)</Label>
                    <TextArea
                      id="especificacoes"
                      {...register('especificacoes')}
                      placeholder='{"potencia": "1000W", "peso": "50kg"}'
                    />
                  </FormGroup>
                </FormGrid>

                <ModalActions>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseModal}
                  >
                    Cancelar
                  </Button>
                  
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isSubmitting || createMutation.isLoading || updateMutation.isLoading}
                  >
                    {isSubmitting || createMutation.isLoading || updateMutation.isLoading ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <FiSave />
                        {editingProduct ? 'Atualizar' : 'Criar'}
                      </>
                    )}
                  </Button>
                </ModalActions>
              </form>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </ProductsContainer>
  );
};

export default ProductsManagement;
