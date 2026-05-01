import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import ProtectedLayout from '@/components/ProtectedLayout.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import DashboardPage from '@/pages/DashboardPage.jsx';
import AdminsPage from '@/pages/AdminsPage.jsx';
import UserProfilePage from '@/pages/UserProfilePage.jsx';
import VIPsPage from '@/pages/VIPsPage.jsx';
import BansPage from '@/pages/BansPage.jsx';
import PanelUsersPage from '@/pages/PanelUsersPage.jsx';
import ServersPage from '@/pages/ServersPage.jsx';
import LogsPage from '@/pages/LogsPage.jsx';
import { Toaster } from '@/components/ui/toaster.jsx';

const AppRoutes = () => {
  const { isAuthenticated, initialLoading } = useAuth();

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="text-[#00FF41] text-xl font-bold animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginPage />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedLayout>
            <DashboardPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <UserProfilePage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admins"
        element={
          <ProtectedLayout>
            <AdminsPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/vips"
        element={
          <ProtectedLayout>
            <VIPsPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/bans"
        element={
          <ProtectedLayout>
            <BansPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/servers"
        element={
          <ProtectedLayout>
            <ServersPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <ProtectedLayout>
              <PanelUsersPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/logs"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <ProtectedLayout>
              <LogsPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />
      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;