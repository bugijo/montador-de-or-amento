// js/OrcamentoApp.js

class OrcamentoApp {
    constructor() {
        this.state = {
            itens: [],
            totalGeral: 0,
        };
        this.pdfGenerator = new PDFGenerator();
        this.cacheElements();
        this.bindEvents();
        this.carregarMaquinas();
        this.carregarEstado();
        this.configurarDataAtual();
    }

    cacheElements() {
        this.elements = {
            inputCliente: document.getElementById('cliente'),
            inputData: document.getElementById('data'),
            selectMaquina: document.getElementById('maquina-selector'),
            inputMetros: document.getElementById('metros-quadrados'),
            qualidadePisoRadios: document.querySelectorAll('input[name="qualidade-piso"]'),
            btnCalcular: document.getElementById('btn-calcular-insumos'),
            tabelaCorpo: document.querySelector('#tabela-itens tbody'),
            totalOrcamento: document.getElementById('total-orcamento'),
            btnGerarPDF: document.getElementById('btn-gerar-pdf'),
            btnLimparTudo: document.getElementById('btn-limpar')
        };
    }

    bindEvents() {
        if (this.elements.btnCalcular) {
            this.elements.btnCalcular.addEventListener('click', this.calcularEPreencherOrcamento.bind(this));
        } else {
            console.error('Elemento btnCalcular não encontrado!');
        }
        
        if (this.elements.btnGerarPDF) {
            this.elements.btnGerarPDF.addEventListener('click', this.handleGerarPDF.bind(this));
        } else {
            console.error('Elemento btnGerarPDF não encontrado!');
        }
        
        if (this.elements.btnLimparTudo) {
            this.elements.btnLimparTudo.addEventListener('click', this.limparTudo.bind(this));
        } else {
            console.error('Elemento btnLimparTudo não encontrado!');
        }
    }

    carregarMaquinas() {
        const selector = this.elements.selectMaquina;
        
        if (!selector) {
            console.error('Elemento maquina-selector não encontrado!');
            return;
        }
        
        // Limpa opções existentes
        selector.innerHTML = '<option value="">-- Selecione uma máquina --</option>';
        
        // Adiciona cada máquina como opção
        MAQUINAS_CONFIG.forEach(maquina => {
            const option = document.createElement('option');
            option.value = maquina.id;
            option.textContent = `${maquina.nome} (${maquina.pecasPorJogo} peças/jogo)`;
            selector.appendChild(option);
        });
        
        console.log('Máquinas carregadas:', MAQUINAS_CONFIG.length);
    }

    configurarDataAtual() {
        if (this.elements.inputData) {
            const hoje = new Date();
            const dataFormatada = hoje.toISOString().split('T')[0]; // Formato YYYY-MM-DD
            this.elements.inputData.value = dataFormatada;
        }
    }

    calcularEPreencherOrcamento() {
        // Validação de Entradas
        const maquinaId = this.elements.selectMaquina.value;
        const metrosInseridos = parseFloat(this.elements.inputMetros.value);
        const qualidadeInput = document.querySelector('input[name="qualidade-piso"]:checked');

        if (!maquinaId) {
            alert('Por favor, selecione uma máquina.');
            return;
        }
        if (isNaN(metrosInseridos) || metrosInseridos <= 0) {
            alert('Por favor, insira uma metragem quadrada válida.');
            return;
        }
        if (!qualidadeInput) {
            alert('Por favor, selecione uma qualidade para o piso.');
            return;
        }

        const maquinaSelecionada = MAQUINAS_CONFIG.find(m => m.id === maquinaId);
        const qualidadeValor = parseInt(qualidadeInput.value, 10);

        // Lógica do Multiplicador
        let multiplicadorDesgaste = 1;
        if (qualidadeValor <= 5) {
            multiplicadorDesgaste = 3;
        } else if (qualidadeValor >= 6 && qualidadeValor <= 8) {
            multiplicadorDesgaste = 2;
        }
        
        // Limpa a lista atual
        this.state.itens = [];

        // Calcula jogos para insumos que usam multiplicador (metálicos)
        const jogosMetalicos = Math.ceil(metrosInseridos / maquinaSelecionada.baseMetragem) * multiplicadorDesgaste;
        INSUMOS_METALICOS.forEach(insumo => {
            const quantidade = maquinaSelecionada.pecasPorJogo * jogosMetalicos;
            this.adicionarItemAoEstado(insumo, quantidade);
        });

        // Calcula jogos para insumos que NÃO usam multiplicador (resinados)
        const jogosResinados = Math.ceil(metrosInseridos / maquinaSelecionada.baseMetragem); // Sempre multiplicador 1
        INSUMOS_RESINADOS.forEach(insumo => {
            const quantidade = maquinaSelecionada.pecasPorJogo * jogosResinados;
            this.adicionarItemAoEstado(insumo, quantidade);
        });

        // Cálculo Especial para Endurecedor
        const qtdEndurecedor = Math.ceil(metrosInseridos / ENDURECEDOR_CONFIG.metrosPorLitro);
        this.adicionarItemAoEstado(ENDURECEDOR_CONFIG, qtdEndurecedor);

        this.atualizarInterface();
        this.salvarEstado();
    }

