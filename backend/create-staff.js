const bcrypt = require('bcryptjs');
const db = require('./src/db');
require('dotenv').config();

async function main() {
  const hash = await bcrypt.hash('Staff123456', 10);
  await db.query(
    `INSERT INTO employees (name, employee_no, password_hash, role, department)
     VALUES ('RobotA', 'STAFF001', $1, 'staff', 'Front Desk')`,
    [hash]
  );
  console.log('普通员工账号创建成功');
  process.exit();
}
main();