const { Produto } = require('./src/models');

async function checkProducts() {
  try {
    const produtos = await Produto.findAll();
    console.log(`Total de produtos: ${produtos.length}`);
    
    if (produtos.length > 0) {
      console.log('\nProdutos existentes:');
      produtos.forEach(p => {
        console.log(`- ${p.codigo_interno}: ${p.nome} (${p.tipo})`);
      });
    } else {
      console.log('Nenhum produto encontrado.');
    }
  } catch (error) {
    console.error('Erro:', error.message);
  }
  process.exit(0);
}

checkProducts();