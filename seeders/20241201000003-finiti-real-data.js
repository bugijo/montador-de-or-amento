'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface, Sequelize) {
    // Limpar dados de exemplo existentes
    await queryInterface.bulkDelete('formulas', null, {});
    await queryInterface.bulkDelete('produtos', null, {});
    await queryInterface.bulkDelete('users', {
      email: {
        [Sequelize.Op.in]: ['admin@sistema-orcamentos.com', 'vendedor@sistema-orcamentos.com']
      }
    }, {});

    // Inserir usuários reais da FINITI com hash manual
    const users = [
      {
        nome: 'Giovanni Pereira',
        email: 'giovanni.pereira@finiti.com.br',
        senha: await bcrypt.hash('admin123', 12),
        role: 'admin',
        ativo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nome: 'Carlos Silva',
        email: 'carlos.silva@finiti.com.br',
        senha: await bcrypt.hash('vendedor123', 12),
        role: 'vendedor',
        ativo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nome: 'Ana Santos',
        email: 'ana.santos@finiti.com.br',
        senha: await bcrypt.hash('vendedor123', 12),
        role: 'vendedor',
        ativo: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nome: 'Roberto Oliveira',
        email: 'roberto.oliveira@finiti.com.br',
        senha: await bcrypt.hash('vendedor123', 12),
        role: 'vendedor',
        ativo: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    // Inserir usuários um por vez para evitar problemas de validação
    for (const user of users) {
      await queryInterface.bulkInsert('users', [user], {});
    }

    // Inserir produtos reais da FINITI
    const produtos = [
      // BETONEIRAS
      {
        nome: 'Betoneira 400L Profissional',
        descricao: 'Betoneira basculante 400 litros, motor 2HP, ideal para obras de médio porte',
        tipo: 'Máquina',
        preco_base: 2850.00,
        unidade_medida: 'unidade',
        ativo: true,
        codigo_interno: 'BET-400-PRO',
        categoria: 'Betoneiras',
        peso: 120.000,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nome: 'Betoneira 600L Industrial',
        descricao: 'Betoneira basculante 600 litros, motor 3HP trifásico, para obras de grande porte',
        tipo: 'Máquina',
        preco_base: 4200.00,
        unidade_medida: 'unidade',
        ativo: true,
        codigo_interno: 'BET-600-IND',
        categoria: 'Betoneiras',
        peso: 180.000,
        created_at: new Date(),
        updated_at: new Date()
      },

      // VIBRADORES
      {
        nome: 'Vibrador de Concreto 1.5HP',
        descricao: 'Vibrador de concreto com motor 1.5HP, mangote flexível 4m, ideal para adensamento',
        tipo: 'Máquina',
        preco_base: 1850.00,
        unidade_medida: 'unidade',
        ativo: true,
        codigo_interno: 'VIB-1.5HP',
        categoria: 'Vibradores',
        peso: 28.000,
        created_at: new Date(),
        updated_at: new Date()
      },

      // SERRAS
      {
        nome: 'Serra Circular de Mesa 3HP',
        descricao: 'Serra circular de mesa com motor 3HP, disco 350mm, para cortes precisos',
        tipo: 'Máquina',
        preco_base: 3200.00,
        unidade_medida: 'unidade',
        ativo: true,
        codigo_interno: 'SERRA-3HP',
        categoria: 'Serras',
        peso: 85.000,
        created_at: new Date(),
        updated_at: new Date()
      },

      // COMPACTADORES
      {
        nome: 'Compactador de Solo 4HP',
        descricao: 'Compactador tipo sapo com motor 4HP Honda, ideal para compactação de pequenas áreas',
        tipo: 'Máquina',
        preco_base: 2650.00,
        unidade_medida: 'unidade',
        ativo: true,
        codigo_interno: 'COMP-4HP',
        categoria: 'Compactadores',
        peso: 75.000,
        created_at: new Date(),
        updated_at: new Date()
      },

      // ACESSÓRIOS
      {
        nome: 'Disco Diamantado 350mm',
        descricao: 'Disco diamantado segmentado 350mm para serra circular, corte de concreto e alvenaria',
        tipo: 'Acessório',
        preco_base: 185.00,
        unidade_medida: 'unidade',
        ativo: true,
        codigo_interno: 'DISCO-350',
        categoria: 'Discos',
        peso: 1.200,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nome: 'Agulha Vibrador 45mm x 4m',
        descricao: 'Agulha para vibrador de concreto, diâmetro 45mm, comprimento 4 metros',
        tipo: 'Acessório',
        preco_base: 320.00,
        unidade_medida: 'unidade',
        ativo: true,
        codigo_interno: 'AGULHA-45',
        categoria: 'Agulhas',
        peso: 8.500,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nome: 'Óleo SAE 30 para Motores',
        descricao: 'Óleo lubrificante SAE 30 para motores de equipamentos de construção',
        tipo: 'Acessório',
        preco_base: 28.00,
        unidade_medida: 'litro',
        ativo: true,
        codigo_interno: 'OLEO-SAE30',
        categoria: 'Lubrificantes',
        peso: 0.900,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        nome: 'Filtro de Ar Honda',
        descricao: 'Filtro de ar para motores Honda GX120/GX160, manutenção preventiva',
        tipo: 'Acessório',
        preco_base: 45.00,
        unidade_medida: 'unidade',
        ativo: true,
        codigo_interno: 'FILTRO-HONDA',
        categoria: 'Filtros',
        peso: 0.150,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('produtos', produtos, {});

    // Inserir fórmulas de cálculo
    const formulas = [
      {
        produto_id: 6, // Disco Diamantado
        maquina_id: 4, // Serra Circular
        formula: 'area_corte / 10',
        nome: 'Consumo de Discos por Área',
        descricao: 'Calcula quantos discos diamantados são necessários baseado na área de corte',
        variaveis_entrada: JSON.stringify([
          {
            nome: 'area_corte',
            tipo: 'number',
            unidade: 'm²',
            descricao: 'Área total a ser cortada',
            min: 0.1,
            max: 1000
          }
        ]),
        unidade_resultado: 'unidades',
        ativo: true,
        prioridade: 1,
        validacao_minima: 0.1,
        validacao_maxima: 100,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        produto_id: 8, // Óleo SAE 30
        maquina_id: 1, // Betoneira 400L
        formula: 'horas_uso * 0.02',
        nome: 'Consumo de Óleo por Horas de Uso',
        descricao: 'Calcula o consumo de óleo baseado nas horas de uso da betoneira',
        variaveis_entrada: JSON.stringify([
          {
            nome: 'horas_uso',
            tipo: 'number',
            unidade: 'horas',
            descricao: 'Horas de uso previstas',
            min: 1,
            max: 1000
          }
        ]),
        unidade_resultado: 'litros',
        ativo: true,
        prioridade: 1,
        validacao_minima: 0.02,
        validacao_maxima: 20,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        produto_id: 9, // Filtro de Ar
        maquina_id: 5, // Compactador
        formula: 'Math.ceil(horas_uso / 100)',
        nome: 'Troca de Filtros por Horas',
        descricao: 'Calcula quantos filtros são necessários baseado nas horas de uso (troca a cada 100h)',
        variaveis_entrada: JSON.stringify([
          {
            nome: 'horas_uso',
            tipo: 'number',
            unidade: 'horas',
            descricao: 'Horas de uso previstas',
            min: 1,
            max: 2000
          }
        ]),
        unidade_resultado: 'unidades',
        ativo: true,
        prioridade: 1,
        validacao_minima: 1,
        validacao_maxima: 20,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    await queryInterface.bulkInsert('formulas', formulas, {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('formulas', null, {});
    await queryInterface.bulkDelete('produtos', null, {});
    await queryInterface.bulkDelete('users', {
      email: {
        [Sequelize.Op.like]: '%@finiti.com.br'
      }
    }, {});
  }
};