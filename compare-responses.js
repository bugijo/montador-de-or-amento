const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function compareResponses() {
  try {
    console.log('🔍 Comparando respostas dos endpoints...\n');

    // Login
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@sistema-orcamentos.com',
      senha: 'admin123'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ Token obtido\n');

    // Teste 1: Mesma requisição que test-api.js
    console.log('1️⃣ Requisição como test-api.js:');
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    const response1 = await axios.get(`${BASE_URL}/produtos`, { headers });
    console.log('Headers enviados:', headers);
    console.log('Tipo de data.data:', typeof response1.data.data);
    console.log('É array?', Array.isArray(response1.data.data));
    console.log('Length:', response1.data.data?.length);
    console.log('Primeiros 2 caracteres da resposta:', JSON.stringify(response1.data).substring(0, 100));
    
    // Teste 2: Mesma requisição que test-produtos-detailed.js
    console.log('\n2️⃣ Requisição como test-produtos-detailed.js:');
    const response2 = await axios.get(`${BASE_URL}/produtos`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    console.log('Headers enviados:', { Authorization: `Bearer ${token}` });
    console.log('Tipo de data.data:', typeof response2.data.data);
    console.log('É array?', Array.isArray(response2.data.data));
    console.log('Length:', response2.data.data?.length);
    console.log('Primeiros 2 caracteres da resposta:', JSON.stringify(response2.data).substring(0, 100));

    console.log('\n🔍 Comparação:');
    console.log('Respostas são iguais?', JSON.stringify(response1.data) === JSON.stringify(response2.data));
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

compareResponses();