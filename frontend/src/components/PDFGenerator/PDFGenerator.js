import React, { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  FiDownload, 
  FiShare2, 
  FiArrowLeft, 
  FiFileText, 
  FiPackage
} from 'react-icons/fi';
import styled from 'styled-components';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

import { 
  Container, 
  Card, 
  Button, 
  Flex, 
  Text, 
  Heading,
  Grid
} from '../../styles/GlobalStyles';
import { theme } from '../../styles/GlobalStyles';

const PDFContainer = styled(Container)`
  padding-top: ${theme.spacing.xl};
  padding-bottom: ${theme.spacing.xl};
  max-width: 800px;
`;

const PreviewCard = styled(Card)`
  margin-bottom: ${theme.spacing.xl};
  background: white;
  box-shadow: ${theme.colors.shadows.xl};
`;

const PDFContent = styled.div`
  padding: ${theme.spacing.xl};
  background: white;
  min-height: 800px;
  
  @media print {
    padding: 0;
    box-shadow: none;
  }
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: ${theme.spacing.xl};
  padding-bottom: ${theme.spacing.lg};
  border-bottom: 2px solid ${theme.colors.primary};
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: ${theme.spacing.md};
`;

const LogoIcon = styled.div`
  width: 60px;
  height: 60px;
  background: ${theme.colors.primary};
  border-radius: ${theme.borderRadius.lg};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const CompanyInfo = styled.div`
  text-align: right;
`;

const QuotationInfo = styled.div`
  background: ${theme.colors.gray50};
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.md};
  margin-bottom: ${theme.spacing.xl};
`;

const MachineSection = styled.div`
  margin-bottom: ${theme.spacing.xl};
`;

const MachineCard = styled.div`
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.borderRadius.md};
  padding: ${theme.spacing.lg};
  background: ${theme.colors.gray50};
`;

const AccessoriesSection = styled.div`
  margin-bottom: ${theme.spacing.xl};
`;

const AccessoryItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: ${theme.spacing.md} 0;
  border-bottom: 1px solid ${theme.colors.borderLight};
  
  &:last-child {
    border-bottom: none;
  }
`;

const TotalSection = styled.div`
  background: ${theme.colors.primary};
  color: white;
  padding: ${theme.spacing.lg};
  border-radius: ${theme.borderRadius.md};
  margin-top: ${theme.spacing.xl};
`;

const Footer = styled.div`
  margin-top: ${theme.spacing.xl};
  padding-top: ${theme.spacing.lg};
  border-top: 1px solid ${theme.colors.border};
  text-align: center;
  color: ${theme.colors.textMuted};
`;

const ActionButtons = styled(Flex)`
  margin-bottom: ${theme.spacing.xl};
  gap: ${theme.spacing.md};
  
  @media (max-width: ${theme.breakpoints.sm}) {
    flex-direction: column;
  }
`;

const BackButton = styled(Button)`
  background: transparent;
  color: ${theme.colors.textSecondary};
  border: 1px solid ${theme.colors.border};
  
  &:hover {
    background: ${theme.colors.gray100};
    color: ${theme.colors.textPrimary};
  }
`;

