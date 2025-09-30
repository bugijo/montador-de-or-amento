/**
 * Constantes e configurações da aplicação
 */

// Configurações das máquinas disponíveis
const MAQUINAS_CONFIG = [
    { id: "fp3", nome: "FP3", pecasPorJogo: 3, baseMetragem: 500 },
    { id: "fp6", nome: "FP6", pecasPorJogo: 6, baseMetragem: 1000 },
    { id: "fp9", nome: "FP9", pecasPorJogo: 9, baseMetragem: 1500 }
];

// Insumos base disponíveis
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
];

// Configuração do endurecedor
const ENDURECEDOR_CONFIG = {
    sku: '7.26.800.009',
    descricao: "ENDURECEDOR DE SUPERFICIE 1L",
    valor: 26.00,
    metrosPorLitro: 40
};