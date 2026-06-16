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
        <main className="flex-1 w-full px-4 md:px-8 py-6 min-w-0">
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
      </div>
    </Router>
  );
}

export default App;

