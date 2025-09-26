'use strict';

const AppDemo = require('./app-demo');

// Cria e inicia a aplicação demo
const app = new AppDemo();

// Inicia o servidor
app.start().catch(error => {
  console.error('❌ Falha crítica ao iniciar aplicação demo:', error);
  process.exit(1);
});

// Tratamento de exceções não capturadas
process.on('uncaughtException', (error) => {
  console.error('❌ Exceção não capturada:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejeitada não tratada:', reason);
  console.error('Promise:', promise);
  process.exit(1);
});

module.exports = app;