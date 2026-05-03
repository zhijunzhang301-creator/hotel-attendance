const { Pool } = require('pg');

// Vercel Serverless 环境直接提供 DATABASE_URL，无需加载本地 .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// 自动迁移数据：如果发现 employees 表有数据但 users 表为空，则迁移数据
// 这修复了之前脚本错误使用 employees 表的问题
const migrateUsersIfNeeded = async () => {
  try {
    // 检查 users 表是否有数据
    const usersCheck = await pool.query('SELECT COUNT(*) FROM users');
    const usersCount = parseInt(usersCheck.rows[0].count, 10);

    if (usersCount === 0) {
      // 检查 employees 表是否有数据
      const empCheck = await pool.query("SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'employees'");
      if (empCheck.rows[0].count > 0) {
        const empData = await pool.query('SELECT * FROM employees');
        if (empData.rows.length > 0) {
          console.log(`[Migration] Found ${empData.rows.length} users in employees table, migrating to users table...`);
          for (const emp of empData.rows) {
            await pool.query(
              `INSERT INTO users (name, employee_no, password_hash, role, department)
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (employee_no) DO NOTHING`,
              [emp.name, emp.employee_no, emp.password_hash, emp.role, emp.department]
            );
          }
          console.log('[Migration] User data migrated successfully.');
        }
      }
    }
  } catch (err) {
    console.log('[Migration] Migration check skipped:', err.message);
  }
};

// 初始化时尝试迁移（不为Vercel blocking）
migrateUsersIfNeeded();

module.exports = { query: (text, params) => pool.query(text, params) };
