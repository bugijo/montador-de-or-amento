/**
 * Módulo responsável pela geração de PDF usando template
 */
class PDFGenerator {
    constructor() {
        this.templateBase64 = null;
        this.loadTemplate();
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
            
            // Posiciona o nome do cliente (baseado no layout do template)
            if (dadosOrcamento.nomeCliente) {
                doc.text(dadosOrcamento.nomeCliente, 25, 85);
            }
            
            // Posiciona a data
            const dataAtual = new Date().toLocaleDateString('pt-BR');
            doc.text(dataAtual, 160, 85);
            
            // Prepara os dados da tabela
            const linhas = dadosOrcamento.itens.map(item => [
                item.quantidade.toString(),
                item.descricao,
                `R$ ${item.valor.toFixed(2)}`,
                `R$ ${(item.quantidade * item.valor).toFixed(2)}`
            ]);
            
            // Calcula o total geral
            const valorTotal = dadosOrcamento.itens.reduce((total, item) => 
                total + (item.quantidade * item.valor), 0);
            
            // Configura autoTable com posicionamento preciso baseado no template
            doc.autoTable({
                body: linhas,
                startY: 110, // Posição Y onde a tabela deve começar
                margin: { left: 25, right: 25 },
                styles: {
                    fontSize: 10,
                    cellPadding: 2,
                    textColor: [0, 0, 0],
                    fillColor: false, // Sem preenchimento para manter transparência
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1,
                    halign: 'left'
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 25 }, // QUANTIDADE
                    1: { halign: 'left', cellWidth: 95 },   // DESCRIÇÃO
                    2: { halign: 'right', cellWidth: 30 },  // VALOR
                    3: { halign: 'right', cellWidth: 30 }   // TOTAL
                },
                didDrawPage: function(data) {
                    // Remove bordas da tabela para integrar melhor com o template
                }
            });
            
            // Adiciona o total geral em posição específica
            const finalY = doc.lastAutoTable.finalY + 10;
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('TOTAL GERAL:', 130, finalY);
            doc.text(`R$ ${valorTotal.toFixed(2)}`, 170, finalY);
            
            // Salva o PDF
            const nomeArquivo = `orcamento_${dadosOrcamento.nomeCliente || 'cliente'}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(nomeArquivo);
            
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            alert('Erro ao gerar PDF. Verifique o console para mais detalhes.');
        }
    }

}