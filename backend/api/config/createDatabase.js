const knex = require('knex')({
  client: 'mysql2',
  connection: {
    // host: 'localhost',
    host: 'mysql_db', 
    user: 'root',       
    password: 'dandy', 
    // port: 3307,
  }, 
});

async function createDatabase() {
  try {
    const [exists] = await knex.raw("SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = 'db-petpoint2'");

    if (exists.length > 0) {
      console.log('Database sudah ada.');
    } else {
      await knex.raw('CREATE DATABASE db_petpoint2');
      console.log('Database berhasil dibuat');
    }
  } catch (error) {
    console.error('Error saat membuat database:', error);
  } finally {
    knex.destroy();
  }
}

createDatabase();
