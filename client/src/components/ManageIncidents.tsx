import { useState, useEffect } from 'react';
import { incidentApi, applicationApi, handleApiError } from '../services/api';
import { Incident, Application } from '../types/index';
import { Trash2, Plus, Edit2, X } from 'lucide-react';

export default function ManageIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
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
      const [incsRes, appsRes] = await Promise.all([
        incidentApi.getAll(),
        applicationApi.getAll()
      ]);
      setIncidents(incsRes.data);
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
        await incidentApi.update(editingId, formData);
      } else {
        await incidentApi.create(formData);
      }
      setFormData({ name: '', applicationId: '' });
      setEditingId(null);
      fetchData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleEdit = (inc: Incident) => {
    setFormData({
      name: inc.name,
      applicationId: typeof inc.applicationId === 'object' ? inc.applicationId._id : inc.applicationId
    });
    setEditingId(inc._id);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure?')) {
      try {
        await incidentApi.delete(id);
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
      <h1 className="text-3xl font-bold">Manage Incidents</h1>

      {error && <div className="bg-red-50 border border-red-200 p-4 rounded text-red-700">{error}</div>}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Add/Edit Incident</h2>
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
            placeholder="Incident name"
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
        <h2 className="text-xl font-semibold p-6 border-b">Existing Incidents ({incidents.length})</h2>
        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : incidents.length === 0 ? (
          <div className="p-6 text-center text-slate-500">No incidents yet</div>
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
                {incidents.map(inc => (
                  <tr key={inc._id} className="border-t hover:bg-slate-50">
                    <td className="p-4">{inc.name}</td>
                    <td className="p-4 text-slate-600">{getAppName(inc.applicationId)}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(inc)}
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        <Edit2 size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(inc._id)}
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
