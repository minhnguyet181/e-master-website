import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export default function ProtectedRoute({ children, requireAdmin, forbidAdmin }) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    // If user is not logged in, but tries to access protected pages, send them to login
    return <Navigate to="/login" replace />;
  }
  
  let role = '';
  try {
    const decoded = jwtDecode(token);
    role = String(decoded.role || '').toLowerCase();
  } catch (err) {
    // If token is invalid
    localStorage.removeItem('token');
    return <Navigate to="/login" replace />;
  }

  // If the route is for admin only, but user is not admin
  if (requireAdmin && role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  // If the route is for regular users only, but user is admin
  if (forbidAdmin && role === 'admin') {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
