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
        <div className="flex-1 w-full min-w-0 flex flex-col">
          <main className="flex-1 w-full px-4 md:px-8 py-6">
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
          </main>
          <footer className="py-3 mt-auto glass-surface w-full text-center text-[11px] text-[var(--text-secondary)] flex justify-center items-center gap-2 transition-opacity cursor-default" style={{ borderLeft: 'none', borderRight: 'none', borderBottom: 'none' }}>
            <span>Autor: <strong className="font-semibold text-[var(--text-primary)]">Matheus Delmaschio</strong></span>
            <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]"></span>
            <span>Team: <strong className="font-semibold text-[var(--text-primary)]">Softtek</strong></span>
          </footer>
        </div>
      </div>
    </Router>
  );
}

export default App;

