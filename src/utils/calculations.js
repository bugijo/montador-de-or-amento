'use strict';

/**
 * Utilitários para cálculos comuns
 * Centraliza lógicas de cálculo para evitar duplicação
 */

/**
 * Calcula o valor total de um item com desconto
 * @param {number} precoUnitario - Preço unitário do item
 * @param {number} quantidade - Quantidade do item
 * @param {number} descontoValor - Valor do desconto por unidade
 * @returns {number} Valor total calculado
 */
const calcularTotalItem = (precoUnitario, quantidade, descontoValor = 0) => {
  const precoComDesconto = precoUnitario - descontoValor;
  return precoComDesconto * quantidade;
};

/**
 * Calcula o valor total de uma lista de itens
 * @param {Array} itens - Array de itens com propriedades preco_total ou total
 * @returns {number} Valor total da lista
 */
const calcularTotalLista = (itens) => {
  return itens.reduce((acc, item) => {
    const valor = item.preco_total || item.total || 0;
    return acc + parseFloat(valor);
  }, 0);
};

/**
 * Calcula percentual de desconto
 * @param {number} valorOriginal - Valor original
 * @param {number} valorComDesconto - Valor com desconto aplicado
 * @returns {number} Percentual de desconto (0-100)
 */
const calcularPercentualDesconto = (valorOriginal, valorComDesconto) => {
  if (valorOriginal === 0) return 0;
  return ((valorOriginal - valorComDesconto) / valorOriginal) * 100;
};

/**
 * Aplica desconto percentual a um valor
 * @param {number} valor - Valor original
 * @param {number} percentual - Percentual de desconto (0-100)
 * @returns {number} Valor com desconto aplicado
 */
const aplicarDescontoPercentual = (valor, percentual) => {
  return valor * (1 - percentual / 100);
};

/**
 * Calcula margem de lucro
 * @param {number} precoVenda - Preço de venda
 * @param {number} precoCusto - Preço de custo
 * @returns {number} Margem de lucro em percentual
 */
const calcularMargemLucro = (precoVenda, precoCusto) => {
  if (precoCusto === 0) return 0;
  return ((precoVenda - precoCusto) / precoCusto) * 100;
};

/**
 * Calcula markup sobre o custo
 * @param {number} precoCusto - Preço de custo
 * @param {number} margemDesejada - Margem desejada em percentual
 * @returns {number} Preço de venda calculado
 */
const calcularPrecoComMarkup = (precoCusto, margemDesejada) => {
  return precoCusto * (1 + margemDesejada / 100);
};

/**
 * Arredonda valor para duas casas decimais
 * @param {number} valor - Valor a ser arredondado
 * @returns {number} Valor arredondado
 */
const arredondarValor = (valor) => {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
};

/**
 * Calcula média de uma lista de valores
 * @param {Array} valores - Array de números
 * @returns {number} Média calculada
 */
const calcularMedia = (valores) => {
  if (!valores || valores.length === 0) return 0;
  const soma = valores.reduce((acc, valor) => acc + parseFloat(valor || 0), 0);
  return soma / valores.length;
};

/**
 * Calcula taxa de conversão
 * @param {number} conversoes - Número de conversões
 * @param {number} total - Total de oportunidades
 * @returns {number} Taxa de conversão em percentual
 */
const calcularTaxaConversao = (conversoes, total) => {
  if (total === 0) return 0;
  return (conversoes / total) * 100;
};

/**
 * Calcula valor proporcional baseado em uma regra de três
 * @param {number} valor1 - Primeiro valor conhecido
 * @param {number} valor2 - Segundo valor conhecido
 * @param {number} valor3 - Terceiro valor conhecido
 * @returns {number} Quarto valor calculado (valor1 está para valor2 assim como valor3 está para X)
 */
const calcularRegraDeTres = (valor1, valor2, valor3) => {
  if (valor1 === 0) return 0;
  return (valor2 * valor3) / valor1;
};

/**
 * Calcula juros simples
 * @param {number} capital - Capital inicial
 * @param {number} taxa - Taxa de juros (em percentual)
 * @param {number} tempo - Tempo em períodos
 * @returns {Object} Objeto com juros e montante
 */
const calcularJurosSimples = (capital, taxa, tempo) => {
  const juros = capital * (taxa / 100) * tempo;
  const montante = capital + juros;
  
  return {
    juros: arredondarValor(juros),
    montante: arredondarValor(montante)
  };
};

/**
 * Calcula diferença percentual entre dois valores
 * @param {number} valorAnterior - Valor anterior
 * @param {number} valorAtual - Valor atual
 * @returns {number} Diferença percentual (positiva = crescimento, negativa = decréscimo)
 */
const calcularDiferencaPercentual = (valorAnterior, valorAtual) => {
  if (valorAnterior === 0) return valorAtual > 0 ? 100 : 0;
  return ((valorAtual - valorAnterior) / valorAnterior) * 100;
};

/**
 * Valida se um número está dentro de um intervalo
 * @param {number} valor - Valor a ser validado
 * @param {number} minimo - Valor mínimo
 * @param {number} maximo - Valor máximo
 * @returns {boolean} True se estiver no intervalo
 */
const validarIntervalo = (valor, minimo, maximo) => {
  return valor >= minimo && valor <= maximo;
};

module.exports = {
  calcularTotalItem,
  calcularTotalLista,
  calcularPercentualDesconto,
  aplicarDescontoPercentual,
  calcularMargemLucro,
  calcularPrecoComMarkup,
  arredondarValor,
  calcularMedia,
  calcularTaxaConversao,
  calcularRegraDeTres,
  calcularJurosSimples,
  calcularDiferencaPercentual,
  validarIntervalo
};