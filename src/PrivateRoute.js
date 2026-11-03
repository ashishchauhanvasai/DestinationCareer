import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  const location = useLocation();

  // 1. If not logged in, send to login but remember where they were trying to go
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. If the route has specific allowed roles and the user doesn't match
  // Bounce them safely to their specific default dashboard (fixes the blank page issue!)
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole === 'admin' || userRole === 'superadmin') return <Navigate to="/admin" replace />;
    if (userRole === 'trainer') return <Navigate to="/trainer" replace />;
    if (userRole === 'promotional') return <Navigate to="/promo-dashboard" replace />;
    if (userRole === 'campus_student') return <Navigate to="/campus-portal" replace />;
    
    // Default fallback for standard students
    return <Navigate to="/" replace />; 
  }

  // 3. Save the current valid path to the "Stack" (localStorage) so we remember it for next time
  if (location.pathname !== '/login' && location.pathname !== '/register') {
    localStorage.setItem('lastVisitedPage', location.pathname);
  }

  // If everything is correct, render the requested page
  return children;
};

export default PrivateRoute;