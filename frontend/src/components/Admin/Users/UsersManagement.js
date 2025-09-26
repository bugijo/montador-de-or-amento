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
  FiSave,
  FiToggleLeft,
  FiToggleRight,
  FiEye,
  FiEyeOff
} from 'react-icons/fi';
import styled from 'styled-components';
import { toast } from 'react-toastify';

import { adminService } from '../../../services/api';
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
const UsersContainer = styled(Container)`
  padding-top: ${theme.spacing.xl};
  padding-bottom: ${theme.spacing.xl};
`;

const UsersHeader = styled.div`
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

const UsersTable = styled.div`
  background: ${theme.colors.surface};
  border-radius: ${theme.borderRadius.lg};
  overflow: hidden;
  box-shadow: ${theme.colors.shadows.lg};
`;

const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr 200px 120px 120px 150px;
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
  grid-template-columns: 1fr 200px 120px 120px 150px;
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

const UserInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${theme.spacing.xs};
`;

const UserName = styled.div`
  font-weight: ${theme.fontWeight.medium};
  color: ${theme.colors.textPrimary};
`;

const UserEmail = styled.div`
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textMuted};
`;

const UserRole = styled.span`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSize.xs};
  font-weight: ${theme.fontWeight.medium};
  text-transform: uppercase;
  
  ${props => props.role === 'admin' && `
    background: ${theme.colors.danger}20;
    color: ${theme.colors.danger};
  `}
  
  ${props => props.role === 'vendedor' && `
    background: ${theme.colors.primary}20;
    color: ${theme.colors.primary};
  `}
`;

