import { useState, useEffect, useCallback } from 'react';
import api from '../api';

export default function ClockPage() {
  const name = localStorage.getItem('name');
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState(null); // { text, type: 'success'|'error' }
  const [breakMin, setBreakMin] = useState('');
  const [loading, setLoading] = useState(false);
  const [weekRecords, setWeekRecords] = useState([]);

  const fetchToday = useCallback(async () => {
    try {
      const { data } = await api.get('/attendance/my-week');
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = data.find(r => r.record_date.startsWith(today));
      setStatus(todayRecord || null);
      setWeekRecords(data);
    } catch {}
  }, []);

  useEffect(() => { fetchToday(); }, [fetchToday]);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAction = async (action) => {
    setLoading(true);
    try {
      if (action === 'clock-in') {
        await api.post('/attendance/clock-in');
        showMessage('Sign-in successful', 'success');
      } else if (action === 'clock-out') {
        await api.post('/attendance/clock-out');
        showMessage('Sign-out successful', 'success');
      } else if (action === 'break') {
        const { data } = await api.post('/attendance/break', { minutes: breakMin });
        showMessage(`Rest has been recorded: ${data.break_hours_rounded}h`, 'success');
        setBreakMin('');
      }
      fetchToday();
    } catch (err) {
      const errMsg = err.response?.data?.error || 'operation failure❌';
      showMessage(errMsg, 'error');
    }
    setLoading(false);
  };

  const fmt = (ts) => ts
    ? new Date(ts).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
    : '--:--';

  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' });

  const workHours = () => {
    if (!status?.clock_in || !status?.clock_out) return null;
    const diff = (new Date(status.clock_out) - new Date(status.clock_in)) / 3600000;
    const net = diff - (status.break_hours_rounded || 0);
    return net.toFixed(1);
  };

  return (
    <div className="min-h-screen p-4 max-w-sm mx-auto"
      style={{ background: 'linear-gradient(160deg, #f2f2f7 0%, #e8e8ed 100%)' }}>

      {/* 顶部 */}
      <div className="flex justify-between items-start pt-2 pb-6">
        <div>
          <p className="text-xs text-gray-400 font-medium">{dateStr}</p>
          <h1 className="text-xl font-semibold text-gray-900 mt-0.5">Hello! {name}</h1>
        </div>
        <button
          onClick={() => { localStorage.clear(); window.location.href = '/login'; }}
          className="text-xs text-gray-400 bg-white/60 backdrop-blur px-3 py-1.5 rounded-full border border-gray-200"
        >Quit</button>
      </div>

      {/* 今日状态大卡片 */}
      <div className="glass-card p-5 mb-4">
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Today's attendance check</p>
          {workHours() && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
              style={{ background: 'rgba(52,199,89,0.12)', color: '#34C759' }}>
              Actual {workHours()}h
            </span>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'Sign-in', value: fmt(status?.clock_in), color: '#007AFF' },
            { label: 'Break', value: status?.break_hours_rounded != null ? `${status.break_hours_rounded}h` : '--', color: '#FF9500' },
            { label: 'Sign-out', value: fmt(status?.clock_out), color: '#34C759' },
          ].map(item => (
            <div key={item.label} className="bg-gray-50 rounded-2xl p-3 text-center">
              <p className="text-xs text-gray-400 mb-1">{item.label}</p>
              <p className="text-base font-semibold" style={{ color: item.color }}>{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 操作区 */}
      <div className="glass-card p-5 mb-4 space-y-3">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">操作</p>

        <button
          onClick={() => handleAction('clock-in')}
          disabled={loading || !!status?.clock_in}
          className="w-full py-4 rounded-2xl text-sm font-semibold text-white disabled:opacity-35"
          style={{ background: status?.clock_in ? '#8E8E93' : 'linear-gradient(135deg, #007AFF, #5856D6)' }}
        >
          {status?.clock_in ? `Sign-in successful!  ${fmt(status.clock_in)}` : 'Sign in'}
        </button>

        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Duration of rest (minutes)"
            value={breakMin}
            onChange={e => setBreakMin(e.target.value)}
            className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm"
          />
          <button
            onClick={() => handleAction('break')}
            disabled={loading || !status?.clock_in || !breakMin}
            className="px-5 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-35"
            style={{ background: 'linear-gradient(135deg, #FF9500, #FF6B00)' }}
          >Record</button>
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
          {status?.clock_out ? `Sign-out successful!  ${fmt(status.clock_out)}` : 'Sign out'}
        </button>
      </div>

      {/* Toast 消息 */}
      {message && (
        <div
          className="fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-2xl text-sm font-medium text-white shadow-apple-lg"
          style={{
            background: message.type === 'success'
              ? 'rgba(52,199,89,0.95)'
              : 'rgba(255,59,48,0.95)',
            backdropFilter: 'blur(20px)',
            whiteSpace: 'nowrap',
          }}
        >
          {message.type === 'success' ? '✓ ' : '✗ '}{message.text}
        </div>
      )}

      {/* 本周记录 */}
      <div className="glass-card p-5">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-3">This Week's Log</p>
        {weekRecords.length === 0
          ? <p className="text-sm text-gray-300 text-center py-4">No records for this week</p>
          : weekRecords.map(r => (
            <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
              <span className="text-xs font-medium text-gray-400 w-16">
                {new Date(r.record_date).toLocaleDateString('zh-CN', { weekday: 'short', day: 'numeric' })}
              </span>
              <span className="text-xs text-gray-600">{fmt(r.clock_in)} — {fmt(r.clock_out)}</span>
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(255,149,0,0.1)', color: '#FF9500' }}>
                Break {r.break_hours_rounded}h
              </span>
            </div>
          ))
        }
      </div>
    </div>
  );
}