import { useState, useEffect } from 'react';
import { moduleApi, applicationApi, handleApiError } from '../services/api';
import { Module, Application } from '../types/index';
import { Trash2, Plus, Edit2, X, Component } from 'lucide-react';

const getId = (item: any) => typeof item === 'object' && item !== null ? item._id : item;

export default function ManageModules() {
  const [modules, setModules] = useState<Module[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', applicationId: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [applicationFilter, setApplicationFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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
      applicationId: getId(mod.applicationId)
    });
    setEditingId(mod._id);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure?')) {
      try {
        await moduleApi.delete(id);
        setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        fetchData();
      } catch (err) {
        setError(handleApiError(err));
      }
    }
  };

  const filteredItems = modules.filter(mod => {
    const matchesName = mod.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesApp = applicationFilter ? getId(mod.applicationId) === applicationFilter : true;
    return matchesName && matchesApp;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(m => m._id));
    }
  };

  const toggleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.length) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} item(s)?`)) {
      try {
        setLoading(true);
        await Promise.all(selectedIds.map(id => moduleApi.delete(id)));
        setSelectedIds([]);
        fetchData();
      } catch (err) {
        setError(handleApiError(err));
        setLoading(false);
      }
    }
  };

  const getAppName = (appId: string | Application) => {
    const id = getId(appId);
    return applications.find(a => a._id === id)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <Component className="text-primary w-8 h-8" />
        <h1 className="text-3xl font-bold m-0">Manage Modules</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 p-4 rounded text-red-700">{error}</div>}

      <div className="section-card p-6">
        <h2 className="text-xl font-semibold mb-4">Add/Edit Module</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={formData.applicationId}
            onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
            className="form-input"
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
            className="form-input"
          />
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Plus size={18} /> {editingId ? 'Update' : 'Add'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setFormData({ name: '', applicationId: '' }); }}
                className="btn-ghost flex items-center gap-2"
              >
                <X size={18} /> Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="section-card">
        <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-semibold m-0">Existing Modules ({filteredItems.length})</h2>
          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={applicationFilter}
              onChange={(e) => setApplicationFilter(e.target.value)}
              className="form-input text-sm w-full md:w-48"
            >
              <option value="">All Applications</option>
              {applications.map(app => (
                <option key={app._id} value={app._id}>{app.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Filter by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input text-sm w-full md:w-48"
            />
            {selectedIds.length > 0 && (
              <button onClick={handleBulkDelete} className="btn-primary" style={{ background: '#ef4444', border: 'none' }}>
                Delete ({selectedIds.length})
              </button>
            )}
          </div>
        </div>
        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : modules.length === 0 ? (
          <div className="p-6 text-center text-slate-500">No modules yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th className="text-left p-4 w-12">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.length === filteredItems.length && filteredItems.length > 0} 
                      onChange={toggleSelectAll} 
                    />
                  </th>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Application</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(mod => (
                  <tr key={mod._id} className={selectedIds.includes(mod._id) ? "bg-red-500/5" : ""}>
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(mod._id)} 
                        onChange={() => toggleSelectOne(mod._id)} 
                      />
                    </td>
                    <td className="p-4">{mod.name}</td>
                    <td className="p-4 opacity-70">{getAppName(mod.applicationId)}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(mod)}
                        className="btn-ghost inline-flex items-center gap-1 px-3 py-1"
                      >
                        <Edit2 size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(mod._id)}
                        className="text-red-400 hover:text-red-300 inline-flex items-center gap-1 px-3 py-1"
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
