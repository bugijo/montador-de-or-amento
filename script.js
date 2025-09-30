/**
 * Aplicação de Montador de Orçamentos
 * Sistema modular para criação e gerenciamento de orçamentos com geração de PDF
 * 
 * @author Desenvolvedor Sênior JavaScript
 * @version 2.0.0
 */

// Configuração específica de cada máquina para a calculadora multi-máquinas
const MAQUINAS_CONFIG = [
    { id: "fp3", nome: "FP3", pecasPorJogo: 3, baseMetragem: 500 },
    { id: "fp6", nome: "FP6", pecasPorJogo: 6, baseMetragem: 1000 },
    { id: "fp9", nome: "FP9", pecasPorJogo: 9, baseMetragem: 1500 }
];

// Lista Mestra de Insumos (sem quantidades) para a calculadora multi-máquinas
const INSUMOS_BASE = [
    { sku: '4.10.010.083', descricao: "INSERTO METALICO DIAMANTADO 36 AR SUPER", valor: 159.00 },
    { sku: 'custom-1', descricao: "INSERTO METALICO DIAMANTADO 60", valor: 159.00 },
    { sku: 'custom-2', descricao: "INSERTO METALICO DIAMANTADO 120", valor: 159.00 },
    { sku: '4.10.010.053', descricao: "LIXA DIAMANTADA FLEXIVEL (RESINADO) GR 50", valor: 27.00 },
    { sku: '4.10.010.054', descricao: "LIXA DIAMANTADA FLEXIVEL (RESINADO) GR 100", valor: 27.00 },
    { sku: '4.10.010.055', descricao: "LIXA DIAMANTADA FLEXIVEL (RESINADO) GR 200", valor: 27.00 },
    { sku: '4.10.010.056', descricao: "LIXA DIAMANTADA FLEXIVEL (RESINADO) GR 400", valor: 27.00 },
    { sku: '4.10.010.057', descricao: "LIXA DIAMANTADA FLEXIVEL (RESINADO) GR 800", valor: 27.00 },
    { sku: '4.10.010.058', descricao: "LIXA DIAMANTADA FLEXIVEL (RESINADO) GR 1500", valor: 27.00 }
    // A lógica do endurecedor será tratada separadamente
];

// Regra para o endurecedor (1 Litro a cada 40m²) para a calculadora multi-máquinas
const ENDURECEDOR_CONFIG = {
    sku: '7.26.800.009',
    descricao: "ENDURECEDOR DE SUPERFICIE 1L",
    valor: 26.00,
    metrosPorLitro: 40
};

/**
 * Classe principal da aplicação de orçamentos
 * Encapsula todo o estado e funcionalidades da aplicação com contexto this correto
 */
class OrcamentoApp {
    constructor() {
        // Estado privado da aplicação
        this.state = {
            itens: [],
            total: 0
        };

        // Cache de elementos DOM
        this.elements = {};

        // Constante para a chave do Local Storage
        this.STORAGE_KEY = 'orcamento_atual';

        // Inicializa a aplicação
        this.init();
    }

    /**
     * Função debounce para otimizar chamadas frequentes
     * @param {Function} func - Função a ser executada
     * @param {number} delay - Delay em milissegundos
     * @returns {Function} Função com debounce aplicado
     */
    debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * Inicializa a aplicação
     * Configura event listeners e elementos DOM
     */
    init() {
        this.cacheElements();
        this.bindEvents();
        this.setDefaultDate();
        this.carregarMaquinas(); // Carrega as opções de máquinas no seletor
        this.carregarEstado(); // Carrega dados salvos do Local Storage
    }

    /**
     * Armazena referências dos elementos DOM em cache para melhor performance
     */
    cacheElements() {
        this.elements.cliente = document.getElementById('cliente');
        this.elements.vendedor = document.getElementById('vendedor');
        this.elements.data = document.getElementById('data');
        this.elements.tabelaItens = document.getElementById('tabela-itens');
        this.elements.corpoTabela = document.querySelector('#tabela-itens tbody');
        this.elements.totalOrcamento = document.getElementById('total-orcamento');
        this.elements.btnGerarPDF = document.getElementById('btn-gerar-pdf');
        this.elements.btnLimpar = document.getElementById('btn-limpar');
        
        // Elementos da calculadora multi-máquinas
        this.elements.maquinaSelector = document.getElementById('maquina-selector');
        this.elements.metrosQuadrados = document.getElementById('metros-quadrados');
        this.elements.btnCalcularInsumos = document.getElementById('btn-calcular-insumos');
    }

