'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Inserir produtos de exemplo
    await queryInterface.bulkInsert('produtos', [
      // Máquinas
      {
        nome: 'Máquina de Corte Industrial MCI-2000',
        descricao: 'Máquina de corte industrial de alta precisão para materiais diversos',
        tipo: 'Máquina',
        preco_base: 15000.00,
        unidade_medida: 'unidade',
        ativo: true,
        codigo_interno: 'MCI-2000',
        categoria: 'Corte Industrial',
        peso: 250.500,
        dimensoes: JSON.stringify({
          largura: 120,
          altura: 80,
          profundidade: 60
        }),
        especificacoes_tecnicas: JSON.stringify({
          potencia: '5HP',
          voltagem: '220V',
          frequencia: '60Hz',
          capacidade_corte: '50mm'
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nome: 'Máquina de Solda Automática MSA-1500',
        descricao: 'Máquina de solda automática com controle digital',
        tipo: 'Máquina',
        preco_base: 12000.00,
        unidade_medida: 'unidade',
        ativo: true,
        codigo_interno: 'MSA-1500',
        categoria: 'Solda',
        peso: 180.750,
        dimensoes: JSON.stringify({
          largura: 100,
          altura: 70,
          profundidade: 50
        }),
        especificacoes_tecnicas: JSON.stringify({
          potencia: '3HP',
          voltagem: '220V',
          frequencia: '60Hz',
          tipo_solda: 'MIG/MAG'
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      // Acessórios
      {
        nome: 'Lâmina de Corte Diamantada LCD-100',
        descricao: 'Lâmina de corte diamantada para máquinas industriais',
        tipo: 'Acessório',
        maquinas_compativeis: [1], // Compatível com MCI-2000
        preco_base: 150.00,
        unidade_medida: 'unidade',
        ativo: true,
        codigo_interno: 'LCD-100',
        categoria: 'Lâminas',
        peso: 0.500,
        dimensoes: JSON.stringify({
          largura: 25,
          altura: 25,
          profundidade: 0.3
        }),
        especificacoes_tecnicas: JSON.stringify({
          material: 'Diamante Industrial',
          dureza: 'HRC 65',
          vida_util: '500 horas'
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nome: 'Eletrodo de Solda ES-3.2',
        descricao: 'Eletrodo de solda para aço carbono',
        tipo: 'Acessório',
        maquinas_compativeis: [2], // Compatível com MSA-1500
        preco_base: 25.00,
        unidade_medida: 'kg',
        ativo: true,
        codigo_interno: 'ES-3.2',
        categoria: 'Eletrodos',
        peso: 1.000,
        especificacoes_tecnicas: JSON.stringify({
          diametro: '3.2mm',
          material: 'Aço Carbono',
          revestimento: 'Rutílico'
        }),
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nome: 'Óleo Lubrificante Industrial OLI-500',
        descricao: 'Óleo lubrificante para máquinas industriais',
        tipo: 'Acessório',
        maquinas_compativeis: [1, 2], // Compatível com ambas as máquinas
        preco_base: 45.00,
        unidade_medida: 'litro',
        ativo: true,
        codigo_interno: 'OLI-500',
        categoria: 'Lubrificantes',
        peso: 0.900,
        especificacoes_tecnicas: JSON.stringify({
          viscosidade: 'ISO VG 68',
          temperatura_trabalho: '-10°C a 120°C',
          tipo: 'Mineral'
        }),
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});

    // Inserir fórmulas de exemplo
    await queryInterface.bulkInsert('formulas', [
      {
        produto_id: 3, // Lâmina de Corte
        maquina_id: 1, // MCI-2000
        formula: 'm2 / 10',
        nome: 'Cálculo de Lâminas por Área',
        descricao: 'Calcula a quantidade de lâminas necessárias baseado na área a ser cortada',
        variaveis_entrada: JSON.stringify([
          {
            nome: 'm2',
            tipo: 'decimal',
            descricao: 'Área em metros quadrados',
            unidade: 'm²',
            obrigatorio: true,
            minimo: 0.1,
            maximo: 1000
          }
        ]),
        unidade_resultado: 'unidade',
        ativo: true,
        prioridade: 10,
        validacao_minima: 0.1,
        validacao_maxima: 100,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        produto_id: 4, // Eletrodo de Solda
        maquina_id: 2, // MSA-1500
        formula: 'comprimento * 0.05',
        nome: 'Cálculo de Eletrodos por Comprimento',
        descricao: 'Calcula a quantidade de eletrodos necessários baseado no comprimento de solda',
        variaveis_entrada: JSON.stringify([
          {
            nome: 'comprimento',
            tipo: 'decimal',
            descricao: 'Comprimento de solda em metros',
            unidade: 'm',
            obrigatorio: true,
            minimo: 0.1,
            maximo: 1000
          }
        ]),
        unidade_resultado: 'kg',
        ativo: true,
        prioridade: 10,
        validacao_minima: 0.05,
        validacao_maxima: 50,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        produto_id: 5, // Óleo Lubrificante
        maquina_id: 1, // MCI-2000
        formula: 'horas_uso / 100 * 0.5',
        nome: 'Consumo de Óleo por Horas de Uso - MCI',
        descricao: 'Calcula o consumo de óleo lubrificante baseado nas horas de uso da máquina MCI-2000',
        variaveis_entrada: JSON.stringify([
          {
            nome: 'horas_uso',
            tipo: 'decimal',
            descricao: 'Horas de uso da máquina',
            unidade: 'h',
            obrigatorio: true,
            minimo: 1,
            maximo: 8760
          }
        ]),
        unidade_resultado: 'litro',
        ativo: true,
        prioridade: 8,
        validacao_minima: 0.1,
        validacao_maxima: 50,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        produto_id: 5, // Óleo Lubrificante
        maquina_id: 2, // MSA-1500
        formula: 'horas_uso / 150 * 0.3',
        nome: 'Consumo de Óleo por Horas de Uso - MSA',
        descricao: 'Calcula o consumo de óleo lubrificante baseado nas horas de uso da máquina MSA-1500',
        variaveis_entrada: JSON.stringify([
          {
            nome: 'horas_uso',
            tipo: 'decimal',
            descricao: 'Horas de uso da máquina',
            unidade: 'h',
            obrigatorio: true,
            minimo: 1,
            maximo: 8760
          }
        ]),
        unidade_resultado: 'litro',
        ativo: true,
        prioridade: 9,
        validacao_minima: 0.1,
        validacao_maxima: 30,
        created_at: new Date(),
        updated_at: new Date()
      }
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('formulas', null, {});
    await queryInterface.bulkDelete('produtos', null, {});
  }
};