    adicionarItemAoEstado(insumo, quantidade) {
        const novoItem = {
            id: `${insumo.sku}-${Date.now()}`,
            sku: insumo.sku,
            descricao: insumo.descricao,
            quantidade: quantidade,
            valor: insumo.valor,
            total: quantidade * insumo.valor,
        };
        this.state.itens.push(novoItem);
    }
    
    removerItemDoEstado(itemId) {
        this.state.itens = this.state.itens.filter(item => item.id !== itemId);
        this.atualizarInterface();
        this.salvarEstado();
    }

    atualizarInterface() {
        this.renderizarTabela();
        this.atualizarTotal();
    }

    renderizarTabela() {
        this.elements.tabelaCorpo.innerHTML = '';
        if (this.state.itens.length === 0) {
            this.elements.tabelaCorpo.innerHTML = `<tr><td colspan="5" class="text-center">Nenhum item adicionado</td></tr>`;
            return;
        }
        this.state.itens.forEach(item => {
            this.elements.tabelaCorpo.appendChild(this.criarLinhaTabela(item));
        });
    }

    criarLinhaTabela(item) {
        const linha = document.createElement('tr');
        linha.innerHTML = `
            <td>${item.sku}</td>
            <td>${item.descricao}</td>
            <td>${item.quantidade}</td>
            <td>${this.pdfGenerator.formatarMoeda(item.valor)}</td>
            <td>${this.pdfGenerator.formatarMoeda(item.total)}</td>
        `;

        const acoesCell = document.createElement('td');
        const btnRemover = document.createElement('button');
        btnRemover.className = 'btn btn-danger btn-sm';
        btnRemover.innerHTML = '&times;';
        btnRemover.addEventListener('click', () => this.removerItemDoEstado(item.id));
        acoesCell.appendChild(btnRemover);
        linha.appendChild(acoesCell);

        return linha;
    }

    atualizarTotal() {
        this.state.totalGeral = this.state.itens.reduce((acc, item) => acc + item.total, 0);
        this.elements.totalOrcamento.innerText = this.pdfGenerator.formatarMoeda(this.state.totalGeral);
    }
    
    limparTudo() {
        if (confirm('Tem certeza que deseja limpar todo o orçamento?')) {
            this.state.itens = [];
            this.state.totalGeral = 0;
            this.elements.inputCliente.value = '';
            this.elements.inputVendedor.value = '';
            this.elements.inputMetros.value = '';
            localStorage.removeItem('orcamento_atual');
            this.atualizarInterface();
        }
    }

    salvarEstado() {
        try {
            const estadoParaSalvar = {
                cliente: this.elements.inputCliente.value,
                vendedor: this.elements.inputVendedor.value,
                data: this.elements.inputData.value,
                itens: this.state.itens,
            };
            localStorage.setItem('orcamento_atual', JSON.stringify(estadoParaSalvar));
        } catch (error) {
            console.error("Erro ao salvar estado no Local Storage:", error);
        }
    }

    carregarEstado() {
        try {
            const estadoSalvo = localStorage.getItem('orcamento_atual');
            if (estadoSalvo) {
                const dados = JSON.parse(estadoSalvo);
                this.elements.inputCliente.value = dados.cliente || '';
                this.elements.inputVendedor.value = dados.vendedor || '';
                this.elements.inputData.value = dados.data || new Date().toISOString().split('T')[0];
                this.state.itens = dados.itens || [];
                this.atualizarInterface();
            } else {
                this.elements.inputData.value = new Date().toISOString().split('T')[0];
            }
        } catch (error) {
            console.warn("Local Storage limpo devido a dados corrompidos.", error);
            localStorage.removeItem('orcamento_atual');
        }
    }

    handleGerarPDF() {
        if (this.state.itens.length === 0) {
            alert('Não é possível gerar um PDF de um orçamento vazio.');
            return;
        }
        
        const dadosOrcamento = {
            cliente: this.elements.inputCliente.value,
            data: this.elements.inputData.value,
            medidaBase: this.elements.inputMetros.value,
            itens: this.state.itens,
            totalGeral: this.state.totalGeral,
        };

        try {
            this.pdfGenerator.gerarPDF(dadosOrcamento);
        } catch (error) {
            console.error("Erro ao chamar gerarPDF:", error);
            alert('Erro ao gerar PDF. Verifique o console para mais detalhes.');
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new OrcamentoApp();
});