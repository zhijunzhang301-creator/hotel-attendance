import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api';

export default function Login() {
  const [form, setForm] = useState({ employee_no: '', password: '' });
  const [resetForm, setResetForm] = useState({ employee_no: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const autoLoginAttempted = useRef(false);

  const finishLogin = (data) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('name', data.name);
    localStorage.setItem('role', data.role);
    navigate(data.role === 'admin' || data.role === 'manager' ? '/admin' : '/clock', { replace: true });
  };

  const handleLogin = async (payload = form) => {
    setLoading(true);
    setError('');
    setInfo('');
    try {
      const { data } = await api.post('/auth/login', payload);
      finishLogin(data);
    } catch (err) {
      console.log('axios error:', err);
      console.log('response:', err.response);
      console.log('data:', err.response?.data);
      setError(err.response?.data?.error || 'Login failed. Please try again!');
    } finally {
      setLoading(false);
    }
  };

  const handleResetRequest = async () => {
    setResetLoading(true);
    setError('');
    setInfo('');
    try {
      const { data } = await api.post('/auth/request-password-reset', resetForm);
      setInfo(data.message || 'Reset request submitted');
      setShowReset(false);
      setResetForm({ employee_no: '' });
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to submit reset request');
    } finally {
      setResetLoading(false);
    }
  };

  // useEffect(() => {
  //   const token = localStorage.getItem('token');
  //   const role = localStorage.getItem('role');
  //   if (token) {
  //     navigate(role === 'admin' || role === 'manager' ? '/admin' : '/clock', { replace: true });
  //   }
  // }, [navigate]);

  useEffect(() => {
    const employee_no = searchParams.get('employee_no') || '';
    const password = searchParams.get('password') || '';
    const auto = searchParams.get('auto') === '1';

    if (employee_no || password) {
      setForm({ employee_no, password });
    }

    if (auto && employee_no && password && !autoLoginAttempted.current) {
      autoLoginAttempted.current = true;
      handleLogin({ employee_no, password });
    }
  }, [searchParams]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(160deg, #f2f2f7 0%, #e8e8ed 100%)' }}
    >
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div
            className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #007AFF, #5856D6)' }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
              <path
                d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Daily Attendance Record</h1>
          <p className="text-sm text-gray-400 mt-1">Staff sign in on the staff network. Managers and admins can sign in from anywhere.</p>
        </div>

        <div className="glass-card p-6">
          {location.state?.from && (
            <div className="mb-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-xs text-blue-600">
              Please sign in to continue.
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-1.5">Employee Number</label>
              <input
                name="employee_no"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300"
                placeholder="Enter your employee number"
                value={form.employee_no}
                onChange={(e) => setForm({ ...form, employee_no: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wide block mb-1.5">Password</label>
              <input
                name="password"
                type="password"
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300"
                placeholder="Enter password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>

          {error && (
            <div className="mt-3 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-xs text-red-500">
              {error}
            </div>
          )}

          {info && (
            <div className="mt-3 bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-xs text-green-600">
              {info}
            </div>
          )}

          <div className="mt-3 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-xs text-gray-500">
            Staff accounts usually use the employee number as the default password. If it no longer works, send a reset request below.
          </div>

          <button
            // onClick={handleLogin}
            onClick={() => handleLogin()}
            disabled={loading || !form.employee_no || !form.password}
            className="w-full mt-4 py-3.5 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
            style={{ background: loading ? '#8E8E93' : 'linear-gradient(135deg, #007AFF, #5856D6)' }}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>

          <button
            onClick={() => {
              setShowReset((current) => !current);
              setError('');
              setInfo('');
            }}
            className="w-full mt-3 py-3 rounded-xl text-sm font-semibold text-gray-700 bg-gray-100"
          >
            {showReset ? 'Hide Reset Request' : 'Forgot Password?'}
          </button>

          {showReset && (
            <div className="mt-3 space-y-3 border-t border-gray-100 pt-3">
              <p className="text-xs text-gray-500">Submit your employee number and management will see the reset request in the audit dashboard.</p>
              <input
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-300"
                placeholder="Employee number"
                value={resetForm.employee_no}
                onChange={(e) => setResetForm({ employee_no: e.target.value })}
              />
              <button
                onClick={handleResetRequest}
                disabled={resetLoading || !resetForm.employee_no}
                className="w-full py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-40"
                style={{ background: resetLoading ? '#8E8E93' : 'linear-gradient(135deg, #111827, #374151)' }}
              >
                {resetLoading ? 'Submitting...' : 'Send Reset Request'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
