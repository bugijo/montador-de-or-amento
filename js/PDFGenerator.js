/**
 * Módulo responsável pela geração de PDF usando template
 */

// Template Base64 embutido para evitar problemas de CORS
const TEMPLATE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAABYYAAAfQCAYAAAB2Xou3AAAAAXNSR0IArs4c6QAAAEJJREFUeF7t1AEJAAAMAsHZv/RyPNwSyDsoiCg5Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozv37wA1mQABAAEAgQAAAQIBAAIEAgACBAIAAgQCAAIBAAECgQABAAQAAAQIEAgACBAIAAgQCAAIBAAECgQABAAQAAQIBAAIEAgACBAIAAgQCAAIBAAECgQABAAQIEAgACBAIAAgQCAAIBAAECgQABAAQAAQIEAgACBAIAAgQCAAIBAAECgQABAAQAAQIBAAIEAgACBAIAAgQCAAIBAAECgQABAAQAAQIBAAIEAgACBAIAAgQCAAIBAAECgQABAAQIEAgACBAIAAgQCAAIBAAECgQABAAQAAQIEAgACBAIAAgQCAAIBAAECgQABAAQAAQIBAAIEAgACBAIAAgQCAAIBAAECgQABAAQIEAgACBAIAAgQCAAIBAAECgQABAAQAAQIEAgACBAIAAgQCAAIBAAECgQABAAQAAQIBAAIEAgACBAIAAgQCAAIBAAECgQABAAQIEAgACBAIAAgQCAAIBAAECgQABAAQAAQIEAgACBAIAAgQCAAIBAAECgQABAAQAAQIBAAIEAgACBAIAAgQCAAIBAAECgQABAAQIEAgACBAIAAgQCAAIBAAECgQABAAQAAQIEAgACBAIAAgQCAAIBAAECgQABAAQAAQIBAAIEAgACBAIAAgQCAAIBAAECgQABAAQIEAgACBAIAAgQCAAIBAAECgQABAAQAAQIEAgACBAIAAgQCAAIBAAECgQABAAQAAQIBAAIEAgACBAIAAgQCAAIBAAECgQABAAQIEAgACBAIAAgQCAAIBAAECgQABAAQAAQIEAgACBAIAAgQ...';

class PDFGenerator {
    constructor() {
        // Construtor simplificado - template será carregado quando necessário
    }



    /**
     * Gera PDF usando o template PNG como fundo com alinhamento de precisão
     * @param {Object} dadosOrcamento - Dados do orçamento
     */
    async gerarPDF(dadosOrcamento) {
        try {
            // Usa o template Base64 embutido
            const templateBase64 = TEMPLATE_BASE64;
            
            // Cria o documento PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            
            // Adiciona o template PNG como fundo
            doc.addImage(templateBase64, 'PNG', 0, 0, 210, 297);
            
            // === POSICIONAMENTO DE PRECISÃO DOS DADOS ===
            
            // Configurações de fonte para o cabeçalho
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(0, 0, 0);
            
            // Dados do Cabeçalho - Coordenadas exatas de precisão
            const cliente = dadosOrcamento.nomeCliente || '';
            const data = new Date().toLocaleDateString('pt-BR');
            const medidaBase = dadosOrcamento.medidaBase || 0;
            
            // Posicionamento exato conforme coordenadas especificadas
            doc.text(cliente, 25, 78);                                    // Nome do Cliente
            doc.text(data, 145, 78);                                      // Data
            doc.text(medidaBase.toString() + ' m²', 175, 78);            // Medida Base
            
            // Função auxiliar para formatar moeda
            const formatarMoeda = (valor) => `R$ ${valor.toFixed(2)}`;
            
            // Prepara os dados da tabela na ordem correta: Quantidade, Descrição, Valor, Total
            const corpoTabela = dadosOrcamento.itens.map(item => [
                item.quantidade,
                item.descricao,
                formatarMoeda(item.valor),
                formatarMoeda(item.quantidade * item.valor)
            ]);
            
            // Calcula o total geral
            const valorTotal = dadosOrcamento.itens.reduce((total, item) => 
                total + (item.quantidade * item.valor), 0);
            
            // Configura autoTable com coordenadas e dimensões de precisão
            doc.autoTable({
                startY: 93,                    // Coordenada Y exata
                body: corpoTabela,
                theme: 'plain',
                drawHeader: false,
                margin: { left: 20 },          // Margem esquerda exata
                columnStyles: {
                    0: { cellWidth: 25 },      // QUANTIDADE
                    1: { cellWidth: 90 },      // DESCRIÇÃO
                    2: { cellWidth: 30 },      // VALOR
                    3: { cellWidth: 30 }       // TOTAL
                }
            });
            
            // Posiciona o Total Geral alinhado à direita após a tabela
            const finalY = doc.autoTable.previous.finalY + 10;
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text(`TOTAL GERAL: ${formatarMoeda(valorTotal)}`, 195, finalY, { align: 'right' });
            
            // Salva o PDF com nome do orçamento
            const nomeArquivo = `orcamento_${dadosOrcamento.nomeCliente || 'cliente'}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(nomeArquivo);
            
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar PDF. Verifique o console para mais detalhes.');
        }
    }

}