const router = require('express').Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');
const { getClientIp, hasNetworkAccess } = require('../utils/networkAccess');
const logAudit = require('../utils/auditLog');

// 登录
router.post('/login', async (req, res) => {
  const { employee_no, password } = req.body;
  if (!employee_no || !password) {
    return res.status(400).json({ error: 'Employee number and password are required' });
  }

  try {
const result = await db.query(
      'SELECT * FROM users WHERE employee_no=$1',
      [String(employee_no).trim()]
    );
    const employee = result.rows[0];
if (!employee) return res.status(401).json({ error: 'Employee number not found' });

    // Skip network check during login - credentials check is sufficient
    // The network restriction is applied after login via middleware for attendance features
    // if (!hasNetworkAccess(req, employee.role)) {
    //   return res.status(403).json({
    //     error: `Access denied outside the staff network. Current IP: ${getClientIp(req) || 'Unknown'}`,
    //   });
    // }

    const valid = await bcrypt.compare(password, employee.password_hash);
    if (!valid) return res.status(401).json({ error: 'Incorrect password' });

await logAudit({
      operatorId: employee.id,
      action: 'login',
      ipAddress: getClientIp(req),
      newValue: { user_id: employee.id, role: employee.role },
    });

const token = jwt.sign(
      { user_id: employee.id, role: employee.role, name: employee.name },
      process.env.JWT_SECRET || 'hotel-attendance-default-secret-key',
      { expiresIn: '12h' }
    );
    res.json({ token, name: employee.name, role: employee.role });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/change-password', authMiddleware, async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Current password and new password are required' });
  }

  if (new_password.length < 8) {
    return res.status(400).json({ error: 'New password must be at least 8 characters long' });
  }

  if (current_password === new_password) {
    return res.status(400).json({ error: 'New password must be different from the current password' });
  }

  try {
const result = await db.query(
      'SELECT id, password_hash FROM users WHERE id=$1',
      [req.user.user_id]
    );

    const employee = result.rows[0];
    if (!employee) return res.status(404).json({ error: 'Account not found' });

    const valid = await bcrypt.compare(current_password, employee.password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const nextHash = await bcrypt.hash(new_password, 10);
await db.query(
      'UPDATE users SET password_hash=$1 WHERE id=$2',
      [nextHash, employee.id]
    );

await logAudit({
      operatorId: employee.id,
      action: 'change_password',
      ipAddress: getClientIp(req),
      newValue: { user_id: employee.id },
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/request-password-reset', async (req, res) => {
  const { employee_no } = req.body;

  if (!employee_no) {
    return res.status(400).json({ error: 'Employee number is required' });
  }

  try {
const result = await db.query(
      'SELECT id, employee_no, name, role FROM users WHERE employee_no=$1',
      [String(employee_no).trim()]
    );

    const employee = result.rows[0];
    if (employee) {
await logAudit({
        operatorId: employee.id,
        action: 'password_reset_request',
        ipAddress: getClientIp(req),
        newValue: {
          user_id: employee.id,
          employee_no: employee.employee_no,
          employee_name: employee.name,
          role: employee.role,
          status: 'pending',
          requested_at: new Date().toISOString(),
        },
      });
    }

    res.json({
      success: true,
      message: 'If the account exists, a reset request has been sent to management.',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
