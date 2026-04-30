import { Navigate, useLocation } from 'react-router-dom';

export default function PrivateRoute({ children, allowedRoles }) {
  const location = useLocation();
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={role === 'admin' || role === 'manager' ? '/admin' : '/clock'} replace />;
  }

  return children;
}
