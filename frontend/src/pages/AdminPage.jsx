import { useEffect, useState } from 'react';
import api from '../api';

const getMonday = () => {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  return d.toISOString().split('T')[0];
};

const getGreeting = () => {
  const hour = Number(new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    hour12: false,
    timeZone: 'America/Toronto',
  }).slice(0, 2));

  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

const fmt = (ts) => ts
  ? new Date(ts).toLocaleTimeString('en-CA', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Toronto',
    })
  : '--';

const fmtDay = (value) => new Date(value).toLocaleDateString('en-CA', {
  month: '2-digit',
  day: '2-digit',
  timeZone: 'America/Toronto',
});

const fmtDateTime = (value) => new Date(value).toLocaleString('en-CA', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'America/Toronto',
});

export default function AdminPage() {
  const [weekStart, setWeekStart] = useState(getMonday());
  const [records, setRecords] = useState([]);
  const [editing, setEditing] = useState(null);
  const [message, setMessage] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [resetRequests, setResetRequests] = useState([]);
  const [resolvingResetId, setResolvingResetId] = useState(null);
  const [generatedReset, setGeneratedReset] = useState(null);
  const canExportAll = ['admin', 'manager'].includes(localStorage.getItem('role'));

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const downloadPdf = async (path, filename) => {
    const token = localStorage.getItem('token');
    const base = import.meta.env.VITE_API_URL || '/api';
    const res = await fetch(`${base}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    if (!res.ok) {
      let messageText = 'Export failed';
      try {
        const data = await res.json();
        messageText = data.error || messageText;
      } catch {}
      throw new Error(messageText);
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const fetchWeekly = async () => {
    try {
      const { data } = await api.get(`/admin/weekly?week_start=${weekStart}`);
      setRecords(data);
    } catch (err) {
      showMessage(err.response?.data?.error || 'Unable to load records', 'error');
    }
  };

  const fetchAuditData = async () => {
    try {
      const [{ data: audit }, { data: requests }] = await Promise.all([
        api.get('/admin/audit?limit=80'),
        api.get('/admin/password-reset-requests'),
      ]);
      setAuditLogs(audit);
      setResetRequests(requests);
    } catch (err) {
      showMessage(err.response?.data?.error || 'Unable to load audit data', 'error');
    }
  };

  useEffect(() => {
    fetchWeekly();
    fetchAuditData();
  }, []);

  const refreshAdminData = async () => {
    await Promise.all([fetchWeekly(), fetchAuditData()]);
  };

  const saveEdit = async () => {
    try {
      await api.put(`/admin/record/${editing.id}`, editing);
      setEditing(null);
      showMessage('Record updated successfully', 'success');
      refreshAdminData();
    } catch (err) {
      showMessage(err.response?.data?.error || 'Unable to update record', 'error');
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      showMessage('New password confirmation does not match', 'error');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.post('/auth/change-password', {
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
      });
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      showMessage('Password updated successfully', 'success');
      fetchAuditData();
    } catch (err) {
      showMessage(err.response?.data?.error || 'Unable to update password', 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const resolveResetRequest = async (requestId) => {
    setResolvingResetId(requestId);
    setGeneratedReset(null);
    try {
      const { data } = await api.post(`/admin/password-reset-requests/${requestId}/resolve`, {});
      setGeneratedReset(data);
      showMessage('Password reset completed', 'success');
      fetchAuditData();
    } catch (err) {
      showMessage(err.response?.data?.error || 'Unable to reset password', 'error');
    } finally {
      setResolvingResetId(null);
    }
  };

  const describeAudit = (log) => {
    switch (log.action) {
      case 'login':
        return `${log.operator_name || 'Unknown'} signed in`;
      case 'clock_in':
        return `${log.operator_name || 'Unknown'} clocked in`;
      case 'clock_out':
        return `${log.operator_name || 'Unknown'} clocked out`;
      case 'modify':
        return `${log.operator_name || 'Unknown'} edited ${log.employee_name || 'a record'}`;
      case 'change_password':
        return `${log.operator_name || 'Unknown'} changed a password`;
      case 'password_reset_request':
        return `${log.new_value?.employee_name || log.new_value?.employee_no || 'An employee'} requested a password reset`;
      case 'password_reset_completed':
        return `${log.operator_name || 'Unknown'} completed a password reset`;
      default:
        return log.action;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-6xl mx-auto">
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide">{getGreeting()}</p>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">Management Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Managers can access this dashboard from any location. Staff reset requests and audit history are shown below.</p>
        </div>
        <button
          onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
          className="text-gray-400 text-sm"
        >
          Quit
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_320px] mb-4">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex gap-2">
            <input
              type="date"
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className="border border-gray-200 rounded-xl px-4 py-2 text-sm flex-1"
            />
            <button onClick={fetchWeekly} className="bg-gray-900 text-white rounded-xl px-5 py-2 text-sm">
              Search
            </button>
            <button onClick={fetchAuditData} className="bg-gray-100 text-gray-700 rounded-xl px-5 py-2 text-sm">
              Refresh Logs
            </button>
            {canExportAll && (
              <button
                onClick={async () => {
                  try {
                    await downloadPdf(`/export/all?week_start=${weekStart}`, `attendance_all_${weekStart}.pdf`);
                    showMessage('Full PDF exported successfully', 'success');
                  } catch (err) {
                    showMessage(err.message || 'Export failed', 'error');
                  }
                }}
                className="bg-green-600 text-white rounded-xl px-5 py-2 text-sm"
              >
                Export All PDF
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4 space-y-3">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Change Password</p>
          <input
            type="password"
            placeholder="Current password"
            value={passwordForm.current_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm"
          />
          <input
            type="password"
            placeholder="New password"
            value={passwordForm.new_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={passwordForm.confirm_password}
            onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm"
          />
          <button
            onClick={handleChangePassword}
            disabled={passwordLoading || !passwordForm.current_password || !passwordForm.new_password || !passwordForm.confirm_password}
            className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-semibold disabled:opacity-35"
          >
            {passwordLoading ? 'Updating Password...' : 'Update Password'}
          </button>
        </div>
      </div>

      {generatedReset && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-4">
          <p className="text-sm font-semibold text-amber-900">Temporary password generated</p>
          <p className="text-sm text-amber-800 mt-1">{generatedReset.employee_name} ({generatedReset.employee_no})</p>
          <p className="text-base font-mono text-amber-900 mt-2">{generatedReset.temporary_password}</p>
          <p className="text-xs text-amber-700 mt-2">Share this once, then ask the employee to change it immediately after signing in.</p>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['Name', 'Date', 'Start', 'End', 'Break', 'Status', 'Action'].map((h) => (
                <th key={h} className="px-3 py-3 text-left text-xs text-gray-400 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-400 text-sm">No records for this week</td>
              </tr>
            )}
            {records.map((r) => (
              <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-3 py-3">{r.name}</td>
                <td className="px-3 py-3 text-gray-400">{fmtDay(r.record_date)}</td>
                <td className="px-3 py-3">{fmt(r.clock_in)}</td>
                <td className="px-3 py-3">{fmt(r.clock_out)}</td>
                <td className="px-3 py-3">{r.break_hours_rounded}h</td>
                <td className="px-3 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${r.status === 'modified' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                    {r.status === 'modified' ? 'Modified' : 'Normal'}
                  </span>
                </td>
                <td className="px-3 py-3 flex gap-2">
                  <button onClick={() => setEditing({ ...r })} className="text-blue-500 text-xs">Edit</button>
                  <button
                    onClick={async () => {
                      try {
                        await downloadPdf(`/export/single/${r.employee_id}?week_start=${weekStart}`, `attendance_${r.employee_no}_${weekStart}.pdf`);
                        showMessage('Employee PDF exported successfully', 'success');
                      } catch (err) {
                        showMessage(err.message || 'Export failed', 'error');
                      }
                    }}
                    className="text-green-500 text-xs"
                  >
                    Export PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Password Reset Requests</h2>
            <span className="text-xs text-gray-400">{resetRequests.length} pending</span>
          </div>
          <div className="space-y-3">
            {resetRequests.length === 0 && (
              <p className="text-sm text-gray-400">No pending reset requests.</p>
            )}
            {resetRequests.map((request) => (
              <div key={request.id} className="border border-gray-100 rounded-2xl p-3">
                <p className="text-sm font-semibold text-gray-900">{request.new_value?.employee_name}</p>
                <p className="text-xs text-gray-500 mt-1">Employee No: {request.new_value?.employee_no}</p>
                <p className="text-xs text-gray-500">Requested: {fmtDateTime(request.created_at)}</p>
                <button
                  onClick={() => resolveResetRequest(request.id)}
                  disabled={resolvingResetId === request.id}
                  className="w-full mt-3 rounded-xl py-2 text-sm font-semibold text-white disabled:opacity-35"
                  style={{ background: 'linear-gradient(135deg, #111827, #374151)' }}
                >
                  {resolvingResetId === request.id ? 'Resetting...' : 'Generate Temporary Password'}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-gray-900">Audit Timeline</h2>
            <span className="text-xs text-gray-400">Latest 80 actions</span>
          </div>
          <div className="space-y-3 max-h-[560px] overflow-y-auto pr-1">
            {auditLogs.length === 0 && (
              <p className="text-sm text-gray-400">No audit records yet.</p>
            )}
            {auditLogs.map((log) => (
              <div key={log.id} className="border border-gray-100 rounded-2xl p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{describeAudit(log)}</p>
                    <p className="text-xs text-gray-500 mt-1">Action: {log.action}</p>
                    {log.employee_name && (
                      <p className="text-xs text-gray-500">Employee: {log.employee_name} {log.employee_no ? `(${log.employee_no})` : ''}</p>
                    )}
                    {log.ip_address && <p className="text-xs text-gray-500">IP: {log.ip_address}</p>}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">{fmtDateTime(log.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold mb-4">Modify log - {editing.name}</h3>
            {['clock_in', 'clock_out'].map((field) => (
              <div key={field} className="mb-3">
                <label className="text-xs text-gray-400 block mb-1">{field === 'clock_in' ? 'Sign-in Time' : 'Sign-out Time'}</label>
                <input
                  type="datetime-local"
                  value={editing[field] ? new Date(editing[field]).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditing({ ...editing, [field]: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
                />
              </div>
            ))}
            <div className="mb-4">
              <label className="text-xs text-gray-400 block mb-1">Break Minutes</label>
              <input
                type="number"
                step="30"
                min="0"
                value={editing.break_minutes || 0}
                onChange={(e) => setEditing({ ...editing, break_minutes: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              />
              <p className="text-xs text-gray-400 mt-1">Use 30-minute steps only.</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(null)} className="flex-1 border border-gray-200 rounded-xl py-2 text-sm">Cancel</button>
              <button onClick={saveEdit} className="flex-1 bg-gray-900 text-white rounded-xl py-2 text-sm">Save</button>
            </div>
          </div>
        </div>
      )}

      {message && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl text-sm font-medium text-white shadow-apple-lg"
          style={{
            background: message.type === 'success' ? 'rgba(52,199,89,0.95)' : 'rgba(255,59,48,0.95)',
            backdropFilter: 'blur(20px)',
            whiteSpace: 'nowrap',
          }}
        >
          {message.type === 'success' ? '✓ ' : '✗ '}
          {message.text}
        </div>
      )}
    </div>
  );
}
