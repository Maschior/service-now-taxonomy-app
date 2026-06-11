import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HomePage from './pages/HomePage';
import AdminDashboard from './pages/AdminDashboard';
import ManageApplications from './components/ManageApplications';
import ManageModules from './components/ManageModules';
import ManageIncidents from './components/ManageIncidents';
import ManageActions from './components/ManageActions';
import ManageTags from './components/ManageTags';

function App() {
  return (
    <Router>
      <Navbar />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/manage/applications" element={<ManageApplications />} />
          <Route path="/manage/modules" element={<ManageModules />} />
          <Route path="/manage/incidents" element={<ManageIncidents />} />
          <Route path="/manage/actions" element={<ManageActions />} />
          <Route path="/manage/tags" element={<ManageTags />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
