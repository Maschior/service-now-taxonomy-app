import { useState, useEffect } from 'react';
import { moduleApi, applicationApi, handleApiError } from '../services/api';
import { Module, Application } from '../types/index';
import { Trash2, Plus, Edit2, X } from 'lucide-react';

export default function ManageModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', applicationId: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [modsRes, appsRes] = await Promise.all([
        moduleApi.getAll(),
        applicationApi.getAll()
      ]);
      setModules(modsRes.data);
      setApplications(appsRes.data);
      setError(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.applicationId) return;

    try {
      if (editingId) {
        await moduleApi.update(editingId, formData);
      } else {
        await moduleApi.create(formData);
      }
      setFormData({ name: '', applicationId: '' });
      setEditingId(null);
      fetchData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleEdit = (mod: Module) => {
    setFormData({
      name: mod.name,
      applicationId: typeof mod.applicationId === 'object' ? mod.applicationId._id : mod.applicationId
    });
    setEditingId(mod._id);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure?')) {
      try {
        await moduleApi.delete(id);
        fetchData();
      } catch (err) {
        setError(handleApiError(err));
      }
    }
  };

  const getAppName = (appId: string | Application) => {
    if (typeof appId === 'object') return appId.name;
    return applications.find(a => a._id === appId)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Modules</h1>

      {error && <div className="bg-red-50 border border-red-200 p-4 rounded text-red-700">{error}</div>}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Add/Edit Module</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={formData.applicationId}
            onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
            className="w-full border border-slate-300 rounded-lg p-2"
          >
            <option value="">Select Application</option>
            {applications.map(app => (
              <option key={app._id} value={app._id}>{app.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Module name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full border border-slate-300 rounded-lg p-2"
          />
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Plus size={18} /> {editingId ? 'Update' : 'Add'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setFormData({ name: '', applicationId: '' }); }}
                className="bg-slate-400 text-white px-4 py-2 rounded-lg hover:bg-slate-500 flex items-center gap-2"
              >
                <X size={18} /> Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold p-6 border-b">Existing Modules ({modules.length})</h2>
        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : modules.length === 0 ? (
          <div className="p-6 text-center text-slate-500">No modules yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Application</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {modules.map(mod => (
                  <tr key={mod._id} className="border-t hover:bg-slate-50">
                    <td className="p-4">{mod.name}</td>
                    <td className="p-4 text-slate-600">{getAppName(mod.applicationId)}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(mod)}
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        <Edit2 size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(mod._id)}
                        className="text-red-600 hover:text-red-800 inline-flex items-center gap-1"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
