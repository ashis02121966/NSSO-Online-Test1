import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NetworkProvider } from './contexts/NetworkContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { ZODashboard } from './pages/ZODashboard';
import { RODashboard } from './pages/RODashboard';
import { SupervisorDashboard } from './pages/SupervisorDashboard';
import { EnumeratorDashboard } from './pages/EnumeratorDashboard';
import { TeamResults } from './pages/TeamResults';
import { MyEnumerators } from './pages/MyEnumerators';
import { Users } from './pages/Users';
import { Roles } from './pages/Roles';
import { Surveys } from './pages/Surveys';
import { Questions } from './pages/Questions';
import { Results } from './pages/Results';
import { EnumeratorStatusPage } from './pages/EnumeratorStatus';
import { Certificates } from './pages/Certificates';
import { Settings } from './pages/Settings';
import { AvailableTests } from './pages/AvailableTests';
import { MyResults } from './pages/MyResults';
import { MyCertificates } from './pages/MyCertificates';
import { TestSchedule } from './pages/TestSchedule';
import { TestInterface } from './pages/TestInterface';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  const getDashboardRoute = () => {
    if (!user) return '/dashboard';
    
    console.log('Getting dashboard route for user role:', user.role.name);
    switch (user.role.name.toLowerCase()) {
      case 'admin':
        return '/dashboard';
      case 'zo user':
        return '/zo-dashboard';
      case 'ro user':
        return '/ro-dashboard';
      case 'supervisor':
        return '/supervisor-dashboard';
      case 'enumerator':
        return '/enumerator-dashboard';
      default:
        console.log('Unknown role, defaulting to dashboard');
        return '/dashboard';
    }
  };

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      
      {/* Admin Routes */}
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/users" element={
        <ProtectedRoute>
          <Users />
        </ProtectedRoute>
      } />
      <Route path="/roles" element={
        <ProtectedRoute>
          <Roles />
        </ProtectedRoute>
      } />
      <Route path="/surveys" element={
        <ProtectedRoute>
          <Surveys />
        </ProtectedRoute>
      } />
      <Route path="/questions" element={
        <ProtectedRoute>
          <Questions />
        </ProtectedRoute>
      } />
      <Route path="/settings" element={
        <ProtectedRoute>
          <Settings />
        </ProtectedRoute>
      } />

      {/* ZO Routes */}
      <Route path="/zo-dashboard" element={
        <ProtectedRoute>
          <ZODashboard />
        </ProtectedRoute>
      } />

      {/* RO Routes */}
      <Route path="/ro-dashboard" element={
        <ProtectedRoute>
          <RODashboard />
        </ProtectedRoute>
      } />

      {/* Supervisor Routes */}
      <Route path="/supervisor-dashboard" element={
        <ProtectedRoute>
          <SupervisorDashboard />
        </ProtectedRoute>
      } />
      <Route path="/team-results" element={
        <ProtectedRoute>
          <TeamResults />
        </ProtectedRoute>
      } />
      <Route path="/my-enumerators" element={
        <ProtectedRoute>
          <MyEnumerators />
        </ProtectedRoute>
      } />

      {/* Enumerator Routes */}
      <Route path="/enumerator-dashboard" element={
        <ProtectedRoute>
          <EnumeratorDashboard />
        </ProtectedRoute>
      } />
      <Route path="/available-tests" element={
        <ProtectedRoute>
          <AvailableTests />
        </ProtectedRoute>
      } />
      <Route path="/my-results" element={
        <ProtectedRoute>
          <MyResults />
        </ProtectedRoute>
      } />
      <Route path="/my-certificates" element={
        <ProtectedRoute>
          <MyCertificates />
        </ProtectedRoute>
      } />
      <Route path="/test-schedule" element={
        <ProtectedRoute>
          <TestSchedule />
        </ProtectedRoute>
      } />

      {/* Test Interface */}
      <Route path="/test/:sessionId" element={
        <ProtectedRoute>
          <TestInterface />
        </ProtectedRoute>
      } />

      {/* Shared Routes */}
      <Route path="/results" element={
        <ProtectedRoute>
          <Results />
        </ProtectedRoute>
      } />
      <Route path="/enumerator-status" element={
        <ProtectedRoute>
          <EnumeratorStatusPage />
        </ProtectedRoute>
      } />
      <Route path="/certificates" element={
        <ProtectedRoute>
          <Certificates />
        </ProtectedRoute>
      } />

      <Route path="/" element={<Navigate to={getDashboardRoute()} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <NetworkProvider>
        <Router>
          <AppRoutes />
        </Router>
      </NetworkProvider>
    </AuthProvider>
  );
}

export default App;