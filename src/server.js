'use strict';

const App = require('./app');

// Cria e inicia a aplicação
const app = new App();

// Inicia o servidor
app.start().catch(error => {
  console.error('❌ Falha crítica ao iniciar aplicação:', error);
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