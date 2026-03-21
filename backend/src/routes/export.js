const router = require('express').Router();
const db = require('../db');
const authMiddleware = require('../middleware/auth');
const PDFDocument = require('pdfkit');

const managerOnly = (req, res, next) => {
  if (!['manager', 'admin'].includes(req.user?.role)) {
    return res.status(403).json({ error: 'Permission denied' });
  }
  next();
};

router.use(authMiddleware);

const fmt = (ts) => ts
  ? new Date(ts).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })
  : '--:--';

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

  doc.fontSize(18).text('Employee Attendance Record', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Name: ${emp?.name}    Employee No: ${emp?.employee_no}    Department: ${emp?.department}`);
  doc.text(`Week starting: ${week_start}`);
  doc.moveDown();

  doc.fontSize(11);
  doc.text('Date        Start       End         Break       Status');
  doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
  doc.moveDown(0.3);

  result.rows.forEach(r => {
    const date = r.record_date?.slice(5, 10);
    const status = r.status === 'modified' ? 'Modified' : 'Normal';
    doc.text(
      `${date}      ${fmt(r.clock_in)}      ${fmt(r.clock_out)}      ${r.break_hours_rounded}h          ${status}`
    );
  });

  doc.end();
});

// 导出全部员工某周 PDF（manager 和 admin 都可以）
router.get('/all', managerOnly, async (req, res) => {
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

  doc.fontSize(18).text('Full Staff Attendance Report', { align: 'center' });
  doc.fontSize(12).text(`Week starting: ${week_start}`, { align: 'center' });
  doc.moveDown();

  const grouped = {};
  result.rows.forEach(r => {
    if (!grouped[r.employee_no]) grouped[r.employee_no] = [];
    grouped[r.employee_no].push(r);
  });

  Object.values(grouped).forEach(rows => {
    const emp = rows[0];
    doc.fontSize(13).text(`${emp.name} (${emp.employee_no}) - ${emp.department}`);
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.fontSize(10);
    rows.forEach(r => {
      const date = r.record_date?.slice(5, 10);
      doc.text(
        `${date}    Start: ${fmt(r.clock_in)}    End: ${fmt(r.clock_out)}    Break: ${r.break_hours_rounded}h    Status: ${r.status === 'modified' ? 'Modified' : 'Normal'}`
      );
    });
    doc.moveDown();
  });

  doc.end();
});

module.exports = router;