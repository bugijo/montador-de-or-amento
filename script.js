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
 * Módulo principal da aplicação de orçamentos
 * Encapsula todo o estado e funcionalidades da aplicação
 */
const OrcamentoApp = (() => {
    'use strict';

    // Estado privado da aplicação
    let state = {
        itens: [],
        total: 0
    };

    // Cache de elementos DOM
    const elements = {};

    // Constante para a chave do Local Storage
    const STORAGE_KEY = 'orcamento_atual';

    /**
     * Função debounce para otimizar chamadas frequentes
     * @param {Function} func - Função a ser executada
     * @param {number} delay - Delay em milissegundos
     * @returns {Function} Função com debounce aplicado
     */
    function debounce(func, delay) {
        let timeoutId;
        return function (...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    }

    /**
     * Inicializa a aplicação
     * Configura event listeners e elementos DOM
     */
    function init() {
        cacheElements();
        bindEvents();
        setDefaultDate();
        carregarMaquinas(); // Carrega as opções de máquinas no seletor
        carregarEstado(); // Carrega dados salvos do Local Storage
        // console.log('Aplicação de Orçamento inicializada com sucesso');
    }

    /**
     * Armazena referências dos elementos DOM em cache para melhor performance
     */
    function cacheElements() {
        elements.cliente = document.getElementById('cliente');
        elements.vendedor = document.getElementById('vendedor');
        elements.data = document.getElementById('data');
        elements.tabelaItens = document.getElementById('tabela-itens');
        elements.corpoTabela = document.querySelector('#tabela-itens tbody');
        elements.totalOrcamento = document.getElementById('total-orcamento');
        elements.btnGerarPDF = document.getElementById('btn-gerar-pdf');
        elements.btnLimpar = document.getElementById('btn-limpar');
        
        // Elementos da calculadora multi-máquinas
        elements.maquinaSelector = document.getElementById('maquina-selector');
        elements.metrosQuadrados = document.getElementById('metros-quadrados');
        elements.btnCalcularInsumos = document.getElementById('btn-calcular-insumos');
    }

    /**
     * Configura todos os event listeners da aplicação
     */
    function bindEvents() {
        // Event listeners para botões principais
        elements.btnGerarPDF.addEventListener('click', handleGerarPDF);
        elements.btnLimpar.addEventListener('click', limparTudo);

        // Event listeners para salvar automaticamente quando dados do cliente mudarem
        elements.cliente.addEventListener('input', debounce(salvarEstado, 500));
        elements.vendedor.addEventListener('input', debounce(salvarEstado, 500));
        elements.data.addEventListener('change', salvarEstado);

        // Event listener para calculadora multi-máquinas
        elements.btnCalcularInsumos.addEventListener('click', calcularEPreencherOrcamento);
    }

    /**
     * Define a data atual como padrão no campo de data
     */
    function setDefaultDate() {
        const hoje = new Date().toISOString().split('T')[0];
        elements.data.value = hoje;
    }

    /**
     * Carrega as opções de máquinas no seletor
     */
    function carregarMaquinas() {
        const selector = elements.maquinaSelector;
        
        // Limpa opções existentes (exceto a primeira)
        selector.innerHTML = '<option value="">-- Selecione uma máquina --</option>';
        
        // Adiciona cada máquina como opção
        MAQUINAS_CONFIG.forEach(maquina => {
            const option = document.createElement('option');
            option.value = maquina.id;
            option.textContent = maquina.nome;
            selector.appendChild(option);
        });
    }

    /**
     * Salva o estado atual da aplicação no Local Storage
     * Inclui itens do orçamento, dados do cliente e total
     */
    function salvarEstado() {
        try {
            const estadoParaSalvar = {
                itens: state.itens,
                total: state.total,
                cliente: elements.cliente ? elements.cliente.value.trim() : '',
                vendedor: elements.vendedor ? elements.vendedor.value.trim() : '',
                data: elements.data ? elements.data.value : '',
                timestamp: new Date().toISOString()
            };

            localStorage.setItem(STORAGE_KEY, JSON.stringify(estadoParaSalvar));
            // console.log('Estado salvo no Local Storage:', estadoParaSalvar);
        } catch (error) {
            console.error('Erro ao salvar estado no Local Storage:', error);
            mostrarFeedbackErro('Erro ao salvar dados. Verifique se o navegador suporta Local Storage.');
        }
    }

    /**
     * Carrega o estado salvo do Local Storage
     * Restaura itens, dados do cliente e atualiza a interface
     */
    function carregarEstado() {
        try {
            const estadoSalvo = localStorage.getItem(STORAGE_KEY);
            
            if (!estadoSalvo) {
                // console.log('Nenhum estado salvo encontrado no Local Storage');
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
                state.itens = dados.itens;
                state.total = dados.total || 0;
            }

            // Restaura dados do cliente (se os elementos já estiverem disponíveis)
            if (elements.cliente && dados.cliente) {
                elements.cliente.value = dados.cliente;
            }

            if (elements.vendedor && dados.vendedor) {
                elements.vendedor.value = dados.vendedor;
            }

            if (elements.data && dados.data) {
                elements.data.value = dados.data;
            }

            // Recalcula o total para garantir consistência
            calcularTotal();
            
            // Atualiza a interface
            atualizarInterface();

            // console.log('Estado carregado do Local Storage:', dados);
            
            if (state.itens.length > 0) {
                mostrarFeedbackSucesso(`Orçamento restaurado com ${state.itens.length} item(ns)`);
            }

        } catch (error) {
            console.error('Erro ao carregar estado do Local Storage:', error);
            // Remove dados corrompidos
            localStorage.removeItem(STORAGE_KEY);
            mostrarFeedbackErro('Erro ao carregar dados salvos. Dados corrompidos foram removidos.');
        }
    }

    /**
     * Remove todos os dados salvos do Local Storage
     */
    function limparLocalStorage() {
        try {
            localStorage.removeItem(STORAGE_KEY);
            // console.log('Dados removidos do Local Storage');
        } catch (error) {
            console.error('Erro ao limpar Local Storage:', error);
        }
    }



    // Funções de adição manual removidas - aplicação focada apenas na calculadora

    /**
     * Manipulador do evento de gerar PDF
     * @param {Event} event - Evento de click
     */
    function handleGerarPDF(event) {
        event.preventDefault();
        
        if (!validarDadosOrcamento()) {
            return;
        }
        
        try {
            gerarPDF();
            mostrarFeedbackSucesso('PDF gerado com sucesso!');
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            mostrarFeedbackErro('Erro ao gerar PDF. Tente novamente.');
        }
    }



    /**
     * Valida os dados necessários para gerar o orçamento
     * @returns {boolean} True se válido, false caso contrário
     */
    function validarDadosOrcamento() {
        const erros = [];

        if (!elements.cliente.value.trim()) {
            erros.push('Nome do cliente é obrigatório');
        }

        if (!elements.data.value) {
            erros.push('Data é obrigatória');
        }

        if (state.itens.length === 0) {
            erros.push('Adicione pelo menos um item ao orçamento');
        }

        if (erros.length > 0) {
            mostrarFeedbackErro(erros.join('\n'));
            return false;
        }

        return true;
    }



    /**
     * Calcula e preenche o orçamento baseado na máquina selecionada e metragem
     * Implementa a lógica da calculadora multi-máquinas
     */
    function calcularEPreencherOrcamento() {
        try {
            // a. Ler a máquina selecionada e os metros quadrados
            const maquinaSelecionadaId = elements.maquinaSelector.value;
            const metrosInseridos = parseFloat(elements.metrosQuadrados.value.replace(',', '.'));

            // Validações
            if (!maquinaSelecionadaId) {
                mostrarFeedbackErro('Selecione uma máquina');
                return;
            }

            if (isNaN(metrosInseridos) || metrosInseridos <= 0) {
                mostrarFeedbackErro('Informe uma metragem válida maior que zero');
                return;
            }

            // b. Encontrar o objeto de configuração da máquina selecionada
            const maquinaSelecionada = MAQUINAS_CONFIG.find(maq => maq.id === maquinaSelecionadaId);
            
            if (!maquinaSelecionada) {
                mostrarFeedbackErro('Configuração da máquina não encontrada');
                return;
            }

            // c. Calcular o número de "jogos" necessários
            const jogos = Math.ceil(metrosInseridos / maquinaSelecionada.baseMetragem);

            // d. Limpar a lista de itens atual
            state.itens = [];

            // e. Iterar sobre a lista INSUMOS_BASE
            INSUMOS_BASE.forEach(insumo => {
                const quantidadeFinal = maquinaSelecionada.pecasPorJogo * jogos;
                
                const item = {
                    id: Date.now() + Math.random(), // ID único
                    descricao: insumo.descricao,
                    quantidade: quantidadeFinal,
                    valor: insumo.valor,
                    total: quantidadeFinal * insumo.valor
                };
                
                state.itens.push(item);
            });

            // f. Cálculo Especial para Endurecedor
            const qtdEndurecedor = Math.ceil(metrosInseridos / ENDURECEDOR_CONFIG.metrosPorLitro);
            
            const itemEndurecedor = {
                id: Date.now() + Math.random() + 1000, // ID único diferente
                descricao: ENDURECEDOR_CONFIG.descricao,
                quantidade: qtdEndurecedor,
                valor: ENDURECEDOR_CONFIG.valor,
                total: qtdEndurecedor * ENDURECEDOR_CONFIG.valor
            };
            
            state.itens.push(itemEndurecedor);

            // g. Chamar os métodos de renderização e salvamento
            calcularTotal();
            atualizarInterface();
            salvarEstado();

            // Feedback de sucesso
            mostrarFeedbackSucesso(`Insumos calculados para ${maquinaSelecionada.nome} - ${metrosInseridos}m² (${jogos} jogo(s))`);

        } catch (error) {
            console.error('Erro ao calcular insumos:', error);
            mostrarFeedbackErro('Erro ao calcular insumos. Tente novamente.');
        }
    }

    /**
     * Remove um item do estado da aplicação
     * @param {number} itemId - ID do item a ser removido
     */
    function removerItemDoEstado(itemId) {
        state.itens = state.itens.filter(item => item.id !== itemId);
        calcularTotal();
        atualizarInterface();
        salvarEstado(); // Salva automaticamente após remover item
    }

    /**
     * Calcula o total do orçamento
     */
    function calcularTotal() {
        state.total = state.itens.reduce((acc, item) => acc + item.total, 0);
    }

    /**
     * Atualiza toda a interface da aplicação
     */
    function atualizarInterface() {
        atualizarTabela();
        atualizarTotalDisplay();
    }

    /**
     * Atualiza a tabela de itens no DOM
     */
    function atualizarTabela() {
        elements.corpoTabela.innerHTML = '';

        state.itens.forEach(item => {
            const linha = criarLinhaTabela(item);
            elements.corpoTabela.appendChild(linha);
        });
    }

    /**
     * Cria uma linha da tabela para um item
     * @param {Object} item - Item para criar a linha
     * @returns {HTMLTableRowElement} Linha da tabela criada
     */
    function criarLinhaTabela(item) {
        const linha = document.createElement('tr');
        
        // Criar células da tabela
        const cellDescricao = document.createElement('td');
        cellDescricao.textContent = item.descricao;
        
        const cellQuantidade = document.createElement('td');
        cellQuantidade.textContent = item.quantidade;
        
        const cellValor = document.createElement('td');
        cellValor.textContent = formatarMoeda(item.valor);
        
        const cellTotal = document.createElement('td');
        cellTotal.textContent = formatarMoeda(item.total);
        
        const cellAcoes = document.createElement('td');
        
        // Criar botão de remover com event listener
        const btnRemover = document.createElement('button');
        btnRemover.type = 'button';
        btnRemover.className = 'btn btn-danger btn-sm';
        btnRemover.textContent = 'Remover';
        
        // Adicionar event listener que chama a função dentro do escopo correto
        btnRemover.addEventListener('click', () => {
            removerItemDoEstado(item.id);
        });
        
        cellAcoes.appendChild(btnRemover);
        
        // Adicionar todas as células à linha
        linha.appendChild(cellDescricao);
        linha.appendChild(cellQuantidade);
        linha.appendChild(cellValor);
        linha.appendChild(cellTotal);
        linha.appendChild(cellAcoes);
        
        return linha;
    }

    /**
     * Atualiza o display do total do orçamento
     */
    function atualizarTotalDisplay() {
        elements.totalOrcamento.textContent = formatarMoeda(state.total);
    }

    /**
     * Formata um valor como moeda brasileira
     * @param {number} valor - Valor a ser formatado
     * @returns {string} Valor formatado como moeda
     */
    function formatarMoeda(valor) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(valor);
    }



    /**
     * Gera o PDF do orçamento
     */
    function gerarPDF() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Dados do cabeçalho
        const cliente = elements.cliente.value.trim();
        const vendedor = elements.vendedor.value.trim();
        const dataFormatada = formatarData(elements.data.value);

        // Configuração do documento
        configurarCabecalhoPDF(doc, cliente, vendedor, dataFormatada);
        
        // Tabela de itens
        const dadosTabela = prepararDadosTabela();
        adicionarTabelaPDF(doc, dadosTabela);

        // Total
        const finalY = doc.autoTable.previous.finalY || 60;
        adicionarTotalPDF(doc, finalY);

        // Salvar arquivo
        const nomeArquivo = `orcamento-${cliente.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(nomeArquivo);
    }

    /**
     * Configura o cabeçalho do PDF
     * @param {jsPDF} doc - Instância do jsPDF
     * @param {string} cliente - Nome do cliente
     * @param {string} vendedor - Nome do vendedor
     * @param {string} data - Data formatada
     */
    function configurarCabecalhoPDF(doc, cliente, vendedor, data) {
        // Logo da empresa (Base64)
        const logoBase64 = 'data:image/png;base64,ZGF0YTppbWFnZS9wbmc7YmFzZTY0LGlWQk9SdzBLR2dvQUFBQU5TVWhFVWdBQUJMQUFBQUdRQ0FZQUFBQ2FKZEdnQUFBQUNYQklXWE1BQUFzVEFBQUxFd0VBbXB3WUFBQUtUMmxEUTFCUWFHOTBiM05vYjNBZ1NVTkRJSEJ5YjJacGJHVUFBSGphblZOblZGUHBGajMzM3ZSQ1M0aUFsRXR2VWhVSUlGSkNpNEFVa1NZcUlRa1FTb2dob2RrVlVjRVJSVVVFRzhpZ2lBT09qb0NNRlZFc0RJb0syQWZrSWFLT2c2T0lpc3I3NFh1amE5YTg5K2JOL3JYWFB1ZXM4NTJ6endmQUNBeVdTRE5STllBTXFVSWVFZUNEeDhURzRlUXVRSUVLSkhBQUVBaXpaQ0Z6L1NNQkFQaCtQRHdySXNBSHZnQUJlTk1MQ0FEQVRadkFNQnlIL3cvcVFwbGNBWUNFQWNCMGtUaExDSUFVQUVCNmprS21BRUJHQVlDZG1DWlRBS0FFQUdETFkyTGpBRkF0QUdBbmYrYlRBSUNkK0psN0FRQmJsQ0VWQWFDUkFDQVRaWWhFQUdnN0FLelBWb3BGQUZnd0FCUm1TOFE1QU5ndEFEQkpWMlpJQUxDM0FNRE9FQXV5QUFnTUFEQlJpSVVwQUFSN0FHRElJeU40QUlTWkFCUkc4bGM4OFN1dUVPY3FBQUI0bWJJOHVTUTVSWUZiQ0MxeEIxZFhMaDRvemtrWEt4UTJZUUpobWtBdXdubVpHVEtCTkEvZzg4d0FBS0NSRlJIZ2cvUDllTTRPcnM3T05vNjJEbDh0NnI4Ry95SmlZdVArNWMrcmNFQUFBT0YwZnRIK0xDK3pHb0E3Qm9CdC9xSWw3Z1JvWGd1Z2RmZUxacklQUUxVQW9PbmFWL053K0g0OFBFV2hrTG5aMmVYazVOaEt4RUpiWWNwWGZmNW53bC9BVi8xcytYNDgvUGYxNEw3aUpJRXlYWUZIQlBqZ3dzejBUS1VjejVJSmhHTGM1bzlIL0xjTC8vd2QweUxFU1dLNVdDb1U0MUVTY1k1RW1venpNcVVpaVVLU0tjVWwwdjlrNHQ4cyt3TSszelVBc0dvK0FYdVJMYWhkWXdQMlN5Y1FXSFRBNHZjQUFQSzdiOEhVS0FnRGdHaUQ0YzkzLys4Ly9VZWdKUUNBWmttU2NRQUFYa1FrTGxUS3N6L0hDQUFBUktDQktyQkJHL1RCR0N6QUJoekJCZHpCQy94Z05vUkNKTVRDUWhCQ0NtU0FISEpnS2F5Q1FpaUd6YkFkS21BdjFFQWROTUJSYUlhVGNBNHV3bFc0RGoxd0QvcGhDSjdCS0x5QkNRUkJ5QWdUWVNIYWlBRmlpbGdqamdnWG1ZWDRJY0ZJQkJLTEpDREppQlJSSWt1Uk5VZ3hVb3BVSUZWSUhmSTljZ0k1aDF4R3VwRTd5QUF5Z3Z5R3ZFY3hsSUd5VVQzVURMVkR1YWczR29SR29ndlFaSFF4bW84V29KdlFjclFhUFl3Mm9lZlFxMmdQMm84K1E4Y3d3T2dZQnpQRWJEQXV4c05Dc1Rnc0NaTmp5N0VpckF5cnhocXdWcXdEdTRuMVk4K3hkd1FTZ1VYQUNUWUVkMElnWVI1QlNGaE1XRTdZU0tnZ0hDUTBFZG9KTndrRGhGSENKeUtUcUV1MEpyb1IrY1FZWWpJeGgxaElMQ1BXRW84VEx4QjdpRVBFTnlRU2lVTXlKN21RQWtteHBGVFNFdEpHMG01U0kra3NxWnMwU0Jvams4bmFaR3V5QnptVUxDQXJ5SVhrbmVURDVEUGtHK1FoOGxzS25XSkFjYVQ0VStJb1VzcHFTaG5sRU9VMDVRWmxtREpCVmFPYVV0Mm9vVlFSTlk5YVFxMmh0bEt2VVllb0V6UjFtam5OZ3haSlM2V3RvcFhUR21nWGFQZHByK2gwdWhIZGxSNU9sOUJYMHN2cFIraVg2QVAwZHd3TmhoV0R4NGhuS0JtYkdBY1laeGwzR0srWVRLWVowNHNaeDFRd056SHJtT2VaRDVsdlZWZ3F0aXA4RlpIS0NwVktsU2FWR3lvdlZLbXFwcXJlcWd0VjgxWExWSStwWGxOOXJrWlZNMVBqcVFuVWxxdFZxcDFRNjFNYlUyZXBPNmlIcW1lb2IxUS9wSDVaL1lrR1djTk13MDlEcEZHZ3NWL2p2TVlnQzJNWnMzZ3NJV3NOcTRaMWdUWEVKckhOMlh4MktydVkvUjI3aXoycXFhRTVRek5LTTFlelV2T1VaajhINDVoeCtKeDBUZ25uS0tlWDgzNkszaFR2S2VJcEc2WTBUTGt4WlZ4cnFwYVhsbGlyU0t0UnEwZnJ2VGF1N2FlZHByMUZ1MW43Z1E1Qngwb25YQ2RIWjQvT0JaM25VOWxUM2FjS3B4Wk5QVHIxcmk2cWE2VWJvYnRFZDc5dXArNllucjVlZ0o1TWI2ZmVlYjNuK2h4OUwvMVUvVzM2cC9WSERGZ0dzd3drQnRzTXpoZzh4VFZ4Ynp3ZEw4ZmI4VkZEWGNOQVE2VmhsV0dYNFNV';
        
        try {
            // Adiciona o logo no canto superior esquerdo
            if (logoBase64 && logoBase64.length > 50) {
                doc.addImage(logoBase64, 'JPEG', 14, 10, 40, 20); // x, y, width, height
            }
        } catch (error) {
            console.warn('Erro ao adicionar logo ao PDF:', error);
        }

        // Título (ajustado para não sobrepor o logo)
        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('ORÇAMENTO', 105, 20, { align: 'center' });

        // Informações da empresa (lado direito, alinhado com o logo)
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text('FINITI DIAMANTADOS', 196, 15, { align: 'right' });
        doc.text('Soluções em Diamantados', 196, 22, { align: 'right' });
        doc.text('contato@finiti.com.br', 196, 29, { align: 'right' });

        // Informações do cliente (movidas para baixo)
        doc.setFontSize(12);
        doc.setFont(undefined, 'normal');
        doc.text(`Cliente: ${cliente}`, 14, 45);
        doc.text(`Vendedor: ${vendedor}`, 14, 52);
        doc.text(`Data: ${data}`, 14, 59);
        
        // Linha separadora (ajustada)
        doc.line(14, 65, 196, 65);
    }

    /**
     * Prepara os dados da tabela para o PDF
     * @returns {Array} Dados formatados para a tabela
     */
    function prepararDadosTabela() {
        return {
            head: [['Descrição', 'Qtd', 'Valor Unit.', 'Total']],
            body: state.itens.map(item => [
                item.descricao,
                item.quantidade.toString(),
                formatarMoeda(item.valor),
                formatarMoeda(item.total)
            ])
        };
    }

    /**
     * Adiciona a tabela de itens ao PDF
     * @param {jsPDF} doc - Instância do jsPDF
     * @param {Object} dadosTabela - Dados da tabela
     */
    function adicionarTabelaPDF(doc, dadosTabela) {
        doc.autoTable({
            startY: 65, // Ajustado para acomodar o novo layout com logo
            head: dadosTabela.head,
            body: dadosTabela.body,
            theme: 'striped',
            headStyles: {
                fillColor: [37, 58, 94], // Cor azul escuro da marca (#253A5E)
                textColor: 255,
                fontStyle: 'bold'
            },
            styles: {
                fontSize: 10,
                cellPadding: 5
            },
            columnStyles: {
                1: { halign: 'center' },
                2: { halign: 'right' },
                3: { halign: 'right' }
            }
        });
    }

    /**
     * Adiciona o total ao PDF
     * @param {jsPDF} doc - Instância do jsPDF
     * @param {number} finalY - Posição Y final da tabela
     */
    function adicionarTotalPDF(doc, finalY) {
        doc.setFontSize(14);
        doc.setFont(undefined, 'bold');
        doc.text(`Total do Orçamento: ${formatarMoeda(state.total)}`, 14, finalY + 15);
    }

    /**
     * Formata uma data para exibição
     * @param {string} dataISO - Data no formato ISO
     * @returns {string} Data formatada
     */
    function formatarData(dataISO) {
        return new Date(dataISO + 'T00:00:00').toLocaleDateString('pt-BR');
    }

    /**
     * Mostra feedback de sucesso para o usuário
     * @param {string} mensagem - Mensagem de sucesso
     */
    function mostrarFeedbackSucesso(mensagem = 'Item adicionado com sucesso!') {
        // Implementação simples com alert - pode ser substituída por toast/modal
        // console.log('✅ Sucesso:', mensagem);
    }

    /**
     * Mostra feedback de erro para o usuário
     * @param {string} mensagem - Mensagem de erro
     */
    function mostrarFeedbackErro(mensagem) {
        alert('❌ Erro: ' + mensagem);
        console.error('Erro:', mensagem);
    }

    /**
     * Obtém o estado atual da aplicação (para debug)
     * @returns {Object} Estado atual
     */
    function obterEstado() {
        return { ...state };
    }

    /**
     * Limpa todos os dados da aplicação
     */
    function limparTudo() {
        if (confirm('Tem certeza que deseja limpar todos os dados?')) {
            state.itens = [];
            state.total = 0;
            elements.cliente.value = '';
            elements.vendedor.value = '';
            elements.maquinaSelector.value = '';
            elements.metrosQuadrados.value = '';
            setDefaultDate();
            limparLocalStorage();
            atualizarInterface();
            mostrarFeedbackSucesso('Dados limpos com sucesso!');
        }
    }

    // API pública do módulo
    return {
        init,
        removerItem: removerItemDoEstado,
        obterEstado,
        limparTudo
    };
})();

// Inicialização da aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    OrcamentoApp.init();
});

// Aplicação focada na calculadora - funções de adição manual removidas