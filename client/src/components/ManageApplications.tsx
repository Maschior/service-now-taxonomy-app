import { useState, useEffect } from 'react';
import { applicationApi, handleApiError } from '../services/api';
import { Application } from '../types/index';
import { Plus, X, Package, Edit, Trash2, Globe, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ManageApplications() {
  const { user, currentWorkspaceId } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', description: '', isGlobal: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await applicationApi.getAll();
      setApplications(res.data);
      setError(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      if (editingId) {
        await applicationApi.update(editingId, formData);
      } else {
        await applicationApi.create(formData);
      }
      setFormData({ name: '', description: '', isGlobal: false });
      setEditingId(null);
      fetchApplications();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleEdit = (app: Application) => {
    setFormData({ name: app.name, description: app.description || '', isGlobal: false });
    setEditingId(app._id);
  };

  const handleInactivate = async (id: string) => {
    if (window.confirm('Tem certeza que deseja inativar esta aplicação e seus módulos associados?')) {
      try {
        setLoading(true);
        await applicationApi.delete(id);
        fetchApplications();
      } catch (err) {
        setError(handleApiError(err));
        setLoading(false);
      }
    }
  };



  const filteredItems = applications.filter(app => app.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(a => a._id));
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
        await Promise.all(selectedIds.map(id => applicationApi.delete(id)));
        setSelectedIds([]);
        fetchApplications();
      } catch (err) {
        setError(handleApiError(err));
        setLoading(false);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <Package className="text-primary w-8 h-8" />
        <h1 className="text-3xl font-bold m-0">Manage Applications</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 p-4 rounded text-red-700">{error}</div>}

      <div className="section-card p-6">
        <h2 className="text-xl font-semibold mb-4">Add/Edit Application</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Application name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="form-input"
          />
          <textarea
            placeholder="Description (optional)"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="form-input"
            rows={3}
          />
          {user?.role === 'ADMIN' && !editingId && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isGlobal"
                checked={formData.isGlobal}
                onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
                className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
              <label htmlFor="isGlobal" className="text-sm font-medium text-[var(--text-secondary)]">
                Criar como Global (visível para todos os Workspaces)
              </label>
            </div>
          )}
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Plus size={18} /> {editingId ? 'Atualizar' : 'Adicionar'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setFormData({ name: '', description: '' }); }}
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
          <h2 className="text-xl font-semibold m-0">Existing Applications ({filteredItems.length})</h2>
          <div className="flex gap-2 w-full md:w-auto">
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
        ) : applications.length === 0 ? (
          <div className="p-6 text-center text-slate-500">No applications yet</div>
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
                  <th className="text-left p-4">Escopo</th>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Description</th>
                  <th className="text-right p-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(app => {
                  const isLocal = app.workspaceId === currentWorkspaceId;
                  const canEdit = isLocal || user?.role === 'ADMIN';

                  return (
                  <tr key={app._id} className={selectedIds.includes(app._id) ? "bg-red-500/5" : ""}>
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(app._id)} 
                        onChange={() => toggleSelectOne(app._id)}
                        disabled={!canEdit}
                      />
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${isLocal ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}`}>
                        {isLocal ? <Home size={12} /> : <Globe size={12} />}
                        {isLocal ? 'Local' : 'Global'}
                      </span>
                    </td>
                    <td className="p-4 font-medium">{app.name}</td>
                    <td className="p-4 opacity-70 text-sm">{app.description || '-'}</td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => handleEdit(app)} 
                        disabled={!canEdit}
                        className="btn-ghost p-2 text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleInactivate(app._id)} 
                        disabled={!canEdit}
                        className="btn-ghost p-2 text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Inativar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
