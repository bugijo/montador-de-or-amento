import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from 'react-query';
import { useForm } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FiArrowLeft, 
  FiTool, 
  FiPackage, 
  FiDollarSign, 
  FiFileText,
  FiShare2,
  FiAlertCircle
} from 'react-icons/fi';
import styled from 'styled-components';

import { produtoService, formulaService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
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
  Heading,
  Grid
} from '../../styles/GlobalStyles';
import { theme } from '../../styles/GlobalStyles';

const CalculatorContainer = styled(Container)`
  padding-top: ${theme.spacing.xl};
  padding-bottom: ${theme.spacing.xl};
  max-width: 800px;
`;

const MachineHeader = styled(Card)`
  margin-bottom: ${theme.spacing.xl};
  background: linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.primaryDark} 100%);
  color: white;
  border: none;
`;

const MachineImage = styled.div`
  width: 80px;
  height: 80px;
  background: ${props => props.src ? `url(${props.src})` : 'rgba(255,255,255,0.2)'};
  background-size: cover;
  background-position: center;
  border-radius: ${theme.borderRadius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: ${theme.spacing.lg};
  flex-shrink: 0;
  
  @media (max-width: ${theme.breakpoints.sm}) {
    width: 60px;
    height: 60px;
    margin-right: ${theme.spacing.md};
  }
`;

const BackButton = styled(Button)`
  margin-bottom: ${theme.spacing.lg};
  background: transparent;
  color: ${theme.colors.textSecondary};
  border: 1px solid ${theme.colors.border};
  
  &:hover {
    background: ${theme.colors.gray100};
    color: ${theme.colors.textPrimary};
  }
`;

const CalculationForm = styled(Card)`
  margin-bottom: ${theme.spacing.xl};
`;

const InputGroup = styled.div`
  margin-bottom: ${theme.spacing.lg};
`;

const VariableInput = styled.div`
  display: grid;
  grid-template-columns: 1fr auto;
  gap: ${theme.spacing.md};
  align-items: end;
  
  @media (max-width: ${theme.breakpoints.sm}) {
    grid-template-columns: 1fr;
  }
`;

const UnitLabel = styled.span`
  background: ${theme.colors.gray100};
  padding: ${theme.spacing.sm} ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textSecondary};
  white-space: nowrap;
  min-height: 44px;
  display: flex;
  align-items: center;
  
  @media (max-width: ${theme.breakpoints.sm}) {
    justify-content: center;
  }
`;

const ResultsSection = styled.div`
  margin-top: ${theme.spacing.xl};
`;

const AccessoryCard = styled(Card)`
  margin-bottom: ${theme.spacing.md};
  border-left: 4px solid ${theme.colors.primary};
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateX(4px);
    box-shadow: ${theme.colors.shadows.md};
  }
`;

const AccessoryHeader = styled(Flex)`
  margin-bottom: ${theme.spacing.md};
`;

const AccessoryImage = styled.div`
  width: 60px;
  height: 60px;
  background: ${props => props.src ? `url(${props.src})` : theme.colors.gray200};
  background-size: cover;
  background-position: center;
  border-radius: ${theme.borderRadius.md};
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: ${theme.spacing.md};
  flex-shrink: 0;
`;

const AccessoryInfo = styled.div`
  flex: 1;
`;

const QuantityBadge = styled.div`
  background: ${theme.colors.primary};
  color: white;
  padding: ${theme.spacing.xs} ${theme.spacing.sm};
  border-radius: ${theme.borderRadius.full};
  font-size: ${theme.fontSize.sm};
  font-weight: ${theme.fontWeight.semibold};
  min-width: 60px;
  text-align: center;
`;

const PriceInfo = styled.div`
  background: ${theme.colors.gray50};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  margin-top: ${theme.spacing.md};
`;

const TotalSection = styled(Card)`
  background: ${theme.colors.success};
  color: white;
  border: none;
  margin-top: ${theme.spacing.xl};
`;

const ActionButtons = styled(Flex)`
  margin-top: ${theme.spacing.xl};
  gap: ${theme.spacing.md};
  
  @media (max-width: ${theme.breakpoints.sm}) {
    flex-direction: column;
  }
`;

const FormulaInfo = styled.div`
  background: ${theme.colors.gray50};
  padding: ${theme.spacing.md};
  border-radius: ${theme.borderRadius.md};
  margin-top: ${theme.spacing.md};
  font-family: 'Courier New', monospace;
  font-size: ${theme.fontSize.sm};
  color: ${theme.colors.textSecondary};
`;

