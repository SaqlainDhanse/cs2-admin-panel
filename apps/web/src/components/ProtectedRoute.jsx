
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { currentUser, initialLoading } = useAuth();

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-[#00FF41] text-xl font-bold animate-pulse">Loading...</div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(currentUser.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-red-500 text-xl font-bold">Access Denied</div>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
