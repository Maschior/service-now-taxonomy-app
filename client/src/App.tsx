import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
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

function App() {
  return (
    <Router>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 w-full px-4 md:px-8 py-6 min-w-0 flex flex-col">
          <div className="flex-1">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/closures" element={<ThreeColumnLayout><ClosuresPage /></ThreeColumnLayout>} />
              <Route path="/admin" element={<ThreeColumnLayout><AdminDashboard /></ThreeColumnLayout>} />
              <Route path="/manage/applications" element={<ThreeColumnLayout><ManageApplications /></ThreeColumnLayout>} />
              <Route path="/manage/modules" element={<ThreeColumnLayout><ManageModules /></ThreeColumnLayout>} />
              <Route path="/manage/incidents" element={<ThreeColumnLayout><ManageIncidents /></ThreeColumnLayout>} />
              <Route path="/manage/actions" element={<ThreeColumnLayout><ManageActions /></ThreeColumnLayout>} />
              <Route path="/manage/tags" element={<ThreeColumnLayout><ManageTags /></ThreeColumnLayout>} />
            </Routes>
          </div>
          <footer className="pt-8 pb-2 text-center text-xs font-medium text-[var(--text-muted)] flex justify-center items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
            <span>Autor: <strong style={{ color: 'var(--text-secondary)' }}>Matheus Delmaschio</strong></span>
            <span className="w-1 h-1 rounded-full bg-[var(--border-secondary)]"></span>
            <span>Team: <strong style={{ color: 'var(--text-secondary)' }}>Softtek</strong></span>
          </footer>
        </main>
      </div>
    </Router>
  );
}

export default App;

