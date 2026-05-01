const { Pool } = require('pg');

// Vercel Serverless 环境直接提供 DATABASE_URL，无需加载本地 .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

module.exports = { query: (text, params) => pool.query(text, params) };
