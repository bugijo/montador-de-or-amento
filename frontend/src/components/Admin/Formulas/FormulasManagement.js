import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm, useFieldArray } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiPlus, 
  FiEdit3, 
  FiTrash2, 
  FiSearch,
  FiX,
  FiSave,
  FiPlay,
  FiCheckCircle,
  FiAlertCircle
} from 'react-icons/fi';
import styled from 'styled-components';
import { toast } from 'react-toastify';

import { formulaService, adminService } from '../../../services/api';
import { 
  Container, 
  Card, 
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
const FormulasContainer = styled(Container)`
  padding-top: ${theme.spacing.xl};
  padding-bottom: ${theme.spacing.xl};
`;

const FormulasHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: ${theme.spacing.xl};
  flex-wrap: wrap;
  gap: ${theme.spacing.md};
`;

const SearchContainer = styled.div`
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

const FormulasGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: ${theme.spacing.lg};
  
  @media (max-width: ${theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const FormulaCard = styled(Card)`
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${theme.colors.shadows.lg};
  }
`;

const FormulaHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${theme.spacing.md};
`;

const FormulaTitle = styled.div`
  font-weight: ${theme.fontWeight.semibold};
  color: ${theme.colors.textPrimary};
  font-size: ${theme.fontSize.lg};
`;

const FormulaDescription = styled.div`
  color: ${theme.colors.textMuted};
  font-size: ${theme.fontSize.sm};
  margin-bottom: ${theme.spacing.md};
  line-height: 1.5;
`;

const FormulaCode = styled.div`
  background: ${theme.colors.gray50};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.md};
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textSecondary};
  margin-bottom: ${theme.spacing.md};
  overflow-x: auto;
  white-space: pre-wrap;
`;

const VariablesList = styled.div`
  margin-bottom: ${theme.spacing.md};
`;

const VariableTag = styled.span`
  display: inline-block;
  background: ${theme.colors.primary}20;
  color: ${theme.colors.primary};
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSize.xs};
  margin-right: ${theme.spacing.xs};
  margin-bottom: ${theme.spacing.xs};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: ${theme.spacing.xs};
  justify-content: flex-end;
`;

const ActionButton = styled(Button)`
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  min-height: 36px;
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
  max-width: 800px;
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

const CodeTextArea = styled(TextArea)`
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  min-height: 150px;
`;

const VariablesSection = styled.div`
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
`;

const VariableItem = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: ${theme.spacing.md};
  align-items: end;
  margin-bottom: ${theme.spacing.md};
  
  @media (max-width: ${theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
    gap: ${theme.spacing.sm};
  }
`;

const TestSection = styled.div`
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.lg};
  margin-bottom: ${theme.spacing.lg};
  background: ${theme.colors.gray50};
