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

        // Instância do gerador de PDF
        this.pdfGenerator = new PDFGenerator();

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
     */
    carregarEstado() {
        try {
            const estadoSalvo = localStorage.getItem(this.STORAGE_KEY);
            if (estadoSalvo) {
                const dados = JSON.parse(estadoSalvo);
                
                // Restaura dados do cliente
                if (dados.cliente) {
                    this.elements.cliente.value = dados.cliente;
                }
                
                if (dados.data) {
                    this.elements.data.value = dados.data;
                }
                
                // Restaura itens do orçamento
                if (dados.itens && Array.isArray(dados.itens)) {
                    this.state.itens = dados.itens;
                    this.atualizarInterface();
                }
            }
        } catch (error) {
            console.error('Erro ao carregar estado:', error);
            this.limparLocalStorage();
        }
    }

    /**
     * Limpa dados corrompidos do Local Storage
     */
    limparLocalStorage() {
        try {
            localStorage.removeItem(this.STORAGE_KEY);
            console.log('Local Storage limpo devido a dados corrompidos');
        } catch (error) {
            console.error('Erro ao limpar Local Storage:', error);
        }
    }

    /**
     * Manipula o evento de gerar PDF
     * Delega para a classe PDFGenerator
     */
    handleGerarPDF() {
        try {
            // Validações básicas
            if (!this.elements.cliente.value.trim()) {
                this.mostrarFeedbackErro('Por favor, preencha o nome do cliente');
                this.elements.cliente.focus();
                return;
            }

            if (this.state.itens.length === 0) {
                this.mostrarFeedbackErro('Adicione pelo menos um item ao orçamento');
                return;
            }

            // Dados para o PDF - estrutura correta para a função gerarPDF
            const dadosPDF = {
                nomeCliente: this.elements.cliente.value.trim(),
                data: this.elements.data.value,
                medidaBase: parseFloat(this.elements.metrosQuadrados.value) || 0,
                itens: this.state.itens,
                total: this.state.total
            };

            // Gera o PDF usando a classe PDFGenerator
            this.pdfGenerator.gerarPDF(dadosPDF);

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            this.mostrarFeedbackErro('Erro ao gerar PDF. Tente novamente.');
        }
    }

    /**
     * Calcula e preenche o orçamento baseado na máquina e metragem selecionadas
     */
    calcularEPreencherOrcamento() {
        try {
            const qualidadeInput = document.querySelector('input[name="qualidade-piso"]:checked');
            if (!qualidadeInput) {
                alert('Por favor, selecione uma qualidade para o piso.');
                return;
            }
            const qualidadeValor = parseInt(qualidadeInput.value, 10);

            let multiplicadorDesgaste = 1;
            if (qualidadeValor <= 5) {
                multiplicadorDesgaste = 3;
            } else if (qualidadeValor >= 6 && qualidadeValor <= 8) {
                multiplicadorDesgaste = 2;
            }

            const maquinaId = this.elements.maquinaSelector.value;
            const metrosQuadrados = parseFloat(this.elements.metrosQuadrados.value);

            // Validações
            if (!maquinaId) {
                this.mostrarFeedbackErro('Por favor, selecione uma máquina');
                this.elements.maquinaSelector.focus();
                return;
            }

            if (!this.validarMetrosQuadrados(metrosQuadrados)) {
                return; // validarMetrosQuadrados já mostra o erro
            }

            // Encontra a configuração da máquina
            const configMaquina = MAQUINAS_CONFIG.find(m => m.id === maquinaId);
            if (!configMaquina) {
                this.mostrarFeedbackErro('Configuração da máquina não encontrada');
                return;
            }

            // Calcula os insumos necessários
            const insumos = this.calcularInsumos(configMaquina, metrosQuadrados, multiplicadorDesgaste);

            // Adiciona cada insumo ao orçamento
            insumos.forEach(insumo => {
                this.adicionarItem(insumo.sku, insumo.descricao, insumo.quantidade, insumo.valor);
            });

            // Feedback de sucesso
            this.mostrarFeedbackSucesso(`Insumos calculados para ${metrosQuadrados}m² com ${configMaquina.nome}`);

            // Limpa os campos da calculadora
            this.elements.maquinaSelector.value = '';
            this.elements.metrosQuadrados.value = '';

        } catch (error) {
            console.error('Erro ao calcular insumos:', error);
            this.mostrarFeedbackErro('Erro ao calcular insumos. Verifique os dados e tente novamente.');
        }
    }

    /**
     * Calcula a quantidade de insumos necessários baseado na máquina e metragem
     * @param {Object} configMaquina - Configuração da máquina selecionada
     * @param {number} metrosQuadrados - Metragem a ser processada
     * @returns {Array} Array com os insumos calculados
     */
    calcularInsumos(configMaquina, metrosQuadrados, multiplicadorDesgaste = 1) {
        const insumos = [];

        // Calcula quantos jogos de insertes são necessários
        const jogosNecessarios = Math.ceil(metrosQuadrados / configMaquina.baseMetragem);

        // Adiciona insertes baseado no número de peças por jogo COM multiplicador
        INSUMOS_BASE.slice(0, 3).forEach(inserto => { // Primeiros 3 são os insertes
            const quantidadePorJogo = configMaquina.pecasPorJogo;
            const quantidadeTotal = jogosNecessarios * quantidadePorJogo * multiplicadorDesgaste;
            
            insumos.push({
                sku: inserto.sku,
                descricao: inserto.descricao,
                quantidade: quantidadeTotal,
                valor: inserto.valor
            });
        });

        // Adiciona lixas (sempre 1 de cada tipo por jogo)
        INSUMOS_BASE.slice(3).forEach(lixa => { // Do índice 3 em diante são as lixas
            insumos.push({
                sku: lixa.sku,
                descricao: lixa.descricao,
                quantidade: jogosNecessarios,
                valor: lixa.valor
            });
        });

        // Adiciona endurecedor baseado na metragem
        const litrosEndurecedor = Math.ceil(metrosQuadrados / ENDURECEDOR_CONFIG.metrosPorLitro);
        insumos.push({
            sku: ENDURECEDOR_CONFIG.sku,
            descricao: ENDURECEDOR_CONFIG.descricao,
            quantidade: litrosEndurecedor,
            valor: ENDURECEDOR_CONFIG.valor
        });

        return insumos;
    }

    /**
     * Adiciona um item ao orçamento
     * @param {string} sku - Código do produto
     * @param {string} descricao - Descrição do produto
     * @param {number} quantidade - Quantidade do produto
     * @param {number} valor - Valor unitário do produto
     */
    adicionarItem(sku, descricao, quantidade, valor) {
        const novoItem = {
            id: Date.now() + Math.random(), // ID único
            sku,
            descricao,
            quantidade,
            valor,
            total: quantidade * valor
        };

        this.state.itens.push(novoItem);
        this.calcularTotal();
        this.atualizarInterface();
        this.salvarEstado();
    }

    /**
     * Remove um item do estado
     * @param {string|number} itemId - ID do item a ser removido
     */
    removerItemDoEstado(itemId) {
        const index = this.state.itens.findIndex(item => item.id == itemId);
        if (index !== -1) {
            this.state.itens.splice(index, 1);
            this.calcularTotal();
            this.atualizarInterface();
            this.salvarEstado();
        }
    }

    /**
     * Calcula o total do orçamento
     */
    calcularTotal() {
        this.state.total = this.state.itens.reduce((total, item) => total + item.total, 0);
    }

    /**
     * Atualiza a interface com os dados atuais
     */
    atualizarInterface() {
        this.renderizarTabela();
        this.atualizarTotal();
    }

    /**
     * Renderiza a tabela de itens
     */
    renderizarTabela() {
        const tbody = this.elements.corpoTabela;
        tbody.innerHTML = '';

        if (this.state.itens.length === 0) {
            const tr = document.createElement('tr');
            tr.innerHTML = '<td colspan="6" style="text-align: center; color: #666;">Nenhum item adicionado</td>';
            tbody.appendChild(tr);
            return;
        }

        this.state.itens.forEach(item => {
            const tr = this.criarLinhaTabela(item);
            tbody.appendChild(tr);
        });
    }

    /**
     * Atualiza apenas a tabela (usado para otimização)
     */
    atualizarTabela() {
        this.renderizarTabela();
    }

    /**
     * Cria uma linha da tabela para um item
     * @param {Object} item - Item do orçamento
     * @returns {HTMLElement} Elemento tr da tabela
     */
    criarLinhaTabela(item) {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${item.sku}</td>
            <td>${item.descricao}</td>
            <td style="text-align: center;">${item.quantidade}</td>
            <td style="text-align: right;">R$ ${item.valor.toFixed(2)}</td>
            <td style="text-align: right;">R$ ${item.total.toFixed(2)}</td>
            <td style="text-align: center;">
                <button 
                    onclick="app.removerItem('${item.id}')" 
                    class="btn-remover"
                    title="Remover item"
                    style="
                        background: #dc3545;
                        color: white;
                        border: none;
                        padding: 4px 8px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 12px;
                    "
                >
                    ✕
                </button>
            </td>
        `;
        return tr;
    }

    /**
     * Atualiza o display do total
     */
    atualizarTotal() {
        this.elements.totalOrcamento.textContent = `R$ ${this.state.total.toFixed(2)}`;
    }

    /**
     * Salva o estado atual no Local Storage
     */
    salvarEstado() {
        try {
            const estado = {
                cliente: this.elements.cliente.value,
                data: this.elements.data.value,
                itens: this.state.itens,
                timestamp: new Date().toISOString()
            };

            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(estado));
        } catch (error) {
            console.error('Erro ao salvar estado:', error);
            // Em caso de erro (ex: storage cheio), tenta limpar e salvar novamente
            try {
                this.limparLocalStorage();
                localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
                    itens: this.state.itens,
                    timestamp: new Date().toISOString()
                }));
            } catch (secondError) {
                console.error('Erro crítico ao salvar estado:', secondError);
            }
        }
    }

    /**
     * Retorna o estado atual da aplicação
     * @returns {Object} Estado atual
     */
    obterEstado() {
        return {
            cliente: this.elements.cliente.value,
            data: this.elements.data.value,
            itens: [...this.state.itens], // Cópia dos itens
            total: this.state.total
        };
    }

    /**
     * Limpa todos os dados do orçamento
     */
    limparTudo() {
        if (this.state.itens.length > 0) {
            const confirmacao = confirm('Tem certeza que deseja limpar todos os dados do orçamento?');
            if (!confirmacao) return;
        }

        // Limpa o estado
        this.state.itens = [];
        this.state.total = 0;

        // Limpa os campos do formulário
        this.elements.cliente.value = '';
        this.setDefaultDate(); // Redefine para a data atual

        // Limpa campos da calculadora
        this.elements.maquinaSelector.value = '';
        this.elements.metrosQuadrados.value = '';

        // Atualiza a interface
        this.atualizarInterface();

        // Remove do Local Storage
        this.limparLocalStorage();

        this.mostrarFeedbackSucesso('Orçamento limpo com sucesso');
    }

    /**
     * Remove um item específico do orçamento
     * @param {string|number} itemId - ID do item a ser removido
     */
    removerItem(itemId) {
        this.removerItemDoEstado(itemId);
        this.mostrarFeedbackSucesso('Item removido com sucesso');
    }

    /**
     * Mostra loading em um botão
     * @param {HTMLElement} botao - Elemento do botão
     * @param {string} textoLoading - Texto a ser exibido durante o loading
     */
    mostrarLoadingBotao(botao, textoLoading = 'Processando...') {
        if (!botao) return;
        
        botao.disabled = true;
        botao.dataset.textoOriginal = botao.textContent;
        botao.textContent = textoLoading;
        botao.style.opacity = '0.7';
        botao.style.cursor = 'not-allowed';
    }

    /**
     * Remove loading de um botão
     * @param {HTMLElement} botao - Elemento do botão
     */
    removerLoadingBotao(botao) {
        if (!botao) return;
        
        botao.disabled = false;
        botao.textContent = botao.dataset.textoOriginal || botao.textContent;
        botao.style.opacity = '1';
        botao.style.cursor = 'pointer';
        delete botao.dataset.textoOriginal;
    }

    /**
     * Valida o valor de metros quadrados
     * @param {number} valor - Valor a ser validado
     * @returns {boolean} True se válido, false caso contrário
     */
    validarMetrosQuadrados(valor) {
        const campo = this.elements.metrosQuadrados;
        
        // Remove mensagens de erro anteriores
        this.removerErroNoCampo(campo);
        
        if (isNaN(valor) || valor <= 0) {
            this.mostrarErroNoCampo(campo, 'Por favor, insira um valor válido para metros quadrados');
            return false;
        }
        
        if (valor > 10000) {
            this.mostrarErroNoCampo(campo, 'Valor muito alto. Máximo permitido: 10.000 m²');
            return false;
        }
        
        return true;
    }

    /**
     * Mostra erro em um campo específico
     * @param {HTMLElement} campo - Campo que contém o erro
     * @param {string} mensagem - Mensagem de erro
     */
    mostrarErroNoCampo(campo, mensagem) {
        if (!campo) return;
        
        // Remove erro anterior se existir
        this.removerErroNoCampo(campo);
        
        // Adiciona classe de erro ao campo
        campo.classList.add('campo-erro');
        
        // Cria elemento de mensagem de erro
        const mensagemErro = document.createElement('div');
        mensagemErro.className = 'mensagem-erro';
        mensagemErro.textContent = mensagem;
        mensagemErro.style.cssText = `
            color: #dc3545;
            font-size: 12px;
            margin-top: 4px;
            display: block;
        `;
        
        // Insere a mensagem após o campo
        campo.parentNode.insertBefore(mensagemErro, campo.nextSibling);
        
        // Foca no campo com erro
        campo.focus();
        
        // Mostra feedback de erro
        this.mostrarFeedbackErro(mensagem);
    }

    /**
     * Remove erro de um campo específico
     * @param {HTMLElement} campo - Campo do qual remover o erro
     */
    removerErroNoCampo(campo) {
        if (!campo) return;
        
        // Remove classe de erro
        campo.classList.remove('campo-erro');
        
        // Remove mensagem de erro se existir
        const mensagemErro = campo.parentNode.querySelector('.mensagem-erro');
        if (mensagemErro) {
            mensagemErro.remove();
        }
    }
}