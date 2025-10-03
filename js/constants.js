// js/constants.js

/**
 * Configuração das máquinas disponíveis, incluindo o número de peças por jogo
 * e o rendimento base em metros quadrados para esse jogo.
 */
const MAQUINAS_CONFIG = [
    { id: "fp3", nome: "FP3 (3 peças/jogo)", pecasPorJogo: 3, baseMetragem: 500 },
    { id: "fp6", nome: "FP6 (6 peças/jogo)", pecasPorJogo: 6, baseMetragem: 1000 },
    { id: "fp9", nome: "FP9 (9 peças/jogo)", pecasPorJogo: 9, baseMetragem: 1500 }
];

/**
 * Lista de insumos metálicos cujo gasto é afetado pela qualidade do piso.
 * A quantidade será multiplicada pelo "fator de desgaste".
 */
const INSUMOS_METALICOS = [
    { sku: '4.10.010.083', descricao: "INSERTO METALICO DIAMANTADO 36 AR SUPER", valor: 159.00 },
    { sku: 'custom-1', descricao: "INSERTO METALICO DIAMANTADO 60", valor: 159.00 },
    { sku: 'custom-2', descricao: "INSERTO METALICO DIAMANTADO 120", valor: 159.00 },
];

/**
 * Lista de insumos resinados cujo gasto NÃO é afetado pela qualidade do piso.
 * A quantidade será sempre baseada no cálculo padrão.
 */
const INSUMOS_RESINADOS = [
    { sku: '4.10.010.053', descricao: "LIXA DIAMANTADA FLEXIVEL (RESINADO) GR 50", valor: 27.00 },
    { sku: '4.10.010.054', descricao: "LIXA DIAMANTADA FLEXIVEL (RESINADO) GR 100", valor: 27.00 },
    { sku: '4.10.010.055', descricao: "LIXA DIAMANTADA FLEXIVEL (RESINADO) GR 200", valor: 27.00 },
    { sku: '4.10.010.056', descricao: "LIXA DIAMANTADA FLEXIVEL (RESINADO) GR 400", valor: 27.00 },
    { sku: '4.10.010.057', descricao: "LIXA DIAMANTADA FLEXIVEL (RESINADO) GR 800", valor: 27.00 },
    { sku: '4.10.010.058', descricao: "LIXA DIAMANTADA FLEXIVEL (RESINADO) GR 1500", valor: 27.00 },
];

/**
 * Regra de cálculo específica para o endurecedor, baseada em rendimento por litro.
 */
const ENDURECEDOR_CONFIG = {
    sku: '7.26.800.009',
    descricao: "ENDURECEDOR DE SUPERFICIE 1L",
    valor: 26.00,
    metrosPorLitro: 40
};
