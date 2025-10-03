console.log('PDFGenerator carregado');

window.PDFGenerator = class {
    constructor() {
        console.log('PDFGenerator criado');
        // Cores do sistema FINITI
        this.corAzul = '#1e40af'; // Azul do sistema
        this.corPreta = '#000000'; // Preto para conteúdo
    }

    async gerarPDF(dadosOrcamento) {
        try {
            console.log('Gerando PDF...', dadosOrcamento);
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();

            // Carregar e adicionar arte de fundo
            try {
                const response = await fetch('./orçamento.png');
                const blob = await response.blob();
                const reader = new FileReader();
                
                await new Promise((resolve, reject) => {
                    reader.onload = function() {
                        try {
                            // Adicionar a imagem de fundo cobrindo toda a página
                            doc.addImage(reader.result, 'PNG', 0, 0, pageWidth, pageHeight);
                            resolve();
                        } catch (error) {
                            console.warn('Erro ao adicionar imagem de fundo:', error);
                            resolve(); // Continua mesmo se der erro na imagem
                        }
                    };
                    reader.onerror = reject;
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                console.warn('Erro ao carregar arte de fundo:', error);
                // Continua a geração do PDF mesmo sem a arte de fundo
            }

            // Seção superior - Cliente, Data, Metros² na mesma linha horizontal
            // Movido mais para baixo para deixar espaço para arte futura
            let yPosition = 60;
            doc.setFontSize(12);
            doc.setTextColor(30, 64, 175); // Azul para labels
            doc.setFont(undefined, 'bold');

            // Cliente
            doc.text('CLIENTE:', 20, yPosition);
            doc.setTextColor(0, 0, 0); // Preto para valores
            doc.setFont(undefined, 'normal');
            doc.text(dadosOrcamento.cliente || 'Não informado', 50, yPosition);

            // Data (mesma linha, posição central)
            doc.setTextColor(30, 64, 175); // Azul para labels
            doc.setFont(undefined, 'bold');
            doc.text('DATA:', 90, yPosition);
            doc.setTextColor(0, 0, 0); // Preto para valores
            doc.setFont(undefined, 'normal');
            const dataAtual = new Date().toLocaleDateString('pt-BR');
            doc.text(dataAtual, 110, yPosition);

            // Metros² (mesma linha, posição direita)
            doc.setTextColor(30, 64, 175); // Azul para labels
            doc.setFont(undefined, 'bold');
            doc.text('METROS²:', 150, yPosition);
            doc.setTextColor(0, 0, 0); // Preto para valores
            doc.setFont(undefined, 'normal');
            doc.text(dadosOrcamento.medidaBase || 'Não informado', 180, yPosition);

            // Tabela de itens
            yPosition += 25;
            
            // Cabeçalhos da tabela em azul
            doc.setFontSize(11);
            doc.setTextColor(30, 64, 175); // Azul para cabeçalhos
            doc.setFont(undefined, 'bold');
            
            const colunas = {
                quantidade: { x: 20, width: 25, label: 'QTD' },
                descricao: { x: 45, width: 80, label: 'DESCRIÇÃO' },
                valorUnitario: { x: 125, width: 30, label: 'VALOR UNIT.' },
                total: { x: 155, width: 35, label: 'TOTAL' }
            };

            // Desenhar cabeçalhos
            Object.values(colunas).forEach(coluna => {
                doc.text(coluna.label, coluna.x, yPosition);
            });

            // Linha separadora
            yPosition += 5;
            doc.setDrawColor(30, 64, 175);
            doc.line(20, yPosition, 190, yPosition);

            // Itens da tabela
            yPosition += 10;
            doc.setTextColor(0, 0, 0); // Preto para conteúdo
            doc.setFont(undefined, 'normal');
            doc.setFontSize(10);

            let totalGeral = 0;

            if (dadosOrcamento.itens && dadosOrcamento.itens.length > 0) {
                dadosOrcamento.itens.forEach((item, index) => {
                    const quantidade = parseInt(item.quantidade || 1);
                    const valorUnitario = parseFloat(item.valor || 0);
                    const valorTotal = parseFloat(item.total || 0);
                    totalGeral += valorTotal;

                    // Quantidade
                    doc.text(String(quantidade), colunas.quantidade.x, yPosition);
                    
                    // Descrição (quebrar texto se necessário)
                    const descricao = item.descricao || '';
                    const linhasDescricao = doc.splitTextToSize(descricao, colunas.descricao.width);
                    doc.text(linhasDescricao, colunas.descricao.x, yPosition);
                    
                    // Valor unitário
                    doc.text(this.formatarMoeda(valorUnitario), colunas.valorUnitario.x, yPosition);
                    
                    // Total
                    doc.text(this.formatarMoeda(valorTotal), colunas.total.x, yPosition);
                    
                    yPosition += Math.max(10, linhasDescricao.length * 4);
                });
            }

            // Total geral
            yPosition += 15;
            doc.setFontSize(14);
            doc.setTextColor(30, 64, 175); // Azul
            doc.setFont(undefined, 'bold');
            doc.text(`Total: ${this.formatarMoeda(totalGeral)}`, pageWidth - 20, yPosition, { align: 'right' });

            // Salvar o PDF
            const nomeArquivo = `Orcamento_${dadosOrcamento.cliente || 'Cliente'}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(nomeArquivo);

            return true;
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            throw error;
        }
    }

    formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor || 0);
    }

    async gerarPDFOrcamento(dadosOrcamento) {
        return this.gerarPDF(dadosOrcamento);
    }
};