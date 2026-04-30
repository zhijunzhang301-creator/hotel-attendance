const bcrypt = require('bcryptjs');
const db = require('./src/db');
require('dotenv').config();

async function upsertUser({ name, employee_no, password, role, department }) {
  const hash = await bcrypt.hash(password, 10);
  await db.query(
    `INSERT INTO employees (name, employee_no, password_hash, role, department)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (employee_no)
     DO UPDATE SET
       name = EXCLUDED.name,
       password_hash = EXCLUDED.password_hash,
       role = EXCLUDED.role,
       department = EXCLUDED.department`,
    [name, employee_no, hash, role, department]
  );
}

async function main() {
  await upsertUser({
    name: 'System Admin',
    employee_no: 'ADMIN001',
    password: 'Admin123456',
    role: 'admin',
    department: 'Administration',
  });

  await upsertUser({
    name: 'Dhaval Fofandi',
    employee_no: '0416',
    password: '0416',
    role: 'manager',
    department: 'HK Supervisor',
  });

  await upsertUser({
    name: 'Bernice Zhang',
    employee_no: '0722',
    password: '0722',
    role: 'staff',
    department: 'Sales Coordinator',
  });

  console.log('Access accounts are ready.');
  console.log('Admin:   ADMIN001 / Admin123456');
  console.log('Manager: 0416 / 0416');
  console.log('Staff:   0722 / 0722');
  process.exit();
}

main();
