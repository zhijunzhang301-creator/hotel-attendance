import { useState, useEffect } from 'react';
import api from '../api';

export default function ClockPage() {
  const name = localStorage.getItem('name');
  const [status, setStatus] = useState(null);   // 今天的记录
  const [message, setMessage] = useState('');
  const [breakMin, setBreakMin] = useState('');
  const [loading, setLoading] = useState(false);
  const [wifiBlocked, setWifiBlocked] = useState(false);
  const [weekRecords, setWeekRecords] = useState([]);

  useEffect(() => { fetchToday(); fetchWeek(); }, []);

  const fetchToday = async () => {
    const { data } = await api.get('/attendance/my-week');
    const today = new Date().toISOString().split('T')[0];
    const todayRecord = data.find(r => r.record_date.startsWith(today));
    setStatus(todayRecord || null);
    setWeekRecords(data);
  };

  const fetchWeek = async () => {
    const { data } = await api.get('/attendance/my-week');
    setWeekRecords(data);
  };

  const handleAction = async (action) => {
    setLoading(true);
    setMessage('');
    try {
      if (action === 'clock-in') {
        await api.post('/attendance/clock-in');
        setMessage('✓ 签到成功');
      } else if (action === 'clock-out') {
        await api.post('/attendance/clock-out');
        setMessage('✓ 签离成功');
      } else if (action === 'break') {
        const { data } = await api.post('/attendance/break', { minutes: breakMin });
        setMessage(`✓ 休息已记录：${data.break_hours_rounded}h`);
        setBreakMin('');
      }
      fetchToday();
    } catch (err) {
      const errMsg = err.response?.data?.error || '操作失败';
      if (err.response?.status === 403) setWifiBlocked(true);
      setMessage(`✗ ${errMsg}`);
    }
    setLoading(false);
  };

  const fmt = (ts) => ts ? new Date(ts).toLocaleTimeString('zh-CN', {hour:'2-digit', minute:'2-digit'}) : '--:--';

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-md mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">你好，{name}</h1>
          <p className="text-gray-400 text-sm">{new Date().toLocaleDateString('zh-CN', {weekday:'long', month:'long', day:'numeric'})}</p>
        </div>
        <button
          onClick={() => { localStorage.clear(); window.location.href='/login'; }}
          className="text-gray-400 text-sm"
        >退出</button>
      </div>

      {wifiBlocked && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-red-600 text-sm">
          请连接酒店员工 WiFi 后再操作
        </div>
      )}

      {/* 今日状态卡片 */}
      <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
        <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">今日记录</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-gray-400 mb-1">上班</p>
            <p className="text-lg font-bold text-gray-900">{fmt(status?.clock_in)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">休息</p>
            <p className="text-lg font-bold text-gray-900">{status?.break_hours_rounded ?? '--'}h</p>
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1">下班</p>
            <p className="text-lg font-bold text-gray-900">{fmt(status?.clock_out)}</p>
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="space-y-3 mb-4">
        <button
          onClick={() => handleAction('clock-in')}
          disabled={loading || !!status?.clock_in}
          className="w-full bg-gray-900 text-white rounded-xl py-4 font-medium disabled:opacity-40"
        >
          {status?.clock_in ? '已签到' : '上班签到'}
        </button>

        <div className="flex gap-2">
          <input
            type="number"
            placeholder="休息分钟数"
            value={breakMin}
            onChange={e => setBreakMin(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm"
          />
          <button
            onClick={() => handleAction('break')}
            disabled={loading || !status?.clock_in || !breakMin}
            className="bg-blue-50 text-blue-700 rounded-xl px-5 py-3 text-sm font-medium disabled:opacity-40"
          >记录</button>
        </div>

        <button
          onClick={() => handleAction('clock-out')}
          disabled={loading || !status?.clock_in || !!status?.clock_out}
          className="w-full bg-red-50 text-red-700 rounded-xl py-4 font-medium disabled:opacity-40"
        >
          {status?.clock_out ? '已签离' : '下班签离'}
        </button>
      </div>

      {message && (
        <div className={`rounded-xl p-3 text-sm text-center mb-4 ${message.startsWith('✓') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
          {message}
        </div>
      )}

      {/* 本周记录 */}
      <div className="bg-white rounded-2xl p-5 shadow-sm">
        <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">本周记录</p>
        {weekRecords.length === 0 && <p className="text-gray-400 text-sm">本周暂无记录</p>}
        {weekRecords.map(r => (
          <div key={r.id} className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
            <span className="text-sm text-gray-500">{new Date(r.record_date).toLocaleDateString('zh-CN', {weekday:'short', month:'numeric', day:'numeric'})}</span>
            <span className="text-sm">{fmt(r.clock_in)} — {fmt(r.clock_out)}</span>
            <span className="text-xs text-gray-400">休息 {r.break_hours_rounded}h</span>
          </div>
        ))}
      </div>
    </div>
  );
}