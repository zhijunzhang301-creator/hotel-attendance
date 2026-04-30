const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const db = require('./src/db');

const staffList = [
  { no: '0011', name: 'Henry, Natasha',                    dept: 'Laundry',          role: 'staff' },
  { no: '0017', name: 'Patel, Yashkumar',                  dept: 'Director of Service', role: 'staff' },
  { no: '0300', name: 'Ridsdale, Amy Elizabeth',           dept: 'HK - Room',        role: 'staff' },
  { no: '0363', name: 'Singh, Harpreet',                   dept: 'HK - House',       role: 'staff' },
  { no: '0384', name: 'Banger, Gaurav',                    dept: 'Front Desk',       role: 'staff' },
  { no: '0391', name: 'Murselaj, Adisona',                 dept: 'HK - Room',        role: 'staff' },
  { no: '0392', name: 'Shanner, Jaden',                    dept: 'HK - Room',        role: 'staff' },
  { no: '0396', name: 'Hoeun, Chorvindyrathavon (Chorvin)', dept: 'HK - Room',       role: 'staff' },
  { no: '0416', name: 'Fofandi, Dhaval',                   dept: 'HK Supervisor',    role: 'manager' },
  { no: '0422', name: 'Kuchera, Liliia',                   dept: 'HK - Room',        role: 'staff' },
  { no: '0478', name: 'Patel, Prince',                     dept: 'Maintenance',      role: 'staff' },
  { no: '0507', name: 'Li, Zhenping (Laura)',              dept: 'Maintenance',      role: 'staff' },
  { no: '0524', name: 'Kovalyk, Halyna',                   dept: 'HK - Room',        role: 'staff' },
  { no: '0531', name: 'Flores, Amy',                       dept: 'HK - Room',        role: 'staff' },
  { no: '0532', name: 'Ahir, Viken',                       dept: 'Night Audit',      role: 'staff' },
  { no: '0536', name: 'Elbastawesy, Amr',                  dept: 'Night Audit',      role: 'staff' },
  { no: '0569', name: 'Nie, Jiayuan',                      dept: 'Maintenance',      role: 'staff' },
  { no: '0578', name: 'Rafanan, Jun Patrix',               dept: 'HK - House',       role: 'staff' },
  { no: '0580', name: 'Heckert-Williams, Kai L',           dept: 'HK - House',       role: 'staff' },
  { no: '0592', name: 'Lhaden, Sonam',                     dept: 'Front Desk',       role: 'staff' },
  { no: '0595', name: 'Dendup, Jigme Norbu',              dept: 'Breakfast',        role: 'staff' },
  { no: '0640', name: 'Ma, Lee Ann',                       dept: 'HK - Room',        role: 'staff' },
  { no: '0654', name: 'Choden, Kezang',                    dept: 'HK - Room',        role: 'staff' },
  { no: '0666', name: 'Ahir, Shreya Ranchhodbhai',        dept: 'HK - Room',        role: 'staff' },
  { no: '0672', name: 'Tshering, Pema',                    dept: 'HK - House',       role: 'staff' },
  { no: '0677', name: 'Nicholas, Terence Ken',             dept: 'HK - House',       role: 'staff' },
  { no: '0678', name: 'Parikh, Nitya Nimeshbhai',         dept: 'Maintenance',      role: 'staff' },
  { no: '0679', name: 'Zangmo, Tshering',                  dept: 'HK - Room',        role: 'staff' },
  { no: '0691', name: 'Bhaidani, Annu Parth',             dept: 'Sales Coordinator', role: 'staff' },
  { no: '0700', name: 'Ortiz, Melissa',                    dept: 'Breakfast',        role: 'staff' },
  { no: '0701', name: 'Hinds, Victoria Alysa',            dept: 'Breakfast',        role: 'staff' },
  { no: '0703', name: 'Jlassi, Khadija',                   dept: 'HK - Room',        role: 'staff' },
  { no: '0704', name: 'Bartkova, Natalia',                 dept: 'HK - Room',        role: 'staff' },
  { no: '0715', name: 'Pradhan, Alisha',                   dept: 'Front Desk',       role: 'staff' },
  { no: '0722', name: 'Zhang, Zhijun (Bernice)', dept: 'Sales Coordinator', role: 'staff' },
  { no: '0724', name: 'Palacios Flores, Roxana Elizabeth', dept: 'HK - Room',       role: 'staff' },
];

async function main() {
  console.log(`Creating ${staffList.length} accounts...`);
  for (const s of staffList) {
    // 初始密码 = 工号，员工第一次登录后可以自己改
    const hash = await bcrypt.hash(s.no, 10);
    await db.query(
      `INSERT INTO employees (name, employee_no, password_hash, role, department)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (employee_no) DO NOTHING`,
      [s.name, s.no, hash, s.role, s.dept]
    );
    console.log(`✓  ${s.no}  ${s.name}`);
  }
  console.log('\nAll done! Initial password = employee number.');
  process.exit();
}
main();