const Calculator = () => {
  const { machineId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [calculationResults, setCalculationResults] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);
  const [isCalculating, setIsCalculating] = useState(false);

  const machine = location.state?.machine;

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm();

  // Buscar acessórios compatíveis
  const {
    data: accessoriesData
  } = useQuery(
    ['accessories', machineId],
    () => produtoService.getAcessorios(machineId),
    {
      enabled: !!machineId
    }
  );

  // Buscar fórmulas para cada acessório
  const {
    data: formulasData,
    isLoading: loadingFormulas
  } = useQuery(
    ['formulas', machineId],
    () => formulaService.getFormulas({ maquina_id: machineId }),
    {
      enabled: !!machineId
    }
  );

  const accessories = accessoriesData?.data?.acessorios || [];
  const formulas = formulasData?.data?.formulas || [];

  // Mutation para calcular fórmulas
  const calculateMutation = useMutation(
    ({ formulaId, variables }) => formulaService.calcularFormula(formulaId, variables),
    {
      onSuccess: (data, variables) => {
        const { formulaId } = variables;
        const formula = formulas.find(f => f.id === formulaId);
        const accessory = accessories.find(a => a.id === formula?.produto_id);
        
        if (accessory && formula) {
          const result = {
            accessory,
            formula,
            calculation: data.data,
            unitPrice: parseFloat(accessory.preco_base || 0),
            totalPrice: parseFloat(accessory.preco_base || 0) * data.data.resultado
          };
          
          setCalculationResults(prev => {
            const filtered = prev.filter(r => r.accessory.id !== accessory.id);
            return [...filtered, result];
          });
        }
      }
    }
  );

  // Calcular preço total
  useEffect(() => {
    const total = calculationResults.reduce((sum, result) => sum + result.totalPrice, 0);
    setTotalPrice(total);
  }, [calculationResults]);

  // Obter todas as variáveis necessárias das fórmulas
  const getAllVariables = () => {
    const variables = new Set();
    formulas.forEach(formula => {
      if (formula.variaveis_entrada) {
        formula.variaveis_entrada.forEach(variable => {
          variables.add(variable.nome);
        });
      }
    });
    return Array.from(variables);
  };

  const onSubmit = async (data) => {
    setIsCalculating(true);
    setCalculationResults([]);

    try {
      // Calcular para cada fórmula
      for (const formula of formulas) {
        if (formula.ativo) {
          await calculateMutation.mutateAsync({
            formulaId: formula.id,
            variables: data
          });
        }
      }
    } catch (error) {
      console.error('Erro no cálculo:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleGeneratePDF = () => {
    const quotationData = {
      machine,
      user,
      results: calculationResults,
      totalPrice,
      date: new Date()
    };
    
    navigate('/pdf-generator', {
      state: { quotationData }
    });
  };

  const handleShareWhatsApp = () => {
    const message = `🔧 *Orçamento - ${machine?.nome}*\n\n` +
      `📊 *Resumo:*\n` +
      calculationResults.map(result => 
        `• ${result.accessory.nome}: ${result.calculation.resultado} ${result.calculation.unidade}\n` +
        `  💰 ${formatPrice(result.totalPrice)}`
      ).join('\n') +
      `\n\n💰 *Total: ${formatPrice(totalPrice)}*\n\n` +
      `👤 Vendedor(a): ${user?.nome}\n` +
      `📧 ${user?.email}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const variables = getAllVariables();

  if (!machine) {
    return (
      <CalculatorContainer>
        <Card>
          <Flex direction="column" align="center" gap="1rem">
            <FiAlertCircle size={48} color={theme.colors.warning} />
            <Heading $level={3}>Máquina não encontrada</Heading>
            <Text color="muted">Selecione uma máquina no catálogo para continuar.</Text>
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              Voltar ao Catálogo
            </Button>
          </Flex>
        </Card>
      </CalculatorContainer>
    );
  }

  return (
    <CalculatorContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <BackButton
          variant="outline"
          onClick={() => navigate('/dashboard')}
        >
          <FiArrowLeft size={16} />
          Voltar ao Catálogo
        </BackButton>

        <MachineHeader>
          <Flex align="center">
            <MachineImage src={machine.foto_url}>
              {!machine.foto_url && <FiPackage size={32} />}
            </MachineImage>
            <div>
              <Heading $level={2} style={{ marginBottom: theme.spacing.xs }}>
                {machine.nome}
              </Heading>
              <Text style={{ opacity: 0.9 }}>
                {machine.categoria} • {machine.codigo_interno}
              </Text>
              {machine.preco_base && (
                <Text style={{ opacity: 0.9, marginTop: theme.spacing.xs }}>
                  Preço base: {formatPrice(machine.preco_base)}
                </Text>
              )}
            </div>
          </Flex>
        </MachineHeader>

        <CalculationForm>
          <Heading $level={3} style={{ marginBottom: theme.spacing.lg }}>
            <FiTool size={24} style={{ marginRight: theme.spacing.sm }} />
            Dados para Cálculo
          </Heading>

          <form onSubmit={handleSubmit(onSubmit)}>
            {variables.map(variable => {
              const formulaWithVariable = formulas.find(f => 
                f.variaveis_entrada?.some(v => v.nome === variable)
              );
              const variableInfo = formulaWithVariable?.variaveis_entrada?.find(v => v.nome === variable);

              return (
                <InputGroup key={variable}>
                  <Label htmlFor={variable}>
                    {variableInfo?.descricao || variable}
                    {variableInfo?.obrigatorio && ' *'}
                  </Label>
                  <VariableInput>
                    <Input
                      id={variable}
                      type="number"
                      step="0.01"
                      min={variableInfo?.minimo || 0}
                      max={variableInfo?.maximo}
                      placeholder={`Digite ${variableInfo?.descricao?.toLowerCase() || variable}`}
                      error={errors[variable]}
                      {...register(variable, {
                        required: variableInfo?.obrigatorio ? `${variableInfo.descricao} é obrigatório` : false,
                        min: {
                          value: variableInfo?.minimo || 0,
                          message: `Valor mínimo: ${variableInfo?.minimo || 0}`
                        },
                        max: variableInfo?.maximo ? {
                          value: variableInfo.maximo,
                          message: `Valor máximo: ${variableInfo.maximo}`
                        } : undefined
                      })}
                    />
                    <UnitLabel>
                      {variableInfo?.unidade || 'unidade'}
                    </UnitLabel>
                  </VariableInput>
                  {errors[variable] && (
                    <ErrorMessage>{errors[variable].message}</ErrorMessage>
                  )}
                  {variableInfo?.descricao && (
                    <Text size="sm" color="muted" style={{ marginTop: theme.spacing.xs }}>
                      {variableInfo.descricao}
                    </Text>
                  )}
                </InputGroup>
              );
            })}

            <Button
              type="submit"
              variant="primary"
              fullWidth
              size="lg"
              disabled={isCalculating || loadingFormulas}
            >
              {isCalculating ? (
                <Flex gap="0.5rem">
                  <LoadingSpinner size="20px" accent="white" />
                  Calculando...
                </Flex>
              ) : (
                <Flex gap="0.5rem">
                  <FiTool size={20} />
                  Calcular Orçamento
                </Flex>
              )}
            </Button>
          </form>
        </CalculationForm>

        <AnimatePresence>
          {calculationResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <ResultsSection>
                <Heading $level={3} style={{ marginBottom: theme.spacing.lg }}>
                  <FiPackage size={24} style={{ marginRight: theme.spacing.sm }} />
                  Acessórios Necessários
                </Heading>

                {calculationResults.map((result, index) => (
                  <motion.div
                    key={result.accessory.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <AccessoryCard>
                      <AccessoryHeader>
                        <AccessoryImage src={result.accessory.foto_url}>
                          {!result.accessory.foto_url && <FiPackage size={24} />}
                        </AccessoryImage>
                        <AccessoryInfo>
                          <Heading $level={4} style={{ marginBottom: theme.spacing.xs }}>
                            {result.accessory.nome}
                          </Heading>
                          <Text color="muted" size="sm">
                            {result.accessory.descricao}
                          </Text>
                        </AccessoryInfo>
                        <QuantityBadge>
                          {result.calculation.resultado} {result.calculation.unidade}
                        </QuantityBadge>
                      </AccessoryHeader>

                      <PriceInfo>
                        <Grid $cols={2} gap="1rem">
                          <div>
                            <Text size="sm" color="muted">Preço unitário</Text>
                            <Text weight="semibold">{formatPrice(result.unitPrice)}</Text>
                          </div>
                          <div>
                            <Text size="sm" color="muted">Total</Text>
                            <Text weight="semibold" color="primary">
                              {formatPrice(result.totalPrice)}
                            </Text>
                          </div>
                        </Grid>
                      </PriceInfo>

                      <FormulaInfo>
                        <Text size="sm" color="muted">
                          <strong>Fórmula:</strong> {result.formula.formula}
                        </Text>
                        <Text size="sm" color="muted">
                          <strong>Cálculo:</strong> {result.calculation.formula_usada} = {result.calculation.resultado}
                        </Text>
                      </FormulaInfo>
                    </AccessoryCard>
                  </motion.div>
                ))}

                <TotalSection>
                  <Flex justify="space-between" align="center">
                    <div>
                      <Heading $level={3} style={{ marginBottom: theme.spacing.xs }}>
                        Total do Orçamento
                      </Heading>
                      <Text style={{ opacity: 0.9 }}>
                        {calculationResults.length} acessório(s) calculado(s)
                      </Text>
                    </div>
                    <Heading $level={2}>
                      <FiDollarSign size={28} style={{ marginRight: theme.spacing.sm }} />
                      {formatPrice(totalPrice)}
                    </Heading>
                  </Flex>
                </TotalSection>

                <ActionButtons>
                  <Button
                    variant="primary"
                    size="lg"
                    onClick={handleGeneratePDF}
                    style={{ flex: 1 }}
                  >
                    <FiFileText size={20} />
                    Gerar PDF
                  </Button>
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={handleShareWhatsApp}
                    style={{ flex: 1 }}
                  >
                    <FiShare2 size={20} />
                    Compartilhar WhatsApp
                  </Button>
                </ActionButtons>
              </ResultsSection>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </CalculatorContainer>
  );
};

export default Calculator;
