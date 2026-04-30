const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./src/db');

async function main() {
  const hash = await bcrypt.hash('Admin123456', 10);
  await db.query(
    `INSERT INTO employees (name, employee_no, password_hash, role, department)
     VALUES ('System Admin', 'ADMIN001', $1, 'admin', 'Administration')
     ON CONFLICT (employee_no)
     DO UPDATE SET
       password_hash = EXCLUDED.password_hash,
       role = EXCLUDED.role,
       department = EXCLUDED.department`,
    [hash]
  );
  console.log('Admin account is ready: ADMIN001 / Admin123456');
  process.exit();
}
main();
