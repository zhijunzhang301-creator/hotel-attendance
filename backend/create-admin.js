const bcrypt = require('bcryptjs');
const db = require('./src/db');

async function main() {
  const hash = await bcrypt.hash('20060301Zzj!', 10);
  await db.query(
    `INSERT INTO employees (name, employee_no, password_hash, role)
     VALUES ('Bernice', 'ADMIN001', $1, 'admin')`,
    [hash]
  );
  console.log('管理员账号创建成功');
  process.exit();
}
main();