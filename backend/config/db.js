const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'parking_db',
  port:     parseInt(process.env.DB_PORT) || 5432,
});

// Helper : retourne rows directement comme mysql2
pool.query2 = async (sql, params) => {
  // Convertit les ? de style MySQL en $1,$2,... style PostgreSQL
  let i = 0;
  const pgSql = sql.replace(/\?/g, () => `$${++i}`);
  const result = await pool.query(pgSql, params);
  return [result.rows];
};

module.exports = pool;
