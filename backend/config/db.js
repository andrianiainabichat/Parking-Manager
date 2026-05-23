const { Pool } = require('pg')
require('dotenv').config()

const isProduction = process.env.NODE_ENV === 'production'

const pool = new Pool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'parking_db',
  port:     parseInt(process.env.DB_PORT) || 5432,
  ssl: isProduction
    ? {
        rejectUnauthorized: false,
        require: true
      }
    : false
})

pool.on('connect', () => {
  console.log('✅ PostgreSQL connecté')
})

pool.on('error', (err) => {
  console.error('❌ PostgreSQL pool error:', err.message)
})

module.exports = pool