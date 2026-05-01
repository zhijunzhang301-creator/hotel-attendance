const router = require('express').Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const wifiCheck = require('../middleware/wifiCheck');
const roundBreakHours = require('../utils/roundBreak');
const {
  getTodayToronto,
  getWeekStartToronto,
  normalizeBreakMinutes,
  roundClockInTime,
  roundClockOutTime,
} = require('../utils/timeRules');
const { getClientIp } = require('../utils/networkAccess');

// 所有打卡接口都要验证登录 + WiFi
router.use(authMiddleware, wifiCheck);

// 上班签到
router.post('/clock-in', async (req, res) => {
  const { user_id } = req.user;
  const today = getTodayToronto();
  const roundedClockIn = roundClockInTime(new Date());

  try {
// 检查今天是否已经签到
    const existing = await db.query(
      'SELECT * FROM check_ins WHERE user_id=$1 AND check_date=$2',
      [user_id, today]
    );
    if (existing.rows[0]?.clock_in) {
      return res.status(400).json({ error: '今天已经签到过了' });
    }

// 插入或更新（用 UPSERT）
    const result = await db.query(
      `INSERT INTO check_ins (user_id, check_date, clock_in)
       VALUES ($1, $2, $3)
       ON CONFLICT (user_id, check_date)
       DO UPDATE SET clock_in = EXCLUDED.clock_in
       RETURNING *`,
      [user_id, today, roundedClockIn.toISOString()]
    );

// 写审计日志
    await db.query(
      `INSERT INTO audit_logs (operator_id, action, target_record_id, ip_address)
       VALUES ($1, 'clock_in', $2, $3)`,
      [user_id, result.rows[0].id, getClientIp(req)]
    );

    res.json({ success: true, time: result.rows[0].clock_in });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 填写休息时长
router.post('/break', async (req, res) => {
  const { user_id } = req.user;
  const { minutes } = req.body;
  const today = getTodayToronto();
  const normalizedMinutes = normalizeBreakMinutes(minutes);

  if (normalizedMinutes == null) {
    return res.status(400).json({ error: 'Break time must be entered in 0.5-hour steps' });
  }

  const rounded = roundBreakHours(normalizedMinutes);

try {
    const result = await db.query(
      `UPDATE check_ins
       SET break_minutes=$1, break_hours_rounded=$2
       WHERE user_id=$3 AND check_date=$4
       RETURNING *`,
      [normalizedMinutes, rounded, user_id, today]
    );
if (!result.rows[0]) return res.status(404).json({ error: '请先签到' });
    res.json({ success: true, break_hours_rounded: rounded });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 下班签离
router.post('/clock-out', async (req, res) => {
  const { user_id } = req.user;
  const today = getTodayToronto();
  const roundedClockOut = roundClockOutTime(new Date());

try {
    const record = await db.query(
      'SELECT * FROM check_ins WHERE user_id=$1 AND check_date=$2',
      [user_id, today]
    );
    if (!record.rows[0]?.clock_in) {
      return res.status(400).json({ error: '请先签到再签离' });
    }
    if (record.rows[0]?.clock_out) {
      return res.status(400).json({ error: '今天已经签离过了' });
    }

const result = await db.query(
      `UPDATE check_ins SET clock_out=$3
       WHERE user_id=$1 AND check_date=$2 RETURNING *`,
      [user_id, today, roundedClockOut.toISOString()]
    );

    await db.query(
      `INSERT INTO audit_logs (operator_id, action, target_record_id, ip_address)
       VALUES ($1, 'clock_out', $2, $3)`,
      [user_id, result.rows[0].id, getClientIp(req)]
    );

    res.json({ success: true, time: result.rows[0].clock_out });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 查询本周记录（员工查自己）
router.get('/my-week', async (req, res) => {
  const { user_id } = req.user;
  try {
    const result = await db.query(
      `SELECT * FROM check_ins
       WHERE user_id=$1
         AND check_date >= $2
       ORDER BY check_date ASC`,
      [user_id, getWeekStartToronto()]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
