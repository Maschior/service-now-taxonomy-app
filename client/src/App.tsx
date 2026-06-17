import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import HomePage from './pages/HomePage';
import AdminDashboard from './pages/AdminDashboard';
import ClosuresPage from './pages/ClosuresPage';
import ManageApplications from './components/ManageApplications';
import ManageModules from './components/ManageModules';
import ManageIncidents from './components/ManageIncidents';
import ManageActions from './components/ManageActions';
import ManageTags from './components/ManageTags';
import ThreeColumnLayout from './components/ThreeColumnLayout';
import { ErrorBoundary } from './components/ErrorBoundary';
import TabBar from './components/TabBar';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import { Profile } from './pages/Profile';
import { ManageUsers } from './components/ManageUsers';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { token } = useAuth();
  if (token) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { token, user } = useAuth();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role !== 'ADMIN') {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
};

function TopNav() {
  const location = useLocation();
  if (location.pathname !== '/') return null;
  return (
    <div className="w-full sticky top-0 z-40 bg-[var(--bg-secondary)] shadow-sm">
      <TabBar />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 w-full min-w-0 flex flex-col relative">
          <TopNav />
          <main className="flex-1 w-full px-4 md:px-8 py-6">
            <ErrorBoundary>
              <Routes>
                <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
                <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
                <Route path="/closures" element={<ProtectedRoute><ThreeColumnLayout><ClosuresPage /></ThreeColumnLayout></ProtectedRoute>} />
                <Route path="/admin" element={<AdminRoute><ThreeColumnLayout><AdminDashboard /></ThreeColumnLayout></AdminRoute>} />
                <Route path="/manage/applications" element={<ProtectedRoute><ThreeColumnLayout><ManageApplications /></ThreeColumnLayout></ProtectedRoute>} />
                <Route path="/manage/modules" element={<ProtectedRoute><ThreeColumnLayout><ManageModules /></ThreeColumnLayout></ProtectedRoute>} />
                <Route path="/manage/incidents" element={<ProtectedRoute><ThreeColumnLayout><ManageIncidents /></ThreeColumnLayout></ProtectedRoute>} />
                <Route path="/manage/actions" element={<ProtectedRoute><ThreeColumnLayout><ManageActions /></ThreeColumnLayout></ProtectedRoute>} />
                <Route path="/manage/tags" element={<ProtectedRoute><ThreeColumnLayout><ManageTags /></ThreeColumnLayout></ProtectedRoute>} />
                <Route path="/manage/users" element={<AdminRoute><ThreeColumnLayout><ManageUsers /></ThreeColumnLayout></AdminRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ThreeColumnLayout><Profile /></ThreeColumnLayout></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>

            </ErrorBoundary>
          </main>
          <footer className="py-3 mt-auto glass-surface w-full text-center text-[11px] text-[var(--text-secondary)] flex justify-center items-center gap-2 transition-opacity cursor-default" style={{ borderLeft: 'none', borderRight: 'none', borderBottom: 'none' }}>
            <span>Autor: <strong className="font-semibold text-[var(--text-primary)]">Matheus Delmaschio</strong></span>
            <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]"></span>
            <span>Team: <strong className="font-semibold text-[var(--text-primary)]">Softtek</strong></span>
          </footer>
        </div>
      </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

