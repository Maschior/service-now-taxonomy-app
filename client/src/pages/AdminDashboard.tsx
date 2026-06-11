import { useState, useEffect } from 'react';
import { applicationApi, moduleApi, incidentApi, actionApi, tagApi, handleApiError } from '../services/api';
import { BarChart3, Package, AlertTriangle, Zap, Tags } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    applications: 0,
    modules: 0,
    incidents: 0,
    actions: 0,
    tags: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [appsRes, modsRes, incsRes, actsRes, tagsRes] = await Promise.all([
        applicationApi.getAll(),
        moduleApi.getAll(),
        incidentApi.getAll(),
        actionApi.getAll(),
        tagApi.getAll()
      ]);

      setStats({
        applications: appsRes.data.length,
        modules: modsRes.data.length,
        incidents: incsRes.data.length,
        actions: actsRes.data.length,
        tags: tagsRes.data.length
      });
      setError(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className={`bg-white rounded-lg shadow p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-600 text-sm font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-800 mt-2">{value}</p>
        </div>
        <Icon size={32} className="text-slate-400" />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Admin Dashboard</h1>
        <p className="text-slate-600 mt-2">Manage your taxonomy data</p>
      </div>

      {error && <div className="bg-red-50 border border-red-200 p-4 rounded text-red-700">{error}</div>}

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard icon={Package} label="Applications" value={stats.applications} color="border-blue-600" />
            <StatCard icon={BarChart3} label="Modules" value={stats.modules} color="border-green-600" />
            <StatCard icon={AlertTriangle} label="Incidents" value={stats.incidents} color="border-yellow-600" />
            <StatCard icon={Zap} label="Actions" value={stats.actions} color="border-purple-600" />
            <StatCard icon={Tags} label="Tags" value={stats.tags} color="border-indigo-600" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
              <div className="space-y-2">
                <a href="/manage/applications" className="block px-4 py-2 bg-blue-50 text-blue-600 rounded hover:bg-blue-100">
                  → Manage Applications
                </a>
                <a href="/manage/modules" className="block px-4 py-2 bg-green-50 text-green-600 rounded hover:bg-green-100">
                  → Manage Modules
                </a>
                <a href="/manage/incidents" className="block px-4 py-2 bg-yellow-50 text-yellow-600 rounded hover:bg-yellow-100">
                  → Manage Incidents
                </a>
                <a href="/manage/actions" className="block px-4 py-2 bg-purple-50 text-purple-600 rounded hover:bg-purple-100">
                  → Manage Actions
                </a>
                <a href="/manage/tags" className="block px-4 py-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100">
                  → Manage Tags
                </a>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Information</h2>
              <p className="text-slate-600 text-sm">
                Use this dashboard to add, edit, and remove applications, modules, incidents, actions, and tags.
                Existing values are displayed to prevent duplicates.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
