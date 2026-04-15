import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navigation } from './components/navigation';
import { LandingPage } from './pages/landing';
import { AboutPage } from './pages/about';
import { LoginPage } from './pages/login';
import { SignupPage } from './pages/signup';
import { DashboardPage } from './pages/dashboard';
import { SkillsPage } from './pages/skills';
import { TestPage } from './pages/test';
import { ResultsPage } from './pages/results';
import { AssessmentsPage } from './pages/assessments';
import { CareersPage } from './pages/careers';
import { AuthProvider, useAuth } from '../lib/AuthContext';
import { ThemeProvider } from '../lib/ThemeContext';

function AppRoutes() {
  const { isAuthenticated, loading, logout } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-primary/30 border-t-primary rounded-full animate-spin"></div>
          <p className="text-sm text-slate-500 font-display">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark font-display">
      <Navigation isAuthenticated={isAuthenticated} onLogout={logout} />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage />
            )
          }
        />
        <Route
          path="/signup"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <SignupPage />
            )
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? <DashboardPage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/skills"
          element={
            isAuthenticated ? <SkillsPage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/test/:skillId"
          element={
            isAuthenticated ? <TestPage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/results"
          element={
            isAuthenticated ? <ResultsPage /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/assessments"
          element={
            isAuthenticated ? <AssessmentsPage /> : <Navigate to="/login" replace />
          }
        />
        <Route path="/careers" element={<CareersPage />} />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </Router>
    </ThemeProvider>
  );
}
