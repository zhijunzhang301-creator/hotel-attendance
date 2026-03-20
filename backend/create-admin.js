const bcrypt = require('bcryptjs');
const db = require('./src/db');
require('dotenv').config();

async function main() {
  const hash = await bcrypt.hash('Admin123456', 10);
  await db.query(
    `UPDATE employees SET password_hash=$1 WHERE employee_no='ADMIN001'`,
    [hash]
  );
  console.log('密码重置成功');
  process.exit();
}
main();