`;

const TestResult = styled.div`
  margin-top: ${theme.spacing.md};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  
  &.success {
    background: ${theme.colors.success}20;
    border: 1px solid ${theme.colors.success};
    color: ${theme.colors.success};
  }
  
  &.error {
    background: ${theme.colors.danger}20;
    border: 1px solid ${theme.colors.danger};
    color: ${theme.colors.danger};
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

const FormulasManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFormula, setEditingFormula] = useState(null);
  const [testResult, setTestResult] = useState(null);

  
  const queryClient = useQueryClient();

  // Form hook
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch,
    control
  } = useForm({
    defaultValues: {
      variaveis: [{ nome: '', tipo: 'number' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'variaveis'
  });

  // Queries
  const { 
    data: formulas, 
    isLoading, 
    error 
  } = useQuery(
    ['formulas', searchTerm],
    () => formulaService.getFormulas({ search: searchTerm }),
    {
      keepPreviousData: true,
    }
  );



  // Mutations
  const createMutation = useMutation(adminService.createFormula, {
    onSuccess: () => {
      queryClient.invalidateQueries('formulas');
      toast.success('Fórmula criada com sucesso!');
      handleCloseModal();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao criar fórmula');
    }
  });

  const updateMutation = useMutation(
    ({ id, data }) => adminService.updateFormula(id, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('formulas');
        toast.success('Fórmula atualizada com sucesso!');
        handleCloseModal();
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Erro ao atualizar fórmula');
      }
    }
  );

  const deleteMutation = useMutation(adminService.deleteFormula, {
    onSuccess: () => {
      queryClient.invalidateQueries('formulas');
      toast.success('Fórmula excluída com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir fórmula');
    }
  });

  const testMutation = useMutation(formulaService.testarFormula, {
    onSuccess: (data) => {
      setTestResult({ success: true, result: data.resultado });
      toast.success('Fórmula testada com sucesso!');
    },
    onError: (error) => {
      setTestResult({ 
        success: false, 
        error: error.response?.data?.message || 'Erro ao testar fórmula' 
      });
    }
  });

  // Handlers
  const handleOpenModal = (formula = null) => {
    setEditingFormula(formula);
    setIsModalOpen(true);
    setTestResult(null);
    
    if (formula) {
      setValue('nome', formula.nome);
      setValue('descricao', formula.descricao);
      setValue('codigo', formula.codigo);
      setValue('variaveis', formula.variaveis || [{ nome: '', tipo: 'number' }]);
    } else {
      reset({
        variaveis: [{ nome: '', tipo: 'number' }]
      });
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingFormula(null);
    setTestResult(null);
    reset();
  };

  const handleSubmitForm = (data) => {
    // Filtrar variáveis vazias
    const variaveis = data.variaveis.filter(v => v.nome.trim());
    const formulaData = { ...data, variaveis };
    
    if (editingFormula) {
      updateMutation.mutate({ id: editingFormula.id, data: formulaData });
    } else {
      createMutation.mutate(formulaData);
    }
  };

  const handleDelete = (formula) => {
    if (window.confirm(`Tem certeza que deseja excluir "${formula.nome}"?`)) {
      deleteMutation.mutate(formula.id);
    }
  };

  const handleTestFormula = () => {
    const formData = watch();
    const variaveis = formData.variaveis.filter(v => v.nome.trim());
    
    if (!formData.codigo || variaveis.length === 0) {
      toast.error('Código e variáveis são obrigatórios para teste');
      return;
    }

    // Criar valores de teste para as variáveis
    const valoresVariaveis = {};
    variaveis.forEach(variavel => {
      if (variavel.tipo === 'number') {
        valoresVariaveis[variavel.nome] = 10; // valor padrão para teste
      } else {
        valoresVariaveis[variavel.nome] = 'teste'; // valor padrão para string
      }
    });

    testMutation.mutate({
      codigo: formData.codigo,
      variaveis: valoresVariaveis
    });
  };

  const filteredFormulas = Array.isArray(formulas?.data) 
    ? formulas.data.filter(formula =>
        formula.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        formula.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : [];

  return (
    <FormulasContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <FormulasHeader>
          <div>
            <Heading size="2xl" color="primary">
              Gerenciamento de Fórmulas
            </Heading>
            <Text color="muted" style={{ marginTop: theme.spacing.xs }}>
              Gerencie fórmulas de cálculo do sistema
            </Text>
          </div>
          
          <Button
            variant="primary"
            onClick={() => handleOpenModal()}
          >
            <FiPlus />
            Nova Fórmula
          </Button>
        </FormulasHeader>

        <SearchContainer>
          <SearchInput
            type="text"
            placeholder="Buscar fórmulas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            icon={<FiSearch />}
          />
        </SearchContainer>

        {isLoading ? (
          <Flex justify="center" align="center" style={{ minHeight: '400px' }}>
            <LoadingSpinner size="lg" />
          </Flex>
        ) : error ? (
          <ErrorMessage>
            Erro ao carregar fórmulas. Tente novamente.
          </ErrorMessage>
        ) : (
          <FormulasGrid>
            {filteredFormulas.map((formula, index) => (
              <motion.div
                key={formula.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <FormulaCard>
                  <FormulaHeader>
                    <FormulaTitle>{formula.nome}</FormulaTitle>
                    <ActionButtons>
                      <ActionButton
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenModal(formula)}
                      >
                        <FiEdit3 />
                      </ActionButton>
                      
                      <ActionButton
                        variant="danger"
                        size="sm"
                        onClick={() => handleDelete(formula)}
                        disabled={deleteMutation.isLoading}
                      >
                        <FiTrash2 />
                      </ActionButton>
                    </ActionButtons>
                  </FormulaHeader>

                  {formula.descricao && (
                    <FormulaDescription>
                      {formula.descricao}
                    </FormulaDescription>
                  )}

                  <FormulaCode>
                    {formula.codigo}
                  </FormulaCode>

                  {formula.variaveis && formula.variaveis.length > 0 && (
                    <VariablesList>
                      <Text size="sm" color="muted" style={{ marginBottom: theme.spacing.xs }}>
                        Variáveis:
                      </Text>
                      {formula.variaveis.map((variavel, idx) => (
                        <VariableTag key={idx}>
                          {variavel.nome} ({variavel.tipo})
                        </VariableTag>
                      ))}
                    </VariablesList>
                  )}
                </FormulaCard>
              </motion.div>
            ))}
            
            {filteredFormulas.length === 0 && (
              <div style={{ 
                gridColumn: '1 / -1', 
                padding: theme.spacing.xl, 
                textAlign: 'center' 
              }}>
                <Text color="muted">Nenhuma fórmula encontrada</Text>
              </div>
            )}
          </FormulasGrid>
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
                  {editingFormula ? 'Editar Fórmula' : 'Nova Fórmula'}
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
                      placeholder="Nome da fórmula"
                    />
                    {errors.nome && (
                      <ErrorMessage>{errors.nome.message}</ErrorMessage>
                    )}
                  </FormGroup>

                  <FormGroup className="full-width">
                    <Label htmlFor="descricao">Descrição</Label>
                    <TextArea
                      id="descricao"
                      {...register('descricao')}
                      placeholder="Descrição da fórmula"
                    />
                  </FormGroup>

                  <FormGroup className="full-width">
                    <Label htmlFor="codigo">Código JavaScript *</Label>
                    <CodeTextArea
                      id="codigo"
                      {...register('codigo', { 
                        required: 'Código é obrigatório' 
                      })}
                      placeholder="// Exemplo: return largura * altura * preco;"
                    />
                    {errors.codigo && (
                      <ErrorMessage>{errors.codigo.message}</ErrorMessage>
                    )}
                  </FormGroup>
                </FormGrid>

                <VariablesSection>
                  <Flex justify="space-between" align="center" style={{ marginBottom: theme.spacing.md }}>
                    <Heading size="md">Variáveis</Heading>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => append({ nome: '', tipo: 'number' })}
                    >
                      <FiPlus />
                      Adicionar Variável
                    </Button>
                  </Flex>

                  {fields.map((field, index) => (
                    <VariableItem key={field.id}>
                      <FormGroup>
                        <Label>Nome da Variável</Label>
                        <Input
                          {...register(`variaveis.${index}.nome`)}
                          placeholder="Ex: largura, altura"
                        />
                      </FormGroup>

                      <FormGroup>
                        <Label>Tipo</Label>
                        <select
                          {...register(`variaveis.${index}.tipo`)}
                          style={{
                            padding: `${theme.spacing.sm} ${theme.spacing.md}`,
                            border: `1px solid ${theme.colors.border}`,
                            borderRadius: theme.borderRadius.md,
                            background: theme.colors.surface,
                            color: theme.colors.textPrimary,
                            fontSize: theme.fontSize.base,
                          }}
                        >
                          <option value="number">Número</option>
                          <option value="string">Texto</option>
                        </select>
                      </FormGroup>

                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() => remove(index)}
                        disabled={fields.length === 1}
                      >
                        <FiTrash2 />
                      </Button>
                    </VariableItem>
                  ))}
                </VariablesSection>

                <TestSection>
                  <Flex justify="space-between" align="center" style={{ marginBottom: theme.spacing.md }}>
                    <Heading size="md">Testar Fórmula</Heading>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestFormula}
                      disabled={testMutation.isLoading}
                    >
                      {testMutation.isLoading ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <FiPlay />
                          Testar
                        </>
                      )}
                    </Button>
                  </Flex>

                  <Text size="sm" color="muted">
                    Teste a fórmula com valores padrão para verificar se está funcionando corretamente.
                  </Text>

                  {testResult && (
                    <TestResult className={testResult.success ? 'success' : 'error'}>
                      <Flex align="center" gap="sm">
                        {testResult.success ? <FiCheckCircle /> : <FiAlertCircle />}
                        {testResult.success ? (
                          <span>Resultado: {testResult.result}</span>
                        ) : (
                          <span>Erro: {testResult.error}</span>
                        )}
                      </Flex>
                    </TestResult>
                  )}
                </TestSection>

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
                        {editingFormula ? 'Atualizar' : 'Criar'}
                      </>
                    )}
                  </Button>
                </ModalActions>
              </form>
            </ModalContent>
          </ModalOverlay>
        )}
      </AnimatePresence>
    </FormulasContainer>
  );
};

export default FormulasManagement;
