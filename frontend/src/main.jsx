import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Login from './pages/Login';
import ClockPage from './pages/ClockPage';
import AdminPage from './pages/AdminPage';
import PrivateRoute from './PrivateRoute';
import './index.css';

function HomeRedirect() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) return <Navigate to="/login" replace />;
  return <Navigate to={role === 'admin' || role === 'manager' ? '/admin' : '/clock'} replace />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/clock" element={<PrivateRoute allowedRoles={['staff']}><ClockPage /></PrivateRoute>} />
      <Route path="/admin" element={<PrivateRoute allowedRoles={['admin', 'manager']}><AdminPage /></PrivateRoute>} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  </BrowserRouter>
);
