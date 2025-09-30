/**
 * Módulo responsável pela geração de PDF usando template
 */
class PDFGenerator {
    constructor() {
        // Construtor simplificado - template será carregado quando necessário
    }

    /**
     * Carrega o template Base64 do arquivo
     */
    async carregarTemplateBase64() {
        try {
            const response = await fetch('./template_base64.txt');
            const templateBase64 = await response.text();
            return 'data:image/png;base64,' + templateBase64.trim();
        } catch (error) {
            console.error('Erro ao carregar template Base64:', error);
            throw error;
        }
    }

    /**
     * Gera PDF usando o template PNG como fundo
     * @param {Object} dadosOrcamento - Dados do orçamento
     */
    async gerarPDF(dadosOrcamento) {
        try {
            // Carrega o template Base64
            const templateBase64 = await this.carregarTemplateBase64();
            
            // Cria o documento PDF
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            
            // Adiciona o template PNG como fundo
            doc.addImage(templateBase64, 'PNG', 0, 0, 210, 297);
            
            // Configurações de fonte
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            
            // Dados do Cabeçalho - Posicionamento exato conforme especificação
            const cliente = dadosOrcamento.nomeCliente || '';
            const data = new Date().toLocaleDateString('pt-BR');
            
            doc.text(cliente, 25, 62); // Nome do Cliente
            doc.text(data, 175, 62);    // Data
            
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
            
            // Configura autoTable com posicionamento e dimensões precisas
            doc.autoTable({
                startY: 83,
                body: corpoTabela,
                theme: 'plain',
                drawHeader: false,
                margin: { left: 19 },
                columnStyles: {
                    0: { cellWidth: 25 }, // Coluna Quantidade
                    1: { cellWidth: 85 }, // Coluna Descrição
                    2: { cellWidth: 30 }, // Coluna Valor
                    3: { cellWidth: 30 }  // Coluna Total
                }
            });
            
            // Posiciona o Total Geral alinhado à direita, abaixo da tabela
            const finalY = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text(`TOTAL GERAL: ${formatarMoeda(valorTotal)}`, 140, finalY, { align: 'right' });
            
            // Salva o PDF
            const nomeArquivo = `orcamento_${dadosOrcamento.nomeCliente || 'cliente'}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(nomeArquivo);
            
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar PDF. Verifique o console para mais detalhes.');
        }
    }

}