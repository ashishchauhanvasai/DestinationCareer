
import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, role }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');

  if (!token) return <Navigate to="/login" replace />;
  if (role === 'admin' && userRole !== 'admin' && userRole !== 'superadmin') return <Navigate to="/" replace />;
  if (role === 'trainer' && userRole !== 'trainer') return <Navigate to="/" replace />;

  return children;
};
export default PrivateRoute;