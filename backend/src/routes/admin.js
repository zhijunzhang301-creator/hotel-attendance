const router = require('express').Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');

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
  const roundBreakHours = require('../utils/roundBreak');

  try {
    // 先取旧值存入审计
    const old = await db.query('SELECT * FROM attendance_records WHERE id=$1', [id]);

    const rounded = roundBreakHours(Number(break_minutes || 0));
    const result = await db.query(
      `UPDATE attendance_records
       SET clock_in=$1, clock_out=$2, break_minutes=$3,
           break_hours_rounded=$4, status='modified',
           modified_by=$5, modified_at=NOW()
       WHERE id=$6 RETURNING *`,
      [clock_in, clock_out, break_minutes, rounded, req.user.employee_id, id]
    );

    // 写审计日志
    await db.query(
      `INSERT INTO audit_logs
         (operator_id, action, target_record_id, old_value, new_value)
       VALUES ($1, 'modify', $2, $3, $4)`,
      [req.user.employee_id, id,
       JSON.stringify(old.rows[0]),
       JSON.stringify(result.rows[0])]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;