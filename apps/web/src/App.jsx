import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext.jsx';
import ProtectedRoute from '@/components/ProtectedRoute.jsx';
import ProtectedLayout from '@/components/ProtectedLayout.jsx';
import LoginPage from '@/pages/LoginPage.jsx';
import DashboardPage from '@/pages/DashboardPage.jsx';
import ServerAdminsPage from '@/pages/ServerAdminsPage.jsx';
import UserProfilePage from '@/pages/UserProfilePage.jsx';
import VIPsPage from '@/pages/VIPsPage.jsx';
import BansPage from '@/pages/BansPage.jsx';
import PanelUsersPage from '@/pages/PanelUsersPage.jsx';
import ServersPage from '@/pages/ServersPage.jsx';
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
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />}
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <DashboardPage />
            </ProtectedLayout>
          </ProtectedRoute>
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
        path="/server-admins"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <ProtectedLayout>
              <ServerAdminsPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/vips"
        element={
          <ProtectedRoute allowedRoles={['Administrator']}>
            <ProtectedLayout>
              <VIPsPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/bans"
        element={
          <ProtectedRoute allowedRoles={['Administrator', 'Senior Moderator', 'Moderator']}>
            <ProtectedLayout>
              <BansPage />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/servers"
        element={
          <ProtectedRoute allowedRoles={['Administrator', 'Senior Moderator']}>
            <ProtectedLayout>
              <ServersPage />
            </ProtectedLayout>
          </ProtectedRoute>
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
        path="/"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
      />
      <Route
        path="*"
        element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />}
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