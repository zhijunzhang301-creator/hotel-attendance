import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [form, setForm] = useState({ employee_no: '', password: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    try {
      const { data } = await api.post('/auth/login', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('name', data.name);
      localStorage.setItem('role', data.role);
      navigate(data.role === 'admin' ? '/admin' : '/');
    } catch (err) {
      setError(err.response?.data?.error || '登录失败');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">员工签到系统</h1>
        <p className="text-gray-500 text-sm mb-6">请使用工号登录</p>
        <input
          className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-3 text-sm"
          placeholder="工号"
          value={form.employee_no}
          onChange={e => setForm({...form, employee_no: e.target.value})}
        />
        <input
          type="password"
          className="w-full border border-gray-200 rounded-xl px-4 py-3 mb-4 text-sm"
          placeholder="密码"
          value={form.password}
          onChange={e => setForm({...form, password: e.target.value})}
        />
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <button
          onClick={handleLogin}
          className="w-full bg-gray-900 text-white rounded-xl py-3 text-sm font-medium"
        >
          登录
        </button>
      </div>
    </div>
  );
}