    /**
     * Configura todos os event listeners da aplicação
     * SOLUÇÃO DEFINITIVA: Usa .bind(this) para garantir contexto correto
     */
    bindEvents() {
        // Event listeners para botões principais com contexto this amarrado
        this.elements.btnCalcularInsumos.addEventListener('click', this.calcularEPreencherOrcamento.bind(this));
        this.elements.btnGerarPDF.addEventListener('click', this.handleGerarPDF.bind(this));
        this.elements.btnLimpar.addEventListener('click', this.limparTudo.bind(this));

        // Event listeners para salvar automaticamente quando dados do cliente mudarem
        this.elements.cliente.addEventListener('input', this.debounce(this.salvarEstado.bind(this), 500));
        this.elements.vendedor.addEventListener('input', this.debounce(this.salvarEstado.bind(this), 500));
        this.elements.data.addEventListener('change', this.salvarEstado.bind(this));
    }

    /**
     * Define a data atual como padrão no campo de data
     */
    setDefaultDate() {
        const hoje = new Date().toISOString().split('T')[0];
        this.elements.data.value = hoje;
    }

    /**
     * Carrega as opções de máquinas no seletor
     */
    carregarMaquinas() {
        const selector = this.elements.maquinaSelector;
        
        // Limpa opções existentes
        selector.innerHTML = '<option value="">Selecione uma máquina</option>';
        
        // Adiciona cada máquina como opção
        MAQUINAS_CONFIG.forEach(maquina => {
            const option = document.createElement('option');
            option.value = maquina.id;
            option.textContent = `${maquina.nome} (${maquina.pecasPorJogo} peças/jogo)`;
            selector.appendChild(option);
        });
    }

