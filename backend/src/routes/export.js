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

const isValidWeekStart = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value || '');

const fmt = (ts) => ts
  ? new Date(ts).toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit' })
  : '--:--';

const fmtDate = (value) => {
  if (!value) return '--/--';
  return new Date(value).toLocaleDateString('en-CA', {
    month: '2-digit',
    day: '2-digit',
    timeZone: 'America/Toronto',
  });
};

const renderReportHeader = (doc, title, weekStart) => {
  doc.fontSize(18).text(title, { align: 'center' });
  doc.moveDown(0.3);
  doc.fontSize(12).text(`Week Starting: ${weekStart}`, { align: 'center' });
  doc.moveDown();
};

const renderEmptyState = (doc, message) => {
  doc.moveDown(2);
  doc.fontSize(12).text(message, { align: 'center' });
};

const ensureSpacing = (doc, minY = 720) => {
  if (doc.y > minY) {
    doc.addPage();
  }
};

// 导出单个员工某周 PDF（manager 和 admin 都可以）
router.get('/single/:user_id', managerOnly, async (req, res) => {
  const { user_id } = req.params;
  const { week_start } = req.query;

  if (!isValidWeekStart(week_start)) {
    return res.status(400).json({ error: 'A valid week_start date is required' });
  }

  try {
    const result = await db.query(
      `SELECT ar.*, u.name, u.employee_no, u.department
       FROM check_ins ar
       JOIN users u ON ar.user_id = u.id
       WHERE ar.user_id = $1
         AND ar.check_date >= $2
         AND ar.check_date < $2::date + INTERVAL '7 days'
       ORDER BY ar.check_date`,
      [user_id, week_start]
    );

    const emp = result.rows[0];
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename="attendance_${emp?.employee_no || user_id}_${week_start}.pdf"`);
    doc.pipe(res);

    renderReportHeader(doc, 'Employee Attendance Report', week_start);

    if (!emp) {
      renderEmptyState(doc, 'No attendance records were found for this employee during the selected week.');
      doc.end();
      return;
    }

    doc.fontSize(12).text(`Name: ${emp.name}`);
    doc.text(`Employee Number: ${emp.employee_no}`);
    doc.text(`Department: ${emp.department || 'N/A'}`);
    doc.moveDown();

    doc.fontSize(11).text('Date        Start       End         Break       Status');
    doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.3);

    result.rows.forEach((r) => {
      const date = fmtDate(r.check_date);
      const status = r.status === 'modified' ? 'Modified' : 'Normal';
      doc.text(
        `${date}      ${fmt(r.clock_in)}      ${fmt(r.clock_out)}      ${r.break_hours_rounded}h          ${status}`
      );
      ensureSpacing(doc);
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 导出全部员工某周 PDF（manager 和 admin 都可以）
router.get('/all', managerOnly, async (req, res) => {
  const { week_start } = req.query;

  if (!isValidWeekStart(week_start)) {
    return res.status(400).json({ error: 'A valid week_start date is required' });
  }

  try {
    const result = await db.query(
      `SELECT ar.*, u.name, u.employee_no, u.department
       FROM check_ins ar
       JOIN users u ON ar.user_id = u.id
       WHERE ar.check_date >= $1
         AND ar.check_date < $1::date + INTERVAL '7 days'
       ORDER BY u.department, u.name, ar.check_date`,
      [week_start]
    );

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition',
      `attachment; filename="attendance_all_${week_start}.pdf"`);
    doc.pipe(res);

    renderReportHeader(doc, 'Full Staff Attendance Report', week_start);

    if (result.rows.length === 0) {
      renderEmptyState(doc, 'No attendance records were found for the selected week.');
      doc.end();
      return;
    }

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
        const date = fmtDate(r.check_date);
        doc.text(
          `${date}    Start: ${fmt(r.clock_in)}    End: ${fmt(r.clock_out)}    Break: ${r.break_hours_rounded}h    Status: ${r.status === 'modified' ? 'Modified' : 'Normal'}`
        );
        ensureSpacing(doc);
      });
      doc.moveDown();
      ensureSpacing(doc, 700);
    });

    doc.end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
