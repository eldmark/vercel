const { Pool } = require('pg');

const pool = new Pool({
    password: process.env.SUPABASE_API_KEY,
    database: process.env.SUPABASE_URL,
});

// Test de conexión
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error en PostgreSQL:', err);
});

module.exports = pool;