const PDFGenerator = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pdfRef = useRef();
  const [isGenerating, setIsGenerating] = useState(false);

  const quotationData = location.state?.quotationData;

  if (!quotationData) {
    return (
      <PDFContainer>
        <Card>
          <Flex direction="column" align="center" gap="1rem">
            <FiFileText size={48} color={theme.colors.warning} />
            <Heading $level={3}>Dados do orçamento não encontrados</Heading>
            <Text color="muted">Volte ao calculador para gerar um novo orçamento.</Text>
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              Voltar ao Catálogo
            </Button>
          </Flex>
        </Card>
      </PDFContainer>
    );
  }

  const { machine, user, results: rawResults, totalPrice, date } = quotationData;
  const results = Array.isArray(rawResults) ? rawResults : [];

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const generatePDF = async () => {
    setIsGenerating(true);
    
    try {
      const element = pdfRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210;
      const pageHeight = 295;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      const fileName = `Orcamento_${machine.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar PDF. Tente novamente.');
    } finally {
      setIsGenerating(false);
    }
  };

  const shareWhatsApp = () => {
    const message = `🔧 *ORÇAMENTO - ${machine.nome.toUpperCase()}*\n\n` +
      `📅 *Data:* ${formatDate(date)}\n` +
      `👤 *Vendedor(a):* ${user.nome}\n` +
      `📧 *Email:* ${user.email}\n\n` +
      `📊 *RESUMO DOS ACESSÓRIOS:*\n` +
      results.map(result => 
        `• *${result.accessory.nome}*\n` +
        `  Quantidade: ${result.calculation.resultado} ${result.calculation.unidade}\n` +
        `  Preço unit.: ${formatPrice(result.unitPrice)}\n` +
        `  Total: ${formatPrice(result.totalPrice)}\n`
      ).join('\n') +
      `\n💰 *VALOR TOTAL: ${formatPrice(totalPrice)}*\n\n` +
      `🏢 *FINITI - Sistema de Orçamentos*\n` +
      `📱 Entre em contato para mais informações!`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <PDFContainer>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <ActionButtons>
          <BackButton onClick={() => navigate(-1)}>
            <FiArrowLeft size={16} />
            Voltar
          </BackButton>
          
          <Button
            variant="primary"
            onClick={generatePDF}
            disabled={isGenerating}
            style={{ flex: 1 }}
          >
            {isGenerating ? (
              'Gerando PDF...'
            ) : (
              <>
                <FiDownload size={16} />
                Baixar PDF
              </>
            )}
          </Button>
          
          <Button
            variant="secondary"
            onClick={shareWhatsApp}
            style={{ flex: 1 }}
          >
            <FiShare2 size={16} />
            Compartilhar WhatsApp
          </Button>
        </ActionButtons>

        <PreviewCard>
          <PDFContent ref={pdfRef}>
            <Header>
              <Logo>
                <LogoIcon>
                  <FiPackage size={28} />
                </LogoIcon>
                <div>
                  <Heading $level={2} style={{ color: theme.colors.primary, marginBottom: '4px' }}>
                    FINITI
                  </Heading>
                  <Text size="sm" color="muted">
                    Sistema de Orçamentos
                  </Text>
                </div>
              </Logo>
              
              <CompanyInfo>
                <Text size="sm" weight="semibold">
                  FINITI EQUIPAMENTOS LTDA
                </Text>
                <Text size="sm" color="muted">
                  contato@finiti.com.br
                </Text>
                <Text size="sm" color="muted">
                  (11) 9999-9999
                </Text>
              </CompanyInfo>
            </Header>

            <QuotationInfo>
              <Grid $cols={2} gap="2rem">
                <div>
                  <Text size="sm" color="muted" weight="semibold">ORÇAMENTO Nº</Text>
                  <Text weight="semibold">
                    {String(Date.now()).slice(-6)}
                  </Text>
                </div>
                <div>
                  <Text size="sm" color="muted" weight="semibold">DATA</Text>
                  <Text weight="semibold">
                    {formatDate(date)}
                  </Text>
                </div>
                <div>
                  <Text size="sm" color="muted" weight="semibold">VENDEDOR(A)</Text>
                  <Text weight="semibold">{user.nome}</Text>
                  <Text size="sm" color="muted">{user.email}</Text>
                </div>
                <div>
                  <Text size="sm" color="muted" weight="semibold">VALIDADE</Text>
                  <Text weight="semibold">30 dias</Text>
                </div>
              </Grid>
            </QuotationInfo>

            <MachineSection>
              <Heading $level={3} style={{ marginBottom: theme.spacing.md }}>
                MÁQUINA SELECIONADA
              </Heading>
              <MachineCard>
                <Heading $level={4} style={{ marginBottom: theme.spacing.sm }}>
                  {machine.nome}
                </Heading>
                <Text color="muted" style={{ marginBottom: theme.spacing.sm }}>
                  {machine.descricao}
                </Text>
                <Grid $cols={2} gap="1rem">
                  <div>
                    <Text size="sm" color="muted">Categoria:</Text>
                    <Text size="sm" weight="semibold">{machine.categoria}</Text>
                  </div>
                  <div>
                    <Text size="sm" color="muted">Código:</Text>
                    <Text size="sm" weight="semibold">{machine.codigo_interno}</Text>
                  </div>
                  {machine.preco_base && (
                    <div>
                      <Text size="sm" color="muted">Preço base:</Text>
                      <Text size="sm" weight="semibold">{formatPrice(machine.preco_base)}</Text>
                    </div>
                  )}
                </Grid>
              </MachineCard>
            </MachineSection>

            <AccessoriesSection>
              <Heading $level={3} style={{ marginBottom: theme.spacing.md }}>
                ACESSÓRIOS NECESSÁRIOS
              </Heading>
              
              {results.map((result, index) => (
                <AccessoryItem key={index}>
                  <div style={{ flex: 1 }}>
                    <Text weight="semibold" style={{ marginBottom: '4px' }}>
                      {result.accessory.nome}
                    </Text>
                    <Text size="sm" color="muted">
                      {result.accessory.descricao}
                    </Text>
                    <Text size="sm" color="muted" style={{ marginTop: '4px' }}>
                      Fórmula: {result.formula.formula}
                    </Text>
                  </div>
                  <div style={{ textAlign: 'right', minWidth: '120px' }}>
                    <Text weight="semibold">
                      {result.calculation.resultado} {result.calculation.unidade}
                    </Text>
                    <Text size="sm" color="muted">
                      {formatPrice(result.unitPrice)} / unid.
                    </Text>
                    <Text weight="semibold" color="primary">
                      {formatPrice(result.totalPrice)}
                    </Text>
                  </div>
                </AccessoryItem>
              ))}
            </AccessoriesSection>

            <TotalSection>
              <Flex justify="space-between" align="center">
                <div>
                  <Heading $level={3} style={{ marginBottom: '4px' }}>
                    VALOR TOTAL
                  </Heading>
                  <Text style={{ opacity: 0.9 }}>
                    {results.length} acessório(s) • Válido por 30 dias
                  </Text>
                </div>
                <Heading $level={2}>
                  {formatPrice(totalPrice)}
                </Heading>
              </Flex>
            </TotalSection>

            <Footer>
              <Text size="sm">
                Este orçamento foi gerado automaticamente pelo Sistema de Orçamentos FINITI.
              </Text>
              <Text size="sm" style={{ marginTop: '8px' }}>
                Para dúvidas ou esclarecimentos, entre em contato conosco.
              </Text>
              <Text size="sm" weight="semibold" style={{ marginTop: '16px' }}>
                FINITI EQUIPAMENTOS LTDA • contato@finiti.com.br • (11) 9999-9999
              </Text>
            </Footer>
          </PDFContent>
        </PreviewCard>
      </motion.div>
    </PDFContainer>
  );
};

export default PDFGenerator;
