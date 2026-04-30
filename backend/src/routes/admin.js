const router = require('express').Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const roundBreakHours = require('../utils/roundBreak');
const {
  normalizeBreakMinutes,
  roundClockInTime,
  roundClockOutTime,
} = require('../utils/timeRules');
const logAudit = require('../utils/auditLog');
const { getClientIp } = require('../utils/networkAccess');

// 管理员权限守卫
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'manager') {
    return res.status(403).json({ error: '权限不足' });
  }
  next();
};

router.use(authMiddleware, adminOnly);

// 查看所有人某周记录
router.get('/weekly', async (req, res) => {
  const { week_start } = req.query; // 格式: 2024-01-01
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week_start || '')) {
    return res.status(400).json({ error: 'A valid week_start date is required' });
  }

  try {
    const result = await db.query(
      `SELECT ar.*, e.name, e.employee_no, e.department
       FROM attendance_records ar
       JOIN employees e ON ar.employee_id = e.id
       WHERE ar.record_date >= $1
         AND ar.record_date < $1::date + INTERVAL '7 days'
       ORDER BY e.department, e.name, ar.record_date`,
      [week_start]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 修改某条记录（管理员补录）
router.put('/record/:id', async (req, res) => {
  const { id } = req.params;
  const { clock_in, clock_out, break_minutes } = req.body;
  const normalizedBreakMinutes = normalizeBreakMinutes(Number(break_minutes || 0));

  if (normalizedBreakMinutes == null) {
    return res.status(400).json({ error: 'Break time must use 0.5-hour steps' });
  }

  const normalizedClockIn = clock_in ? roundClockInTime(clock_in) : null;
  const normalizedClockOut = clock_out ? roundClockOutTime(clock_out) : null;

  if (normalizedClockIn && normalizedClockOut && normalizedClockOut < normalizedClockIn) {
    return res.status(400).json({ error: 'Sign-out time cannot be earlier than sign-in time' });
  }

  try {
    // 先取旧值存入审计
    const old = await db.query('SELECT * FROM attendance_records WHERE id=$1', [id]);

    const rounded = roundBreakHours(normalizedBreakMinutes);
    const result = await db.query(
      `UPDATE attendance_records
       SET clock_in=$1, clock_out=$2, break_minutes=$3,
           break_hours_rounded=$4, status='modified',
           modified_by=$5, modified_at=NOW()
       WHERE id=$6 RETURNING *`,
      [
        normalizedClockIn ? normalizedClockIn.toISOString() : null,
        normalizedClockOut ? normalizedClockOut.toISOString() : null,
        normalizedBreakMinutes,
        rounded,
        req.user.employee_id,
        id
      ]
    );

    // 写审计日志
    await db.query(
      `INSERT INTO audit_logs
         (operator_id, action, target_record_id, old_value, new_value, ip_address)
       VALUES ($1, 'modify', $2, $3, $4, $5)`,
      [req.user.employee_id, id,
       JSON.stringify(old.rows[0]),
       JSON.stringify(result.rows[0]),
       getClientIp(req)]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/audit', async (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 100, 300);

  try {
    const result = await db.query(
      `SELECT
         al.*,
         op.name AS operator_name,
         ar.record_date,
         emp.name AS employee_name,
         emp.employee_no
       FROM audit_logs al
       LEFT JOIN employees op ON al.operator_id = op.id
       LEFT JOIN attendance_records ar ON al.target_record_id = ar.id
       LEFT JOIN employees emp ON ar.employee_id = emp.id
       ORDER BY al.created_at DESC
       LIMIT $1`,
      [limit]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/password-reset-requests', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT
         al.id,
         al.created_at,
         al.new_value,
         op.name AS operator_name
       FROM audit_logs al
       LEFT JOIN employees op ON al.operator_id = op.id
       WHERE al.action = 'password_reset_request'
       ORDER BY al.created_at DESC`
    );

    const pending = result.rows.filter((row) => row.new_value?.status === 'pending');
    res.json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/password-reset-requests/:id/resolve', async (req, res) => {
  const { id } = req.params;
  const tempPassword = req.body?.temporary_password || `Temp${Math.floor(100000 + Math.random() * 900000)}`;

  if (tempPassword.length < 8) {
    return res.status(400).json({ error: 'Temporary password must be at least 8 characters long' });
  }

  try {
    const requestResult = await db.query(
      'SELECT * FROM audit_logs WHERE id=$1 AND action=$2',
      [id, 'password_reset_request']
    );

    const requestLog = requestResult.rows[0];
    if (!requestLog) {
      return res.status(404).json({ error: 'Reset request not found' });
    }

    if (requestLog.new_value?.status !== 'pending') {
      return res.status(400).json({ error: 'This reset request has already been handled' });
    }

    const employeeId = requestLog.new_value?.employee_id;
    if (!employeeId) {
      return res.status(400).json({ error: 'Reset request is missing employee information' });
    }

    const passwordHash = await require('bcryptjs').hash(tempPassword, 10);
    await db.query(
      'UPDATE employees SET password_hash=$1 WHERE id=$2',
      [passwordHash, employeeId]
    );

    const resolvedPayload = {
      ...requestLog.new_value,
      status: 'resolved',
      resolved_at: new Date().toISOString(),
      resolved_by: req.user.employee_id,
    };

    await db.query(
      'UPDATE audit_logs SET new_value=$1 WHERE id=$2',
      [JSON.stringify(resolvedPayload), id]
    );

    await logAudit({
      operatorId: req.user.employee_id,
      action: 'password_reset_completed',
      ipAddress: getClientIp(req),
      newValue: {
        employee_id: employeeId,
        request_id: Number(id),
      },
    });

    res.json({
      success: true,
      temporary_password: tempPassword,
      employee_no: requestLog.new_value?.employee_no,
      employee_name: requestLog.new_value?.employee_name,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
