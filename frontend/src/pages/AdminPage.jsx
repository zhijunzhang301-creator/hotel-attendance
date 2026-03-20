import { useState } from 'react';
import api from '../api';

export default function AdminPage() {
  const [weekStart, setWeekStart] = useState('');
  const [records, setRecords] = useState([]);
  const [editing, setEditing] = useState(null);

  const fetchWeekly = async () => {
    const { data } = await api.get(`/admin/weekly?week_start=${weekStart}`);
    setRecords(data);
  };

  const saveEdit = async () => {
    await api.put(`/admin/record/${editing.id}`, editing);
    setEditing(null);
    fetchWeekly();
  };

  const fmt = (ts) => ts ? new Date(ts).toLocaleTimeString('zh-CN', {hour:'2-digit', minute:'2-digit'}) : '--';

  return (
    <div className="min-h-screen bg-gray-50 p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4">管理后台</h1>

      <div className="flex gap-2 mb-4">
        <input type="date" value={weekStart} onChange={e => setWeekStart(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2 text-sm flex-1"/>
        <button onClick={fetchWeekly}
          className="bg-gray-900 text-white rounded-xl px-5 py-2 text-sm">
          查询
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              {['姓名','日期','上班','下班','休息','状态','操作'].map(h => (
                <th key={h} className="px-3 py-3 text-left text-xs text-gray-400 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {records.map(r => (
              <tr key={r.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-3 py-3">{r.name}</td>
                <td className="px-3 py-3 text-gray-400">{r.record_date?.slice(5,10)}</td>
                <td className="px-3 py-3">{fmt(r.clock_in)}</td>
                <td className="px-3 py-3">{fmt(r.clock_out)}</td>
                <td className="px-3 py-3">{r.break_hours_rounded}h</td>
                <td className="px-3 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${r.status === 'modified' ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>
                    {r.status === 'modified' ? '已修改' : '正常'}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <button onClick={() => setEditing({...r})}
                    className="text-blue-500 text-xs">编辑</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 编辑弹窗 */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <h3 className="font-bold mb-4">修改记录 — {editing.name}</h3>
            {['clock_in','clock_out'].map(field => (
              <div key={field} className="mb-3">
                <label className="text-xs text-gray-400 block mb-1">{field === 'clock_in' ? '上班时间' : '下班时间'}</label>
                <input type="datetime-local"
                  value={editing[field] ? new Date(editing[field]).toISOString().slice(0,16) : ''}
                  onChange={e => setEditing({...editing, [field]: e.target.value})}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"/>
              </div>
            ))}
            <div className="mb-4">
              <label className="text-xs text-gray-400 block mb-1">休息分钟数</label>
              <input type="number"
                value={editing.break_minutes || ''}
                onChange={e => setEditing({...editing, break_minutes: e.target.value})}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"/>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditing(null)}
                className="flex-1 border border-gray-200 rounded-xl py-2 text-sm">取消</button>
              <button onClick={saveEdit}
                className="flex-1 bg-gray-900 text-white rounded-xl py-2 text-sm">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}