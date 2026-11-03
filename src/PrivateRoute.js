import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('role');
  const location = useLocation();
  const [mockCheck, setMockCheck] = useState('checking');

  useEffect(() => {
    const checkMockData = async () => {
      if (location.pathname === '/mock-ratings' && userRole === 'student') {
        try {
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/mock-ratings/mine`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.data && res.data.length > 0) {
            setMockCheck('allowed');
          } else {
            setMockCheck('redirect');
          }
        } catch {
          setMockCheck('redirect');
        }
      } else {
        setMockCheck('allowed');
      }
    };
    checkMockData();
  }, [location.pathname, userRole, token]);

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (mockCheck === 'checking') {
    return <div className="p-10 text-center font-bold text-gray-500">Loading...</div>;
  }

  if ((allowedRoles && !allowedRoles.includes(userRole)) || mockCheck === 'redirect') {
    if (userRole === 'admin' || userRole === 'superadmin') return <Navigate to="/admin" replace />;
    if (userRole === 'trainer') return <Navigate to="/trainer" replace />;
    if (userRole === 'promotional') return <Navigate to="/promo-dashboard" replace />;
    if (userRole === 'campus_student') return <Navigate to="/campus-portal" replace />;
    return <Navigate to="/" replace />; 
  }

  if (location.pathname !== '/login' && location.pathname !== '/register') {
    localStorage.setItem('lastVisitedPage', location.pathname);
  }

  return children;
};

export default PrivateRoute;