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
    async loadTemplate() {
        try {
            const response = await fetch('./template_base64.txt');
            this.templateBase64 = await response.text();
            this.templateBase64 = this.templateBase64.trim();
        } catch (error) {
            console.error('Erro ao carregar template:', error);
        }
    }

    /**
     * Gera PDF usando o template PNG como fundo
     * @param {Object} dados - Dados do orçamento
     * @param {Array} itens - Lista de itens do orçamento
     * @param {number} total - Total do orçamento
     */
    async gerarPDF(dados, itens, total) {
        try {
            // Garante que o template foi carregado
            if (!this.templateBase64) {
                await this.loadTemplate();
            }

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Configurações da página
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;

            // PASSO 1: Adicionar template PNG como fundo
            this.adicionarTemplateFundo(doc, pageWidth, pageHeight);

            // PASSO 2: Posicionar dados do cliente e data
            this.posicionarDadosCliente(doc, dados);

            // PASSO 3: Configurar e posicionar tabela
            this.configurarTabela(doc, itens, total);

            // Salvar PDF
            const nomeArquivo = `orcamento_${dados.cliente.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(nomeArquivo);

            return { success: true, message: 'PDF gerado com sucesso!' };

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            return { success: false, message: 'Erro ao gerar PDF. Verifique se todas as bibliotecas estão carregadas.' };
        }
    }

    /**
     * Adiciona o template PNG como fundo da página
     * @param {jsPDF} doc - Instância do jsPDF
     * @param {number} pageWidth - Largura da página
     * @param {number} pageHeight - Altura da página
     */
    adicionarTemplateFundo(doc, pageWidth, pageHeight) {
        if (this.templateBase64) {
            // Adiciona a imagem do template como fundo
            // A imagem será redimensionada para cobrir toda a página
            doc.addImage(
                `data:image/png;base64,${this.templateBase64}`,
                'PNG',
                0, // x
                0, // y
                pageWidth, // largura
                pageHeight // altura
            );
        }
    }

    /**
     * Posiciona os dados do cliente e data nas coordenadas exatas do template
     * @param {jsPDF} doc - Instância do jsPDF
     * @param {Object} dados - Dados do cliente
     */
    posicionarDadosCliente(doc, dados) {
        // Configurações de fonte para os dados
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);

        // Posicionamento baseado no template (coordenadas aproximadas)
        // Nome do cliente - posição no campo "NOME DO CLIENTE"
        doc.text(dados.cliente, 85, 95); // Ajustar coordenadas conforme necessário

        // Data - posição no campo "DATA"
        doc.text(dados.data, 160, 95); // Ajustar coordenadas conforme necessário
    }

    /**
     * Configura e posiciona a tabela de itens
     * @param {jsPDF} doc - Instância do jsPDF
     * @param {Array} itens - Lista de itens
     * @param {number} total - Total do orçamento
     */
    configurarTabela(doc, itens, total) {
        // Preparar dados da tabela conforme o template
        const tableData = itens.map(item => [
            item.quantidade.toString(), // QUANTIDADE
            item.descricao,             // DESCRIÇÃO
            `R$ ${item.valor.toFixed(2)}`, // VALOR
            `R$ ${item.total.toFixed(2)}`  // TOTAL
        ]);

        // Configurar autoTable com posicionamento preciso
        doc.autoTable({
            head: [['QUANTIDADE', 'DESCRIÇÃO', 'VALOR', 'TOTAL']],
            body: tableData,
            startY: 120, // Posição Y onde a tabela começa (ajustar conforme template)
            margin: { 
                left: 25,   // Margem esquerda
                right: 25   // Margem direita
            },
            tableWidth: 'auto',
            columnStyles: {
                0: { cellWidth: 25 },  // QUANTIDADE - largura fixa
                1: { cellWidth: 85 },  // DESCRIÇÃO - largura maior
                2: { cellWidth: 30 },  // VALOR - largura média
                3: { cellWidth: 30 }   // TOTAL - largura média
            },
            styles: { 
                fontSize: 10,
                cellPadding: 3,
                overflow: 'linebreak',
                halign: 'left'
            },
            headStyles: { 
                fillColor: [255, 255, 255], // Fundo branco para não sobrepor o template
                textColor: [0, 0, 0],        // Texto preto
                fontStyle: 'bold',
                lineWidth: 0.1,
                lineColor: [0, 0, 0]
            },
            bodyStyles: {
                fillColor: [255, 255, 255], // Fundo branco para não sobrepor o template
                textColor: [0, 0, 0],        // Texto preto
                lineWidth: 0.1,
                lineColor: [0, 0, 0]
            },
            alternateRowStyles: {
                fillColor: [248, 248, 248]  // Cinza muito claro para linhas alternadas
            }
        });

        // Posicionar total geral (se necessário, dependendo do template)
        // const finalY = doc.lastAutoTable.finalY + 10;
        // doc.setFontSize(12);
        // doc.setFont(undefined, 'bold');
        // doc.text(`TOTAL GERAL: R$ ${total.toFixed(2)}`, 170, finalY);
    }
}