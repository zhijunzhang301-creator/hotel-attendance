const router = require('express').Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 登录
router.post('/login', async (req, res) => {
  const { employee_no, password } = req.body;
  try {
    const result = await db.query(
      'SELECT * FROM employees WHERE employee_no=$1',
      [employee_no]
    );
    const employee = result.rows[0];
    if (!employee) return res.status(401).json({ error: '工号不存在' });

    const valid = await bcrypt.compare(password, employee.password_hash);
    if (!valid) return res.status(401).json({ error: '密码错误' });

    const token = jwt.sign(
      { employee_id: employee.id, role: employee.role, name: employee.name },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );
    res.json({ token, name: employee.name, role: employee.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;