const StatusToggle = styled.button.withConfig({
  shouldForwardProp: (prop) => !['active'].includes(prop),
})`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.xs};
  background: none;
  border: none;
  cursor: pointer;
  padding: ${theme.spacing.xs};
  border-radius: ${theme.borderRadius.md};
  transition: background 0.2s ease;
  
  &:hover {
    background: ${theme.colors.gray50};
  }
  
  ${props => props.active && `
    color: ${theme.colors.success};
  `}
  
  ${props => !props.active && `
    color: ${theme.colors.textMuted};
  `}
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

const PasswordInput = styled.div`
  position: relative;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: ${theme.spacing.sm};
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: ${theme.colors.textMuted};
  cursor: pointer;
  padding: ${theme.spacing.xs};
  
  &:hover {
    color: ${theme.colors.textPrimary};
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

const UsersManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  
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
    data: users, 
    isLoading, 
    error 
  } = useQuery(
    ['users', searchTerm, roleFilter, statusFilter],
    () => adminService.getUsers({ 
      search: searchTerm,
      role: roleFilter,
      status: statusFilter 
    }),
    {
      keepPreviousData: true,
    }
  );

  // Mutations
  const createMutation = useMutation(adminService.createUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      toast.success('Usuário criado com sucesso!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao criar usuário');
    }
  });

  const updateMutation = useMutation(
    ({ id, data }) => adminService.updateUser(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('Usuário atualizado com sucesso!');
        handleCloseModal();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erro ao atualizar usuário');
      }
    }
  );

  const updateStatusMutation = useMutation(
    ({ id, status }) => adminService.updateUserStatus(id, status),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('users');
        toast.success('Status atualizado com sucesso!');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erro ao atualizar status');
      }
    }
  );

  const deleteMutation = useMutation(adminService.deleteUser, {
    onSuccess: () => {
      queryClient.invalidateQueries('users');
      toast.success('Usuário excluído com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir usuário');
    }
  });

  // Handlers
  const handleOpenModal = (user = null) => {
    setEditingUser(user);
    setIsModalOpen(true);
    setShowPassword(false);
    
    if (user) {
      setValue('nome', user.nome);
      setValue('email', user.email);
      setValue('role', user.role);
      setValue('ativo', user.ativo);
    } else {
      reset();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    reset();
  };

  const handleSubmitForm = (data) => {
    // Se estiver editando e não forneceu senha, remover do payload
    if (editingUser && !data.senha) {
      delete data.senha;
    }
    
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleToggleStatus = (user) => {
    updateStatusMutation.mutate({ 
      id: user.id, 
      status: !user.ativo 
    });
  };

  const handleDelete = (user) => {
    if (window.confirm(`Tem certeza que deseja excluir "${user.nome}"?`)) {
      deleteMutation.mutate(user.id);
    }
  };

  const filteredUsers = Array.isArray(users?.data) ? users.data : [];

  return (
    <UsersContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <UsersHeader>
          <div>
            <Heading size="2xl" color="primary">
              Gerenciamento de Usuários
            </Heading>
            <Text color="muted" style={{ marginTop: theme.spacing.xs }}>
              Gerencie vendedores e administradores do sistema
            </Text>
          </div>
          
          <Button
            variant="primary"
            onClick={() => handleOpenModal()}
          >
            <FiPlus />
            Novo Usuário
          </Button>
        </UsersHeader>

        <SearchAndFilters>
          <SearchInput
            type="text"
            placeholder="Buscar usuários..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<FiSearch />}
          />
          
          <FilterSelect
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="">Todas as roles</option>
            <option value="admin">Administrador</option>
            <option value="vendedor">Vendedor</option>
          </FilterSelect>
          
          <FilterSelect
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos os status</option>
            <option value="true">Ativo</option>
            <option value="false">Inativo</option>
          </FilterSelect>
        </SearchAndFilters>

        {isLoading ? (
          <Flex justify="center" align="center" style={{ minHeight: '400px' }}>
            <LoadingSpinner size="lg" />
          </Flex>
        ) : error ? (
          <ErrorMessage>
            Erro ao carregar usuários. Tente novamente.
          </ErrorMessage>
        ) : (
          <UsersTable>
            <TableHeader>
              <div>Usuário</div>
              <div className="hidden-mobile">E-mail</div>
              <div className="hidden-mobile">Role</div>
              <div className="hidden-mobile">Status</div>
              <div>Ações</div>
            </TableHeader>
            
            {filteredUsers.map((user, index) => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <TableRow>
                  <UserInfo>
                    <UserName>{user.nome}</UserName>
                    <UserEmail className="mobile-only">{user.email}</UserEmail>
                  </UserInfo>
                  
                  <div className="hidden-mobile">
                    <Text size="sm" color="muted">
                      {user.email}
                    </Text>
                  </div>
                  
                  <div className="hidden-mobile">
                    <UserRole role={user.role}>
                      {user.role}
                    </UserRole>
                  </div>
                  
                  <div className="hidden-mobile">
                    <StatusToggle
                      active={user.ativo}
                      onClick={() => handleToggleStatus(user)}
                      disabled={updateStatusMutation.isLoading}
                    >
                      {user.ativo ? <FiToggleRight /> : <FiToggleLeft />}
                      {user.ativo ? 'Ativo' : 'Inativo'}
                    </StatusToggle>
                  </div>
                  
                  <ActionButtons>
                    <ActionButton
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenModal(user)}
                    >
                      <FiEdit3 />
                    </ActionButton>
                    
                    <ActionButton
                      variant="danger"
                      size="sm"
                      onClick={() => handleDelete(user)}
                      disabled={deleteMutation.isLoading}
                    >
                      <FiTrash2 />
                    </ActionButton>
                  </ActionButtons>
                </TableRow>
              </motion.div>
            ))}
            
            {filteredUsers.length === 0 && (
              <div style={{ padding: theme.spacing.xl, textAlign: 'center' }}>
                <Text color="muted">Nenhum usuário encontrado</Text>
              </div>
            )}
          </UsersTable>
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
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
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
                      placeholder="Nome completo"
                    />
                    {errors.nome && (
                      <ErrorMessage>{errors.nome.message}</ErrorMessage>
                    )}
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email', { 
                        required: 'E-mail é obrigatório',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'E-mail inválido'
                        }
                      })}
                      placeholder="usuario@exemplo.com"
                    />
                    {errors.email && (
                      <ErrorMessage>{errors.email.message}</ErrorMessage>
                    )}
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor="role">Role *</Label>
                    <FilterSelect
                      id="role"
                      {...register('role', { 
                        required: 'Role é obrigatória' 
                      })}
                    >
                      <option value="">Selecione a role</option>
                      <option value="vendedor">Vendedor</option>
                      <option value="admin">Administrador</option>
                    </FilterSelect>
                    {errors.role && (
                      <ErrorMessage>{errors.role.message}</ErrorMessage>
                    )}
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor="senha">
                      Senha {editingUser ? '(deixe vazio para manter)' : '*'}
                    </Label>
                    <PasswordInput>
                      <Input
                        id="senha"
                        type={showPassword ? 'text' : 'password'}
                        {...register('senha', editingUser ? {} : { 
                          required: 'Senha é obrigatória',
                          minLength: {
                            value: 6,
                            message: 'Senha deve ter pelo menos 6 caracteres'
                          }
                        })}
                        placeholder="Digite a senha"
                      />
                      <PasswordToggle
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FiEyeOff /> : <FiEye />}
                      </PasswordToggle>
                    </PasswordInput>
                    {errors.senha && (
                      <ErrorMessage>{errors.senha.message}</ErrorMessage>
                    )}
                  </FormGroup>

                  {editingUser && (
                    <FormGroup>
                      <Label>
                        <input
                          type="checkbox"
                          {...register('ativo')}
                          style={{ marginRight: theme.spacing.xs }}
                        />
                        Usuário ativo
                      </Label>
                    </FormGroup>
                  )}
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
                        {editingUser ? 'Atualizar' : 'Criar'}
                      </>
                    )}
                  </Button>
                </ModalActions>
              </form>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </UsersContainer>
  );
};

export default UsersManagement;