    /**
     * Mostra feedback visual de sucesso para o usuário
     * @param {string} mensagem - Mensagem a ser exibida
     */
    mostrarFeedbackSucesso(mensagem) {
        // Remove feedback anterior se existir
        const feedbackAnterior = document.querySelector('.feedback-sucesso');
        if (feedbackAnterior) {
            feedbackAnterior.remove();
        }

        // Cria novo elemento de feedback
        const feedback = document.createElement('div');
        feedback.className = 'feedback-sucesso';
        feedback.textContent = mensagem;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 1000;
            font-weight: 500;
        `;

        document.body.appendChild(feedback);

        // Remove automaticamente após 3 segundos
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.remove();
            }
        }, 3000);
    }

    /**
     * Mostra feedback visual de erro para o usuário
     * @param {string} mensagem - Mensagem de erro a ser exibida
     */
    mostrarFeedbackErro(mensagem) {
        // Remove feedback anterior se existir
        const feedbackAnterior = document.querySelector('.feedback-erro');
        if (feedbackAnterior) {
            feedbackAnterior.remove();
        }

        // Cria novo elemento de feedback
        const feedback = document.createElement('div');
        feedback.className = 'feedback-erro';
        feedback.textContent = mensagem;
        feedback.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 12px 20px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            z-index: 1000;
            font-weight: 500;
        `;

        document.body.appendChild(feedback);

        // Remove automaticamente após 5 segundos
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.remove();
            }
        }, 5000);
    }

    /**
     * Carrega o estado salvo do Local Storage
     * Restaura itens, dados do cliente e atualiza a interface
     */
    carregarEstado() {
        try {
            const estadoSalvo = localStorage.getItem(this.STORAGE_KEY);
            
            if (!estadoSalvo) {
                return;
            }

            const dados = JSON.parse(estadoSalvo);
            
            // Valida se os dados têm a estrutura esperada
            if (!dados || typeof dados !== 'object') {
                console.warn('Dados salvos inválidos, ignorando...');
                return;
            }

            // Restaura os itens do orçamento
            if (Array.isArray(dados.itens)) {
                this.state.itens = dados.itens;
                this.state.total = dados.total || 0;
            }

            // Restaura dados do cliente (se os elementos já estiverem disponíveis)
            if (this.elements.cliente && dados.cliente) {
                this.elements.cliente.value = dados.cliente;
            }

            if (this.elements.vendedor && dados.vendedor) {
                this.elements.vendedor.value = dados.vendedor;
            }

            if (this.elements.data && dados.data) {
                this.elements.data.value = dados.data;
            }

            // Recalcula o total para garantir consistência
            this.calcularTotal();
            
            // Atualiza a interface
            this.atualizarInterface();
            
            if (this.state.itens.length > 0) {
                this.mostrarFeedbackSucesso(`Orçamento restaurado com ${this.state.itens.length} item(ns)`);
            }

        } catch (error) {
            console.error('Erro ao carregar estado do Local Storage:', error);
            // Remove dados corrompidos
            localStorage.removeItem(this.STORAGE_KEY);
            this.mostrarFeedbackErro('Erro ao carregar dados salvos. Dados corrompidos foram removidos.');
        }
    }

    /**
     * Remove todos os dados salvos do Local Storage
     */
    limparLocalStorage() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
        } catch (error) {
            console.error('Erro ao limpar Local Storage:', error);
        }
    }

    /**
     * Manipula a geração do PDF com feedback para o usuário
     */
    handleGerarPDF() {
        const botaoGerar = document.querySelector('button[onclick="orcamentoApp.handleGerarPDF()"]');
        
        try {
            // Verifica se há itens na tabela
            if (this.state.itens.length === 0) {
                this.mostrarFeedbackErro('Adicione pelo menos um item antes de gerar o PDF.');
                return;
            }

            // Validação dos campos obrigatórios
            const campoCliente = this.elements.cliente;
            const campoVendedor = this.elements.vendedor;
            
            if (!campoCliente.value.trim()) {
                this.mostrarErroNoCampo(campoCliente, 'Nome do cliente é obrigatório.');
                return;
            }
            
            if (!campoVendedor.value.trim()) {
                this.mostrarErroNoCampo(campoVendedor, 'Nome do vendedor é obrigatório.');
                return;
            }

            // Mostra loading no botão
            this.mostrarLoadingBotao(botaoGerar, 'Gerando PDF...');

            // Carrega dados salvos do localStorage
            this.carregarEstado();

            // Simula um pequeno delay para mostrar o feedback
            setTimeout(() => {
                try {
                    // Gera o PDF
                    this.gerarPDF();
                    
                    // Mostra feedback de sucesso
                    this.mostrarFeedbackSucesso('PDF gerado com sucesso!');
                    
                } catch (error) {
                    console.error('Erro ao gerar PDF:', error);
                    this.mostrarFeedbackErro('Erro ao gerar PDF. Tente novamente.');
                } finally {
                    // Remove loading do botão
                    this.removerLoadingBotao(botaoGerar);
                }
            }, 800);
            
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            this.mostrarFeedbackErro('Erro ao gerar PDF. Tente novamente.');
            this.removerLoadingBotao(botaoGerar);
        }
    }

    /**
     * Calcula insumos baseado na máquina e metragem selecionadas
     * e preenche automaticamente o orçamento
     */
    calcularEPreencherOrcamento() {
        const botao = this.elements.btnCalcularInsumos;
        
        try {
            // Mostra loading no botão
            this.mostrarLoadingBotao(botao, 'Calculando...');
            
            const maquinaSelecionada = this.elements.maquinaSelector.value;
            const valorMetragem = this.elements.metrosQuadrados.value;

            // Validação da máquina
            if (!maquinaSelecionada) {
                this.mostrarFeedbackErro('Por favor, selecione uma máquina.');
                this.removerLoadingBotao(botao);
                return;
            }

            // Validação aprimorada da metragem
            const validacao = this.validarMetrosQuadrados(valorMetragem);
            if (!validacao.valido) {
                this.mostrarErroNoCampo(this.elements.metrosQuadrados, validacao.erro);
                this.mostrarFeedbackErro(validacao.erro);
                this.removerLoadingBotao(botao);
                return;
            }

            const metrosQuadrados = validacao.valor;

            // Busca configuração da máquina
            const configMaquina = MAQUINAS_CONFIG.find(m => m.id === maquinaSelecionada);
            if (!configMaquina) {
                this.mostrarFeedbackErro('Configuração da máquina não encontrada.');
                this.removerLoadingBotao(botao);
                return;
            }

            // Simula um pequeno delay para mostrar o loading (opcional)
            setTimeout(() => {
                try {
                    // Calcula quantidades baseadas na máquina e metragem
                    const resultados = this.calcularInsumos(configMaquina, metrosQuadrados);
                    
                    // Limpa itens existentes
                    this.state.itens = [];

                    // Adiciona cada insumo calculado ao orçamento
                    resultados.forEach(item => {
                        this.adicionarItem(item.sku, item.descricao, item.quantidade, item.valor);
                    });

                    // Atualiza interface e salva estado
                    this.atualizarInterface();
                    this.salvarEstado();

                    this.mostrarFeedbackSucesso(`Orçamento calculado para ${configMaquina.nome} com ${metrosQuadrados}m²`);

                } catch (error) {
                    console.error('Erro ao calcular orçamento:', error);
                    this.mostrarFeedbackErro('Erro ao calcular orçamento. Verifique os dados e tente novamente.');
                } finally {
                    // Remove loading do botão
                    this.removerLoadingBotao(botao);
                }
            }, 300); // 300ms de delay para mostrar o loading

        } catch (error) {
            console.error('Erro ao calcular orçamento:', error);
            this.mostrarFeedbackErro('Erro ao calcular orçamento. Verifique os dados e tente novamente.');
            this.removerLoadingBotao(botao);
        }
    }

    /**
     * Calcula as quantidades de insumos necessárias baseado na máquina e metragem
     * @param {Object} configMaquina - Configuração da máquina selecionada
     * @param {number} metrosQuadrados - Metragem a ser processada
     * @returns {Array} Array com os insumos e quantidades calculadas
     * @throws {Error} Quando a configuração da máquina é inválida
     */
    calcularInsumos(configMaquina, metrosQuadrados) {
        const resultados = [];

        // Calcula quantos jogos de peças são necessários
        const jogosNecessarios = Math.ceil(metrosQuadrados / configMaquina.baseMetragem);

        // Adiciona insertes metálicos (3 tipos por jogo)
        const insertesMetalicos = INSUMOS_BASE.slice(0, 3); // Primeiros 3 são os insertes
        insertesMetalicos.forEach(inserto => {
            resultados.push({
                sku: inserto.sku,
                descricao: inserto.descricao,
                quantidade: jogosNecessarios,
                valor: inserto.valor
            });
        });

        // Adiciona lixas diamantadas (6 tipos por jogo)
        const lixasDiamantadas = INSUMOS_BASE.slice(3); // Restantes são as lixas
        lixasDiamantadas.forEach(lixa => {
            resultados.push({
                sku: lixa.sku,
                descricao: lixa.descricao,
                quantidade: jogosNecessarios,
                valor: lixa.valor
            });
        });

        // Calcula endurecedor (1L a cada 40m²)
        const litrosEndurecedor = Math.ceil(metrosQuadrados / ENDURECEDOR_CONFIG.metrosPorLitro);
        resultados.push({
            sku: ENDURECEDOR_CONFIG.sku,
            descricao: ENDURECEDOR_CONFIG.descricao,
            quantidade: litrosEndurecedor,
            valor: ENDURECEDOR_CONFIG.valor
        });

        return resultados;
    }

    /**
     * Adiciona um novo item ao orçamento
     * @param {string} sku - Código SKU do produto
     * @param {string} descricao - Descrição do produto
     * @param {number|string} quantidade - Quantidade do item
     * @param {number|string} valor - Valor unitário do item
     */
    adicionarItem(sku, descricao, quantidade, valor) {
        const novoItem = {
            id: Date.now() + Math.random(), // ID único
            sku: sku || '',
            descricao: descricao || '',
            quantidade: parseFloat(quantidade) || 0,
            valor: parseFloat(valor) || 0,
            total: (parseFloat(quantidade) || 0) * (parseFloat(valor) || 0)
        };

        this.state.itens.push(novoItem);
        this.calcularTotal();
    }

    /**
     * Remove um item específico do orçamento
     * @param {number|string} itemId - ID do item a ser removido
     */
    removerItemDoEstado(itemId) {
        const index = this.state.itens.findIndex(item => item.id == itemId);
        if (index !== -1) {
            this.state.itens.splice(index, 1);
            this.calcularTotal();
            this.atualizarInterface();
            this.salvarEstado();
            this.mostrarFeedbackSucesso('Item removido com sucesso!');
        }
    }

    /**
     * Calcula o total geral do orçamento
     */
    calcularTotal() {
        this.state.total = this.state.itens.reduce((acc, item) => acc + item.total, 0);
    }

    /**
     * Atualiza a interface com os dados atuais
     */
    atualizarInterface() {
        this.atualizarTabela();
        this.atualizarTotal();
    }

    /**
     * Renderiza a tabela de itens na interface
     * Atualiza o DOM com todos os itens do estado atual
     */
    renderizarTabela() {
        const tbody = this.elements.corpoTabela;
        tbody.innerHTML = '';

        this.state.itens.forEach(item => {
            const row = tbody.insertRow();
            row.innerHTML = `
                <td>${item.sku}</td>
                <td>${item.descricao}</td>
                <td>${item.quantidade}</td>
                <td>R$ ${item.valor.toFixed(2)}</td>
                <td>R$ ${item.total.toFixed(2)}</td>
                <td>
                    <button onclick="orcamentoApp.removerItem('${item.id}')" class="btn-remover">
                        Remover
                    </button>
                </td>
            `;
        });
    }

    /**
     * Atualiza a tabela de itens na interface
     */
    atualizarTabela() {
        const tbody = this.elements.corpoTabela;
        tbody.innerHTML = '';

        this.state.itens.forEach(item => {
            const linha = this.criarLinhaTabela(item);
            tbody.appendChild(linha);
        });

        // Mostra/esconde a tabela baseado na existência de itens
        this.elements.tabelaItens.style.display = this.state.itens.length > 0 ? 'table' : 'none';
    }

    /**
     * Cria uma linha da tabela para um item específico
     * @param {Object} item - Item do orçamento
     * @returns {HTMLTableRowElement} Elemento tr da tabela
     */
    criarLinhaTabela(item) {
        const tr = document.createElement('tr');

        // Célula SKU
        const tdSku = document.createElement('td');
        tdSku.textContent = item.sku;
        tr.appendChild(tdSku);

        // Célula Descrição
        const tdDescricao = document.createElement('td');
        tdDescricao.textContent = item.descricao;
        tr.appendChild(tdDescricao);

        // Célula Quantidade
        const tdQuantidade = document.createElement('td');
        tdQuantidade.textContent = item.quantidade;
        tr.appendChild(tdQuantidade);

        // Célula Valor Unitário
        const tdValor = document.createElement('td');
        tdValor.textContent = `R$ ${item.valor.toFixed(2)}`;
        tr.appendChild(tdValor);

        // Célula Total
        const tdTotal = document.createElement('td');
        tdTotal.textContent = `R$ ${item.total.toFixed(2)}`;
        tr.appendChild(tdTotal);

        // Célula Ações
        const tdAcoes = document.createElement('td');
        const btnRemover = document.createElement('button');
        btnRemover.textContent = 'Remover';
        btnRemover.className = 'btn-remover';
        btnRemover.addEventListener('click', () => this.removerItemDoEstado(item.id));
        tdAcoes.appendChild(btnRemover);
        tr.appendChild(tdAcoes);

        return tr;
    }

    /**
     * Atualiza o valor total do orçamento
     * Calcula a soma de todos os itens e atualiza a interface
     */
    atualizarTotal() {
        this.state.total = this.state.itens.reduce((acc, item) => acc + item.total, 0);
        this.elements.totalOrcamento.textContent = `R$ ${this.state.total.toFixed(2)}`;
    }

    /**
     * Salva o estado atual no Local Storage
     */
    salvarEstado() {
        try {
            const estadoParaSalvar = {
                itens: this.state.itens,
                total: this.state.total,
                cliente: this.elements.cliente.value,
                vendedor: this.elements.vendedor.value,
                data: this.elements.data.value,
                timestamp: new Date().toISOString()
            };

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(estadoParaSalvar));
        } catch (error) {
            console.error('Erro ao salvar estado no Local Storage:', error);
            this.mostrarFeedbackErro('Erro ao salvar dados automaticamente.');
        }
    }

    /**
     * Gera e baixa o PDF do orçamento
     */
    gerarPDF() {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Logo da FINITI em Base64 (SVG convertido)
            const logoBase64 = 'data:image/svg+xml;base64,' + btoa(`
                <svg width="120" height="40" viewBox="0 0 120 40" xmlns="http://www.w3.org/2000/svg">
                    <rect width="120" height="40" rx="6" fill="#253A5E"/>
                    <text x="60" y="26" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="700" text-anchor="middle" fill="white">FINITI</text>
                    <circle cx="15" cy="20" r="3" fill="#28a745"/>
                    <circle cx="105" cy="20" r="3" fill="#28a745"/>
                </svg>
            `);

            // Configurações do documento
            const pageWidth = doc.internal.pageSize.width;
            const pageHeight = doc.internal.pageSize.height;
            const margin = 20;

            // PASSO 1: MARCA D'ÁGUA (Primeiro elemento a ser desenhado)
            this.adicionarMarcaDagua(doc, logoBase64, pageWidth, pageHeight);

            // PASSO 2: CABEÇALHO
            let yPosition = this.adicionarCabecalho(doc, logoBase64, pageWidth, margin);

            // PASSO 3: TABELA DE ITENS
            const tableData = this.state.itens.map(item => [
                item.sku,
                item.descricao,
                item.quantidade.toString(),
                `R$ ${item.valor.toFixed(2)}`,
                `R$ ${item.total.toFixed(2)}`
            ]);

            doc.autoTable({
                head: [['SKU', 'Descrição', 'Qtd', 'Valor Unit.', 'Total']],
                body: tableData,
                startY: yPosition,
                margin: { left: margin, right: margin },
                styles: { 
                    fontSize: 10,
                    cellPadding: 5
                },
                headStyles: { 
                    fillColor: [37, 58, 94], // Cor da marca FINITI (#253A5E)
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [245, 245, 245]
                },
                // PASSO 4: RODAPÉ (Executado em cada página)
                didDrawPage: (data) => {
                    this.adicionarRodape(doc, pageWidth, pageHeight, data.pageNumber, doc.getNumberOfPages());
                }
            });

            // Total geral
            yPosition = doc.lastAutoTable.finalY + 20;
            doc.setFontSize(14);
            doc.setFont(undefined, 'bold');
            doc.setTextColor(37, 58, 94); // Cor da marca FINITI
            doc.text(`TOTAL GERAL: R$ ${this.state.total.toFixed(2)}`, pageWidth - margin, yPosition, { align: 'right' });

            // Salva o PDF
            const nomeArquivo = `orcamento_${this.elements.cliente.value.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
            doc.save(nomeArquivo);

            this.mostrarFeedbackSucesso('PDF gerado com sucesso!');

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            this.mostrarFeedbackErro('Erro ao gerar PDF. Verifique se todas as bibliotecas estão carregadas.');
        }
    }

    /**
     * Adiciona marca d'água transparente no centro da página
     * @param {jsPDF} doc - Instância do jsPDF
     * @param {string} logoBase64 - Logo em Base64
     * @param {number} pageWidth - Largura da página
     * @param {number} pageHeight - Altura da página
     */
    adicionarMarcaDagua(doc, logoBase64, pageWidth, pageHeight) {
        // Configurar opacidade baixa para marca d'água
        doc.setGState(new doc.GState({ opacity: 0.05 }));
        
        // Calcular posição central e tamanho da marca d'água
        const logoWidth = 80;
        const logoHeight = 26.67; // Proporção 3:1 da logo original
        const x = (pageWidth - logoWidth) / 2;
        const y = (pageHeight - logoHeight) / 2;
        
        // Adicionar logo como marca d'água
        doc.addImage(logoBase64, 'SVG', x, y, logoWidth, logoHeight);
        
        // Restaurar opacidade total para o resto do conteúdo
        doc.setGState(new doc.GState({ opacity: 1 }));
    }

    /**
     * Adiciona cabeçalho profissional com logo e informações
     * @param {jsPDF} doc - Instância do jsPDF
     * @param {string} logoBase64 - Logo em Base64
     * @param {number} pageWidth - Largura da página
     * @param {number} margin - Margem da página
     * @returns {number} Posição Y após o cabeçalho
     */
    adicionarCabecalho(doc, logoBase64, pageWidth, margin) {
        let yPosition = margin;

        // Logo no canto superior esquerdo
        const logoWidth = 40;
        const logoHeight = 13.33; // Proporção 3:1 da logo original
        doc.addImage(logoBase64, 'SVG', margin, yPosition, logoWidth, logoHeight);

        // Título "ORÇAMENTO" centralizado
        doc.setFontSize(24);
        doc.setFont(undefined, 'bold');
        doc.setTextColor(37, 58, 94); // Cor da marca FINITI
        doc.text('ORÇAMENTO', pageWidth / 2, yPosition + 10, { align: 'center' });
        
        yPosition += 30;

        // Linha decorativa
        doc.setDrawColor(37, 58, 94);
        doc.setLineWidth(0.5);
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 15;

        // Informações do cliente em layout organizado
        doc.setFontSize(11);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(0, 0, 0);

        // Primeira linha: Cliente e Data
        doc.setFont(undefined, 'bold');
        doc.text('Cliente:', margin, yPosition);
        doc.setFont(undefined, 'normal');
        doc.text(this.elements.cliente.value, margin + 20, yPosition);
        
        doc.setFont(undefined, 'bold');
        doc.text('Data:', pageWidth - 60, yPosition);
        doc.setFont(undefined, 'normal');
        doc.text(this.elements.data.value, pageWidth - 35, yPosition);
        yPosition += 12;

        // Segunda linha: Vendedor
        doc.setFont(undefined, 'bold');
        doc.text('Vendedor:', margin, yPosition);
        doc.setFont(undefined, 'normal');
        doc.text(this.elements.vendedor.value, margin + 25, yPosition);
        yPosition += 20;

        return yPosition;
    }

    /**
     * Adiciona rodapé com informações de contato e numeração
     * @param {jsPDF} doc - Instância do jsPDF
     * @param {number} pageWidth - Largura da página
     * @param {number} pageHeight - Altura da página
     * @param {number} pageNumber - Número da página atual
     * @param {number} totalPages - Total de páginas
     */
    adicionarRodape(doc, pageWidth, pageHeight, pageNumber, totalPages) {
        const margin = 20;
        const rodapeY = pageHeight - 25;

        // Linha horizontal no rodapé
        doc.setDrawColor(37, 58, 94);
        doc.setLineWidth(0.5);
        doc.line(margin, rodapeY - 5, pageWidth - margin, rodapeY - 5);

        // Configurações do texto do rodapé
        doc.setFontSize(8);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);

        // Informações de contato da empresa
        const enderecoTexto = 'Rua José Magro, 295 | Distrito Industrial 3 | Sertãozinho/SP CEP: 14.175-336';
        const telefoneTexto = 'Tel: +55 (16) 3511-0900';
        const emailTexto = 'E-mail: finiti@finiti.com.br';

        // Primeira linha: Endereço (centralizado)
        doc.text(enderecoTexto, pageWidth / 2, rodapeY + 2, { align: 'center' });

        // Segunda linha: Telefone e E-mail
        doc.text(telefoneTexto, margin, rodapeY + 10);
        doc.text(emailTexto, pageWidth / 2, rodapeY + 10, { align: 'center' });

        // Numeração da página (canto direito)
        const paginaTexto = `Página ${pageNumber} de ${totalPages}`;
        doc.text(paginaTexto, pageWidth - margin, rodapeY + 10, { align: 'right' });
    }

    /**
     * Retorna o estado atual da aplicação (para debugging)
     * @returns {Object} Estado atual
     */
    obterEstado() {
        return {
            itens: [...this.state.itens],
            total: this.state.total
        };
    }

    /**
     * Limpa todos os dados do orçamento
     */
    limparTudo() {
        if (this.state.itens.length === 0) {
            this.mostrarFeedbackErro('Não há dados para limpar.');
            return;
        }

        if (confirm('Tem certeza que deseja limpar todos os dados? Esta ação não pode ser desfeita.')) {
            this.state.itens = [];
            this.state.total = 0;
            this.elements.cliente.value = '';
            this.elements.vendedor.value = '';
            this.elements.maquinaSelector.value = '';
            this.elements.metrosQuadrados.value = '';
            this.setDefaultDate();
            this.limparLocalStorage();
            this.atualizarInterface();
            this.mostrarFeedbackSucesso('Dados limpos com sucesso!');
        }
    }

    /**
     * Método público para remover item (compatibilidade)
     * @param {number|string} itemId - ID do item a ser removido
     */
    removerItem(itemId) {
        this.removerItemDoEstado(itemId);
    }

    /**
     * Mostra estado de loading em um botão
     * @param {HTMLElement} botao - Elemento do botão
     * @param {string} textoLoading - Texto a ser exibido durante o loading
     */
    mostrarLoadingBotao(botao, textoLoading) {
        if (!botao) return;
        
        // Salva o texto original se ainda não foi salvo
        if (!botao.dataset.textoOriginal) {
            botao.dataset.textoOriginal = botao.textContent;
        }
        
        // Desabilita o botão e muda o texto
        botao.disabled = true;
        botao.textContent = textoLoading;
        botao.style.opacity = '0.7';
        botao.style.cursor = 'not-allowed';
    }

    /**
     * Remove estado de loading de um botão
     * @param {HTMLElement} botao - Elemento do botão
     */
    removerLoadingBotao(botao) {
        if (!botao) return;
        
        // Restaura o estado original
        botao.disabled = false;
        botao.textContent = botao.dataset.textoOriginal || botao.textContent;
        botao.style.opacity = '1';
        botao.style.cursor = 'pointer';
    }

    /**
     * Valida entrada de metros quadrados
     * @param {string} valor - Valor a ser validado
     * @returns {Object} Resultado da validação {valido: boolean, erro: string, valor: number}
     */
    validarMetrosQuadrados(valor) {
        // Remove espaços em branco
        valor = valor.trim();
        
        // Verifica se está vazio
        if (!valor) {
            return {
                valido: false,
                erro: 'Por favor, insira a metragem.',
                valor: null
            };
        }
        
        // Converte para número
        const numero = parseFloat(valor);
        
        // Verifica se é um número válido
        if (isNaN(numero)) {
            return {
                valido: false,
                erro: 'Por favor, insira apenas números.',
                valor: null
            };
        }
        
        // Verifica se é positivo
        if (numero <= 0) {
            return {
                valido: false,
                erro: 'A metragem deve ser maior que zero.',
                valor: null
            };
        }
        
        // Verifica se não é muito grande (limite razoável)
        if (numero > 100000) {
            return {
                valido: false,
                erro: 'Metragem muito grande. Verifique o valor inserido.',
                valor: null
            };
        }
        
        return {
            valido: true,
            erro: null,
            valor: numero
        };
    }

    /**
     * Mostra mensagem de erro específica para um campo
     * @param {HTMLElement} campo - Campo que contém o erro
     * @param {string} mensagem - Mensagem de erro
     */
    mostrarErroNoCampo(campo, mensagem) {
        if (!campo) return;
        
        // Remove erro anterior se existir
        const erroAnterior = campo.parentNode.querySelector('.erro-campo');
        if (erroAnterior) {
            erroAnterior.remove();
        }
        
        // Cria elemento de erro
        const elementoErro = document.createElement('div');
        elementoErro.className = 'erro-campo';
        elementoErro.textContent = mensagem;
        elementoErro.style.cssText = `
            color: #f44336;
            font-size: 12px;
            margin-top: 4px;
            font-weight: 500;
        `;
        
        // Adiciona borda vermelha ao campo
        campo.style.borderColor = '#f44336';
        campo.style.boxShadow = '0 0 0 2px rgba(244, 67, 54, 0.2)';
        
        // Insere o erro após o campo
        campo.parentNode.insertBefore(elementoErro, campo.nextSibling);
        
        // Remove o erro após 5 segundos
        setTimeout(() => {
            if (elementoErro.parentNode) {
                elementoErro.remove();
                campo.style.borderColor = '';
                campo.style.boxShadow = '';
            }
        }, 5000);
    }
}

// Inicialização da aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.orcamentoApp = new OrcamentoApp();
});