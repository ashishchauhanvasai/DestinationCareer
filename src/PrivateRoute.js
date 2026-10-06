// import React from 'react';
// import { Navigate } from 'react-router-dom';

// const PrivateRoute = ({ children, role }) => {
//   // 1. Check for 'token' instead of 'isLoggedIn' to match your app's existing logic
//   const token = localStorage.getItem('token');
//   const userRole = localStorage.getItem('role');

//   // 2. If no token exists, redirect them to the Login page immediately
//   if (!token) {
//     return <Navigate to="/login" replace />;
//   }

//   // 3. If the route requires an Admin, ensure standard students get sent back to the dashboard
//   if (role === 'admin' && userRole !== 'admin' && userRole !== 'superadmin') {
//     return <Navigate to="/" replace />;
//   }

//   // 4. If they pass the checks, let them see the page
//   return children;
// };

// export default PrivateRoute;


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