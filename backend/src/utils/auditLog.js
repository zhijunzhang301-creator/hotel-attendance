const db = require('../db');

async function logAudit({
  operatorId = null,
  action,
  targetRecordId = null,
  oldValue = null,
  newValue = null,
  ipAddress = null,
}) {
  if (!action) return;

  try {
    await db.query(
      `INSERT INTO audit_logs
        (operator_id, action, target_record_id, old_value, new_value, ip_address)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [operatorId, action, targetRecordId, oldValue, newValue, ipAddress]
    );
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

module.exports = logAudit;
