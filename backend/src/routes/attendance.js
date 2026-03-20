const router = require('express').Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const wifiCheck = require('../middleware/wifiCheck');
const roundBreakHours = require('../utils/roundBreak');

// 所有打卡接口都要验证登录 + WiFi
router.use(authMiddleware, wifiCheck);

// 上班签到
router.post('/clock-in', async (req, res) => {
  const { employee_id } = req.user;
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  try {
    // 检查今天是否已经签到
    const existing = await db.query(
      'SELECT * FROM attendance_records WHERE employee_id=$1 AND record_date=$2',
      [employee_id, today]
    );
    if (existing.rows[0]?.clock_in) {
      return res.status(400).json({ error: '今天已经签到过了' });
    }

    // 插入或更新（用 UPSERT）
    const result = await db.query(
      `INSERT INTO attendance_records (employee_id, record_date, clock_in)
       VALUES ($1, $2, NOW())
       ON CONFLICT (employee_id, record_date)
       DO UPDATE SET clock_in = NOW()
       RETURNING *`,
      [employee_id, today]
    );

    // 写审计日志
    await db.query(
      `INSERT INTO audit_logs (operator_id, action, target_record_id, ip_address)
       VALUES ($1, 'clock_in', $2, $3)`,
      [employee_id, result.rows[0].id, req.socket.remoteAddress]
    );

    res.json({ success: true, time: result.rows[0].clock_in });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 填写休息时长
router.post('/break', async (req, res) => {
  const { employee_id } = req.user;
  const { minutes } = req.body; // 前端传来原始分钟数
  const today = new Date().toISOString().split('T')[0];

  const rounded = roundBreakHours(Number(minutes));

  try {
    const result = await db.query(
      `UPDATE attendance_records
       SET break_minutes=$1, break_hours_rounded=$2
       WHERE employee_id=$3 AND record_date=$4
       RETURNING *`,
      [minutes, rounded, employee_id, today]
    );
    if (!result.rows[0]) return res.status(404).json({ error: '请先签到' });
    res.json({ success: true, break_hours_rounded: rounded });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 下班签离
router.post('/clock-out', async (req, res) => {
  const { employee_id } = req.user;
  const today = new Date().toISOString().split('T')[0];

  try {
    const record = await db.query(
      'SELECT * FROM attendance_records WHERE employee_id=$1 AND record_date=$2',
      [employee_id, today]
    );
    if (!record.rows[0]?.clock_in) {
      return res.status(400).json({ error: '请先签到再签离' });
    }
    if (record.rows[0]?.clock_out) {
      return res.status(400).json({ error: '今天已经签离过了' });
    }

    const result = await db.query(
      `UPDATE attendance_records SET clock_out=NOW()
       WHERE employee_id=$1 AND record_date=$2 RETURNING *`,
      [employee_id, today]
    );

    await db.query(
      `INSERT INTO audit_logs (operator_id, action, target_record_id, ip_address)
       VALUES ($1, 'clock_out', $2, $3)`,
      [employee_id, result.rows[0].id, req.socket.remoteAddress]
    );

    res.json({ success: true, time: result.rows[0].clock_out });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 查询本周记录（员工查自己）
router.get('/my-week', async (req, res) => {
  const { employee_id } = req.user;
  try {
    const result = await db.query(
      `SELECT * FROM attendance_records
       WHERE employee_id=$1
         AND record_date >= date_trunc('week', NOW())
       ORDER BY record_date ASC`,
      [employee_id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;