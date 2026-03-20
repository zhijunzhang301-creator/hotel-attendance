const bcrypt = require('bcryptjs');
const db = require('./src/db');
require('dotenv').config();

// 在这里填写所有员工信息
const staffList = [
  { name: 'Henry, Natasha',   employee_no: 'S001', password: 'Staff001', department: '前台', role: 'staff' },
  { name: 'Patel, Yashkumar',   employee_no: 'S002', password: 'Staff002', department: '前台', role: 'staff' },
  { name: 'Ridsdale, Amy Elizabeth',   employee_no: 'S003', password: 'Staff003', department: '餐饮', role: 'staff' },
  { name: 'Bhaidani, Annu Parth', employee_no: 'M001', password: 'Manager001', department: '管理', role: 'manager' },
  // 按这个格式继续往下加...
];

async function main() {
  for (const staff of staffList) {
    const hash = await bcrypt.hash(staff.password, 10);
    await db.query(
      `INSERT INTO employees (name, employee_no, password_hash, role, department)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (employee_no) DO NOTHING`,
      [staff.name, staff.employee_no, hash, staff.role, staff.department]
    );
    console.log(`✓ 创建成功：${staff.name}(${staff.employee_no})`);
  }
  console.log('全部完成');
  process.exit();
}
main();