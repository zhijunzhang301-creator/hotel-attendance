const router = require('express').Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const PDFDocument = require('pdfkit');

const managerOnly = (req, res, next) => {
  if (!['manager', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ error: '权限不足' });
  }
  next();
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: '只有超级管理员可以操作' });
  }
  next();
};

router.use(authMiddleware);

// 导出单个员工某周 PDF（manager 和 admin 都可以）
router.get('/single/:employee_id', managerOnly, async (req, res) => {
  const { employee_id } = req.params;
  const { week_start } = req.query;

  const result = await db.query(
    `SELECT ar.*, e.name, e.employee_no, e.department
     FROM attendance_records ar
     JOIN employees e ON ar.employee_id = e.id
     WHERE ar.employee_id = $1
       AND ar.record_date >= $2
       AND ar.record_date < $2::date + INTERVAL '7 days'
     ORDER BY ar.record_date`,
    [employee_id, week_start]
  );

  const emp = result.rows[0];
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition',
    `attachment; filename="attendance_${emp?.employee_no}_${week_start}.pdf"`);
  doc.pipe(res);

  // 标题
  doc.fontSize(18).text('员工考勤记录', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`姓名：${emp?.name}    工号：${emp?.employee_no}    部门：${emp?.department}`);
  doc.text(`周次：${week_start} 起一周`);
  doc.moveDown();

  // 表头
  const fmt = (ts) => ts ? new Date(ts).toLocaleTimeString('zh-CN', {hour:'2-digit', minute:'2-digit'}) : '--:--';
  doc.fontSize(11);
  doc.text('日期          上班时间    下班时间    休息时长    状态');
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.3);

  // 每一行
  result.rows.forEach(r => {
    const date = r.record_date?.slice(5, 10);
    const status = r.status === 'modified' ? '已修改' : '正常';
    doc.text(
      `${date}          ${fmt(r.clock_in)}        ${fmt(r.clock_out)}        ${r.break_hours_rounded}h          ${status}`
    );
  });

  doc.end();
});

// 导出全部员工某周 PDF（只有 admin）
router.get('/all', adminOnly, async (req, res) => {
  const { week_start } = req.query;

  const result = await db.query(
    `SELECT ar.*, e.name, e.employee_no, e.department
     FROM attendance_records ar
     JOIN employees e ON ar.employee_id = e.id
     WHERE ar.record_date >= $1
       AND ar.record_date < $1::date + INTERVAL '7 days'
     ORDER BY e.department, e.name, ar.record_date`,
    [week_start]
  );

  const doc = new PDFDocument({ margin: 50 });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition',
    `attachment; filename="attendance_all_${week_start}.pdf"`);
  doc.pipe(res);

  doc.fontSize(18).text('全体员工考勤记录', { align: 'center' });
  doc.fontSize(12).text(`周次：${week_start} 起一周`, { align: 'center' });
  doc.moveDown();

  // 按员工分组
  const grouped = {};
  result.rows.forEach(r => {
    if (!grouped[r.employee_no]) grouped[r.employee_no] = [];
    grouped[r.employee_no].push(r);
  });

  const fmt = (ts) => ts ? new Date(ts).toLocaleTimeString('zh-CN', {hour:'2-digit', minute:'2-digit'}) : '--:--';

  Object.values(grouped).forEach(rows => {
    const emp = rows[0];
    doc.fontSize(13).text(`${emp.name}（${emp.employee_no}）- ${emp.department}`);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.fontSize(10);
    rows.forEach(r => {
      const date = r.record_date?.slice(5, 10);
      doc.text(`${date}  上班:${fmt(r.clock_in)}  下班:${fmt(r.clock_out)}  休息:${r.break_hours_rounded}h`);
    });
    doc.moveDown();
  });

  doc.end();
});

module.exports = router;