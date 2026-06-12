import { useState, useEffect } from 'react';
import { actionApi, incidentApi, handleApiError } from '../services/api';
import { Action, Incident } from '../types/index';
import { Plus, X, Activity } from 'lucide-react';

const getId = (item: any) => typeof item === 'object' && item !== null ? item._id : item;

export default function ManageActions() {
  const [actions, setActions] = useState<Action[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', incidentId: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [incidentFilter, setIncidentFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [actsRes, incsRes] = await Promise.all([
        actionApi.getAll(),
        incidentApi.getAll()
      ]);
      setActions(actsRes.data);
      setIncidents(incsRes.data);
      setError(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.incidentId) return;

    const payload = {
      name: formData.name,
      incidentIds: [formData.incidentId]
    };

    try {
      if (editingId) {
        await actionApi.update(editingId, payload);
      } else {
        await actionApi.create(payload);
      }
      setFormData({ name: '', incidentId: '' });
      setEditingId(null);
      fetchData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };



  const filteredItems = actions.filter(act => {
    const matchesName = act.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIncident = incidentFilter ? act.incidentIds?.some(i => getId(i) === incidentFilter) : true;
    return matchesName && matchesIncident;
  });

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
        await Promise.all(selectedIds.map(id => actionApi.delete(id)));
        setSelectedIds([]);
        fetchData();
      } catch (err) {
        setError(handleApiError(err));
        setLoading(false);
      }
    }
  };

  const getIncidentName = (incId: string | Incident) => {
    const id = getId(incId);
    return incidents.find(i => i._id === id)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="text-primary w-8 h-8" />
        <h1 className="text-3xl font-bold m-0">Manage Actions</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 p-4 rounded text-red-700">{error}</div>}

      <div className="section-card p-6">
        <h2 className="text-xl font-semibold mb-4">Add/Edit Action</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={formData.incidentId}
            onChange={(e) => setFormData({ ...formData, incidentId: e.target.value })}
            className="form-input"
          >
            <option value="">Select Incident</option>
            {incidents.map(inc => (
              <option key={inc._id} value={inc._id}>{inc.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Action name"
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
                onClick={() => { setEditingId(null); setFormData({ name: '', incidentId: '' }); }}
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
          <h2 className="text-xl font-semibold m-0">Existing Actions ({filteredItems.length})</h2>
          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={incidentFilter}
              onChange={(e) => setIncidentFilter(e.target.value)}
              className="form-input text-sm w-full md:w-48"
            >
              <option value="">All Incidents</option>
              {incidents.map(inc => (
                <option key={inc._id} value={inc._id}>{inc.name}</option>
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
        ) : actions.length === 0 ? (
          <div className="p-6 text-center text-slate-500">No actions yet</div>
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
                  <th className="text-left p-4">Incident</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(act => (
                  <tr key={act._id} className={selectedIds.includes(act._id) ? "bg-red-500/5" : ""}>
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(act._id)} 
                        onChange={() => toggleSelectOne(act._id)} 
                      />
                    </td>
                    <td className="p-4">{act.name}</td>
                    <td className="p-4 opacity-70">
                      {act.incidentIds?.length ? getIncidentName(act.incidentIds[0]) : 'None'}
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
