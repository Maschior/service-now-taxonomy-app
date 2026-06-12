import { useState, useEffect, useMemo } from 'react';
import { incidentApi, moduleApi, applicationApi, handleApiError } from '../services/api';
import { Incident, Module, Application } from '../types/index';
import { Plus, X, AlertTriangle } from 'lucide-react';

const getId = (item: any) => typeof item === 'object' && item !== null ? item._id : item;

export default function ManageIncidents() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', moduleId: '' });
  const [searchTerm, setSearchTerm] = useState('');
  const [applicationFilter, setApplicationFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [incsRes, modsRes, appsRes] = await Promise.all([
        incidentApi.getAll(),
        moduleApi.getAll(),
        applicationApi.getAll()
      ]);
      setIncidents(incsRes.data);
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
    if (!formData.name.trim() || !formData.moduleId) return;

    const payload = {
      name: formData.name,
      moduleIds: [formData.moduleId]
    };

    try {
      if (editingId) {
        await incidentApi.update(editingId, payload);
      } else {
        await incidentApi.create(payload);
      }
      setFormData({ name: '', moduleId: '' });
      setEditingId(null);
      fetchData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };



  const filteredItems = incidents.filter(inc => {
    const matchesName = inc.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesApp = true;
    if (applicationFilter) {
      // Find modules belonging to this application
      const appModules = modules.filter(m => getId(m.applicationId) === applicationFilter).map(m => m._id);
      matchesApp = inc.moduleIds?.some((mid: any) => appModules.includes(getId(mid)));
    }
    
    const matchesModule = moduleFilter ? inc.moduleIds?.map(m => getId(m)).includes(moduleFilter) : true;
    
    return matchesName && matchesApp && matchesModule;
  });

  const availableModulesForFilter = useMemo(() => {
    if (!applicationFilter) return modules;
    return modules.filter(m => getId(m.applicationId) === applicationFilter);
  }, [modules, applicationFilter]);

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(i => i._id));
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
        await Promise.all(selectedIds.map(id => incidentApi.delete(id)));
        setSelectedIds([]);
        fetchData();
      } catch (err) {
        setError(handleApiError(err));
        setLoading(false);
      }
    }
  };

  const getModuleName = (modId: string | Module) => {
    const id = getId(modId);
    return modules.find(m => m._id === id)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <AlertTriangle className="text-primary w-8 h-8" />
        <h1 className="text-3xl font-bold m-0">Manage Incidents</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 p-4 rounded text-red-700">{error}</div>}

      <div className="section-card p-6">
        <h2 className="text-xl font-semibold mb-4">Add/Edit Incident</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={formData.moduleId}
            onChange={(e) => setFormData({ ...formData, moduleId: e.target.value })}
            className="form-input"
          >
            <option value="">Select Module</option>
            {modules.map(mod => (
              <option key={mod._id} value={mod._id}>{mod.name}</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Incident name"
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
                onClick={() => { setEditingId(null); setFormData({ name: '', moduleId: '' }); }}
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
          <h2 className="text-xl font-semibold m-0">Existing Incidents ({filteredItems.length})</h2>
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <select
              value={applicationFilter}
              onChange={(e) => {
                setApplicationFilter(e.target.value);
                setModuleFilter(''); // Reset module filter when app changes
              }}
              className="form-input text-sm w-full md:w-auto min-w-[150px]"
            >
              <option value="">All Applications</option>
              {applications.map(app => (
                <option key={app._id} value={app._id}>{app.name}</option>
              ))}
            </select>
            <select
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
              className="form-input text-sm w-full md:w-auto min-w-[150px]"
            >
              <option value="">All Modules</option>
              {availableModulesForFilter.map(mod => (
                <option key={mod._id} value={mod._id}>{mod.name}</option>
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
        ) : incidents.length === 0 ? (
          <div className="p-6 text-center text-slate-500">No incidents yet</div>
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
                  <th className="text-left p-4">Module</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(inc => (
                  <tr key={inc._id} className={selectedIds.includes(inc._id) ? "bg-red-500/5" : ""}>
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(inc._id)} 
                        onChange={() => toggleSelectOne(inc._id)} 
                      />
                    </td>
                    <td className="p-4">{inc.name}</td>
                    <td className="p-4 opacity-70">
                      {inc.moduleIds?.length ? getModuleName(inc.moduleIds[0]) : 'None'}
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
