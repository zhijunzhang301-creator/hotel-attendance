import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [form, setForm] = useState({ employee_no: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('name', data.name);
      localStorage.setItem('role', data.role);
      navigate(data.role === 'admin' || data.role === 'manager' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(160deg, #f2f2f7 0%, #e8e8ed 100%)' }}>

      <div className="w-full max-w-sm">
        {/* Logo 区域 */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #007AFF, #5856D6)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Daily Attendance Record</h1>
          <p className="text-sm text-gray-400 mt-1">Please log in using your employee number!</p>
        </div>

        {/* 登录卡片 */}
        <div className="glass-card p-6">
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-1.5">employee number</label>
              <input
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300"
                placeholder="Enter your employee number"
                value={form.employee_no}
                onChange={e => setForm({...form, employee_no: e.target.value})}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-1.5">Password</label>
              <input
                type="password"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300"
                placeholder="Enter password"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>

          {error && (
            <div className="mt-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-500">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading || !form.employee_no || !form.password}
            className="w-full mt-4 py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: loading ? '#8E8E93' : 'linear-gradient(135deg, #007AFF, #5856D6)' }}
          >
            {loading ? 'Loging in...' : 'Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}