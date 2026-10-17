import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children, role }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  const location = useLocation();

  if (!token) return <Navigate to="/login" replace />;

  // STRICT LOCK: Campus Drive students can ONLY access /campus-portal
  if (userRole === 'campus_student' && location.pathname !== '/campus-portal') {
    return <Navigate to="/campus-portal" replace />;
  }

  // Regular students cannot open /campus-portal
  if (location.pathname === '/campus-portal' && userRole !== 'campus_student') {
    return <Navigate to="/" replace />;
  }

  // Role-specific guards
  if (role === 'admin' && userRole !== 'admin' && userRole !== 'superadmin') {
    return <Navigate to="/" replace />;
  }
  if (role === 'trainer' && userRole !== 'trainer') {
    return <Navigate to="/" replace />;
  }
  if (role === 'promotional' && !['promotional', 'admin', 'superadmin'].includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default PrivateRoute;