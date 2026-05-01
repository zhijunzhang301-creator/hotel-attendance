import { useCallback, useEffect, useState } from 'react';
import api from '../api';

const getTorontoDateKey = (value = new Date()) =>
  new Date(value).toLocaleDateString('en-CA', { timeZone: 'America/Toronto' });

const getRecordDateKey = (value) => {
  if (!value) return '';
  return typeof value === 'string' ? value.slice(0, 10) : getTorontoDateKey(value);
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
  : '--:--';

export default function ClockPage() {
  const name = localStorage.getItem('name');
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState(null);
  const [breakMin, setBreakMin] = useState(0);
  const [loading, setLoading] = useState(false);
  const [weekRecords, setWeekRecords] = useState([]);
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [passwordLoading, setPasswordLoading] = useState(false);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchToday = useCallback(async () => {
    try {
      const { data } = await api.get('/attendance/my-week');
      const today = getTorontoDateKey();
const todayRecord = data.find((r) => getRecordDateKey(r.check_date) === today);
      setStatus(todayRecord || null);
      setWeekRecords(data);
      setBreakMin(todayRecord?.break_minutes || 0);
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Unable to load attendance data';
      showMessage(errMsg, 'error');
    }
  }, []);

  useEffect(() => {
    fetchToday();
  }, [fetchToday]);

  const handleAction = async (action) => {
    setLoading(true);
    try {
      if (action === 'clock-in') {
        const { data } = await api.post('/attendance/clock-in');
        showMessage(`Signed in at ${fmt(data.time)}`, 'success');
      } else if (action === 'clock-out') {
        const { data } = await api.post('/attendance/clock-out');
        showMessage(`Signed out at ${fmt(data.time)}`, 'success');
      } else if (action === 'break') {
        const { data } = await api.post('/attendance/break', { minutes: breakMin });
        showMessage(`Break time saved: ${data.break_hours_rounded}h`, 'success');
      }
      await fetchToday();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Operation failed';
      showMessage(errMsg, 'error');
    } finally {
      setLoading(false);
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
    } catch (err) {
      const errMsg = err.response?.data?.error || 'Unable to update password';
      showMessage(errMsg, 'error');
    } finally {
      setPasswordLoading(false);
    }
  };

  const adjustBreak = (delta) => {
    setBreakMin((current) => Math.max(0, current + delta));
  };

  const workHours = () => {
    if (!status?.clock_in || !status?.clock_out) return null;
    const diff = (new Date(status.clock_out) - new Date(status.clock_in)) / 3600000;
    const net = diff - (status.break_hours_rounded || 0);
    return net.toFixed(1);
  };

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
    timeZone: 'America/Toronto',
  });

  const greeting = getGreeting();
  const selectedBreakHours = (breakMin / 60).toFixed(1);

  return (
    <div
      className="min-h-screen p-4 max-w-sm mx-auto"
      style={{ background: 'linear-gradient(160deg, #f2f2f7 0%, #e8e8ed 100%)' }}
    >
      <div className="flex justify-between items-start pt-2 pb-6">
        <div>
          <p className="text-xs text-gray-400 font-medium">{dateStr}</p>
          <h1 className="text-xl font-semibold text-gray-900 mt-0.5">{greeting}, {name}</h1>
          <p className="text-xs text-gray-400 mt-1">Sign-in rounds up. Sign-out rounds down. Breaks move in 0.5-hour steps.</p>
        </div>
        <button
          onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
          className="text-xs text-gray-400 bg-white/60 backdrop-blur px-3 py-1.5 rounded-full border border-gray-200"
        >
          Quit
        </button>
      </div>

      <div className="glass-card p-5 mb-4">
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Today's attendance check</p>
          {workHours() && (
            <span
              className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(52,199,89,0.12)', color: '#34C759' }}
            >
              Net {workHours()}h
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Sign-in', value: fmt(status?.clock_in), color: '#007AFF' },
            { label: 'Break', value: status?.break_hours_rounded != null ? `${status.break_hours_rounded}h` : '--', color: '#FF9500' },
            { label: 'Sign-out', value: fmt(status?.clock_out), color: '#34C759' },
          ].map((item) => (
            <div key={item.label} className="bg-gray-50 rounded-2xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">{item.label}</p>
              <p className="text-base font-semibold" style={{ color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card p-5 mb-4 space-y-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Actions</p>

        <button
          onClick={() => handleAction('clock-in')}
          disabled={loading || !!status?.clock_in}
          className="w-full py-4 rounded-2xl text-sm font-semibold text-white disabled:opacity-35"
          style={{ background: status?.clock_in ? '#8E8E93' : 'linear-gradient(135deg, #007AFF, #5856D6)' }}
        >
          {status?.clock_in ? `Signed in at ${fmt(status.clock_in)}` : 'Sign In'}
        </button>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-700">Break time</p>
            <span className="text-sm text-gray-500">{selectedBreakHours}h</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => adjustBreak(-30)}
              disabled={loading || breakMin === 0}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 disabled:opacity-35"
            >
              -0.5h
            </button>
            <button
              onClick={() => adjustBreak(30)}
              disabled={loading}
              className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700"
            >
              +0.5h
            </button>
            <button
              onClick={() => handleAction('break')}
              disabled={loading || !status?.clock_in}
              className="flex-1 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-35"
              style={{ background: 'linear-gradient(135deg, #FF9500, #FF6B00)' }}
            >
              Save Break
            </button>
          </div>
        </div>

        <button
          onClick={() => handleAction('clock-out')}
          disabled={loading || !status?.clock_in || !!status?.clock_out}
          className="w-full py-4 rounded-2xl text-sm font-semibold disabled:opacity-35"
          style={{
            background: status?.clock_out ? '#8E8E93' : 'rgba(52,199,89,0.12)',
            color: status?.clock_out ? 'white' : '#34C759',
          }}
        >
          {status?.clock_out ? `Signed out at ${fmt(status.clock_out)}` : 'Sign Out'}
        </button>
      </div>

      <div className="glass-card p-5 mb-4 space-y-3">
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
          disabled={
            passwordLoading ||
            !passwordForm.current_password ||
            !passwordForm.new_password ||
            !passwordForm.confirm_password
          }
          className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-35"
          style={{ background: 'linear-gradient(135deg, #111827, #374151)' }}
        >
          {passwordLoading ? 'Updating Password...' : 'Update Password'}
        </button>
      </div>

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

      <div className="glass-card p-5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">This Week's Log</p>
        {weekRecords.length === 0 ? (
          <p className="text-sm text-gray-300 text-center py-4">No records for this week</p>
        ) : (
          weekRecords.map((r) => (
            <div key={r.id} className="py-3 border-b border-gray-100 last:border-0">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-400">
{new Date(r.check_date).toLocaleDateString('en-CA', {
                    weekday: 'short',
                    day: 'numeric',
                    timeZone: 'America/Toronto',
                  })}
                </span>
                <span className="text-xs text-gray-600">{fmt(r.clock_in)} - {fmt(r.clock_out)}</span>
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,149,0,0.1)', color: '#FF9500' }}>
                  Break {r.break_hours_rounded}h
                </span>
                <span className="text-xs text-gray-500">
                  Net {r.clock_in && r.clock_out ? (((new Date(r.clock_out) - new Date(r.clock_in)) / 3600000) - (r.break_hours_rounded || 0)).toFixed(1) : '--'}h
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
