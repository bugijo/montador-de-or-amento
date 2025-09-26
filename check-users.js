const config = require('./src/config/database.js');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(config.development);

async function checkUsers() {
  try {
    const [results] = await sequelize.query("SELECT * FROM users");
    console.log('Usuários existentes:');
    console.log(results);
    
    const [duplicates] = await sequelize.query(`
      SELECT email, COUNT(*) as count 
      FROM users 
      GROUP BY email 
      HAVING COUNT(*) > 1
    `);
    
    console.log('\nEmails duplicados:');
    console.log(duplicates);
    
  } catch (error) {
    console.error('Erro:', error);
  } finally {
    await sequelize.close();
  }
}

checkUsers();