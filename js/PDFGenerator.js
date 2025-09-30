/**
 * Módulo responsável pela geração de PDF usando template
 */

// Template Base64 embutido para evitar problemas de CORS
const TEMPLATE_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAABYYAAAfQCAYAAAB2Xou3AAAACXBIWXMAABpMAAAaTAEcLDmcAAAE4GlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSfvu78nIGlkPSdXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQnPz4KPHg6eG1wbWV0YSB4bWxuczp4PSdhZG9iZTpuczptZXRhLyc+CjxyZGY6UkRGIHhtbG5zOnJkZj0naHR0cDovL3d3dy53My5vcmcvMTk5OS8wMi8yMi1yZGYtc3ludGF4LW5zIyc+CgogPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9JycKICB4bWxuczpBdHRyaWI9J2h0dHA6Ly9ucy5hdHRyaWJ1dGlvbi5jb20vYWRzLzEuMC8nPgogIDxBdHRyaWI6QWRzPgogICA8cmRmOlNlcT4KICAgIDxyZGY6bGkgcmRmOnBhcnNlVHlwZT0nUmVzb3VyY2UnPgogICAgIDxBdHRyaWI6Q3JlYXRlZD4yMDI1LTA5LTMwPC9BdHRyaWI6Q3JlYXRlZD4KICAgICA8QXR0cmliOkV4dElkPmRiOGE5ZWUwLTNlODUtNDAxOS1hM2YyLTRjYzI2NzkwZTY3NTwvQXR0cmliOkV4dElkPgogICAgIDxBdHRyaWI6RmJJZD41MjUyNjU5MTQxNzk1ODA8L0F0dHJpYjpGYklkPgogICAgIDxBdHRyaWI6VG91Y2hUeXBlPjI8L0F0dHJpYjpUb3VjaFR5cGU+CiAgICA8L3JkZjpsaT4KICAgPC9yZGY6U2VxPgogIDwvQXR0cmliOkFkcz4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24gcmRmOmFib3V0PScnCiAgeG1sbnM6ZGM9J2h0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvJz4KICA8ZGM6dGl0bGU+CiAgIDxyZGY6QWx0PgogICAgPHJkZjpsaSB4bWw6bGFuZz0neC1kZWZhdWx0Jz5vcsOnYW1lbnRvIC0gMTwvcmRmOmxpPgogICA8L3JkZjpBbHQ+CiAgPC9kYzp0aXRsZT4KIDwvcmRmOkRlc2NyaXB0aW9uPgoKIDxyZGY6RGVzY3JpcHRpb24gcmRm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';

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