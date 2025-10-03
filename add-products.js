const { Produto } = require('./src/models');

async function addProducts() {
  try {
    console.log('Adicionando produtos...');

    // Máquinas
    const betoneira = await Produto.create({
      nome: 'Betoneira 400L',
      descricao: 'Betoneira basculante 400 litros para obras',
      tipo: 'Máquina',
      preco_base: 2850.00,
      unidade_medida: 'unidade',
      ativo: true,
      codigo_interno: 'BET-400',
      categoria: 'Betoneiras',
      peso: 120.000
    });
    console.log('✓ Betoneira criada:', betoneira.id);

    const vibrador = await Produto.create({
      nome: 'Vibrador de Concreto',
      descricao: 'Vibrador de concreto com motor 1.5HP',
      tipo: 'Máquina',
      preco_base: 1850.00,
      unidade_medida: 'unidade',
      ativo: true,
      codigo_interno: 'VIB-1.5',
      categoria: 'Vibradores',
      peso: 28.000
    });
    console.log('✓ Vibrador criado:', vibrador.id);

    const serra = await Produto.create({
      nome: 'Serra Circular',
      descricao: 'Serra circular de mesa com motor 3HP',
      tipo: 'Máquina',
      preco_base: 3200.00,
      unidade_medida: 'unidade',
      ativo: true,
      codigo_interno: 'SERRA-3HP',
      categoria: 'Serras',
      peso: 85.000
    });
    console.log('✓ Serra criada:', serra.id);

    // Acessórios
    const disco = await Produto.create({
      nome: 'Disco Diamantado 350mm',
      descricao: 'Disco diamantado para serra circular',
      tipo: 'Acessório',
      maquinas_compativeis: [serra.id],
      preco_base: 185.00,
      unidade_medida: 'unidade',
      ativo: true,
      codigo_interno: 'DISCO-350',
      categoria: 'Discos',
      peso: 1.200
    });
    console.log('✓ Disco criado:', disco.id);

    const oleo = await Produto.create({
      nome: 'Óleo SAE 30',
      descricao: 'Óleo lubrificante para motores',
      tipo: 'Acessório',
      maquinas_compativeis: [betoneira.id, vibrador.id, serra.id],
      preco_base: 28.00,
      unidade_medida: 'litro',
      ativo: true,
      codigo_interno: 'OLEO-SAE30',
      categoria: 'Lubrificantes',
      peso: 0.900
    });
    console.log('✓ Óleo criado:', oleo.id);

    console.log('\n✅ Todos os produtos foram criados com sucesso!');
    
    // Listar produtos criados
    const produtos = await Produto.findAll();
    console.log(`\nTotal de produtos: ${produtos.length}`);
    produtos.forEach(p => {
      console.log(`- ${p.nome} (${p.tipo}) - R$ ${p.preco_base}`);
    });

  } catch (error) {
    console.error('❌ Erro ao criar produtos:', error.message);
    if (error.errors) {
      error.errors.forEach(err => {
        console.error(`  - ${err.path}: ${err.message}`);
      });
    }
  }
}

addProducts().then(() => {
  console.log('\nScript finalizado.');
  process.exit(0);
}).catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});