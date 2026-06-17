import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { moduleApi, applicationApi, handleApiError } from '../services/api';
import { Module, Application } from '../types/index';
import { Plus, X, Component, Edit2, Trash2, Globe, Home, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const getId = (item: any) => typeof item === 'object' && item !== null ? item._id : item;

export default function ManageModules() {
  const { user, currentWorkspaceId } = useAuth();
  const [modules, setModules] = useState<Module[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [applicationFilter, setApplicationFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', applicationId: '', isGlobal: false });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  const handleCreate = async (closeModal: boolean) => {
    setFormError(null);
    if (!formData.name.trim() || !formData.applicationId) {
      setFormError('Nome e Aplicação são obrigatórios.');
      return;
    }
    setFormLoading(true);
    try {
      await moduleApi.create(formData);
      fetchData();
      if (closeModal) {
        setIsModalOpen(false);
        setFormData({ name: '', applicationId: '', isGlobal: false });
      } else {
        setFormData(prev => ({ ...prev, name: '' }));
        setTimeout(() => nameInputRef.current?.focus(), 50);
      }
    } catch (err) {
      setFormError(handleApiError(err));
    } finally {
      setFormLoading(false);
    }
  };

  const startInlineEdit = (mod: Module) => {
    setEditingId(mod._id);
    setEditName(mod.name);
  };

  const saveInlineEdit = async (mod: Module) => {
    if (editName.trim() === mod.name) {
      setEditingId(null);
      return;
    }
    try {
      await moduleApi.update(mod._id, { name: editName });
      setModules(modules.map(m => m._id === mod._id ? { ...m, name: editName } : m));
      setEditingId(null);
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  const handleInactivate = async (id: string) => {
    if (window.confirm('Tem certeza que deseja inativar este módulo?')) {
      try {
        setLoading(true);
        await moduleApi.delete(id);
        fetchData();
      } catch (err) {
        setError(handleApiError(err));
        setLoading(false);
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
    if (window.confirm(`Tem certeza que deseja deletar ${selectedIds.length} item(s)?`)) {
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
    <div className="space-y-6 animate-fade-in-up flex-1 p-8 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Component className="text-indigo-600 w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white m-0">Módulos</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie os módulos de cada aplicação.</p>
            </div>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Novo Registro
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 p-4 rounded text-red-700">{error}</div>}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50/50 dark:bg-gray-800/50">
            <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <select
                value={applicationFilter}
                onChange={(e) => setApplicationFilter(e.target.value)}
                className="w-full md:w-48 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
              >
                <option value="">Todas Aplicações</option>
                {applications.map(app => (
                  <option key={app._id} value={app._id}>{app.name}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Filtrar por nome..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full md:w-64 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
              />
              {selectedIds.length > 0 && (
                <button onClick={handleBulkDelete} className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600 text-sm font-medium transition-colors">
                  Excluir ({selectedIds.length})
                </button>
              )}
            </div>
          </div>
          {loading ? (
            <div className="p-8 text-center text-gray-500">Carregando...</div>
          ) : modules.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nenhum módulo cadastrado.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <th className="py-3 px-4 w-12 text-center">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.length === filteredItems.length && filteredItems.length > 0} 
                        onChange={toggleSelectAll} 
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                    </th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Escopo</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 w-1/3">Nome</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Aplicação</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(mod => {
                    const isLocal = mod.workspaceId === currentWorkspaceId;
                    const canEdit = isLocal || user?.role === 'ADMIN';

                    return (
                    <tr key={mod._id} className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group ${selectedIds.includes(mod._id) ? "bg-indigo-50/50 dark:bg-indigo-900/20" : ""}`}>
                      <td className="py-3 px-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(mod._id)} 
                          onChange={() => toggleSelectOne(mod._id)} 
                          disabled={!canEdit}
                          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${isLocal ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                          {isLocal ? <Home size={12} /> : <Globe size={12} />}
                          {isLocal ? 'Local' : 'Global'}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-gray-900 dark:text-white">
                        {editingId === mod._id ? (
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(mod)}
                              className="w-full rounded border border-indigo-300 bg-white dark:bg-gray-700 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                            />
                          </div>
                        ) : (
                          <span 
                            className={`cursor-pointer ${canEdit ? 'hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline' : ''}`}
                            onClick={() => canEdit && startInlineEdit(mod)}
                          >
                            {mod.name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{getAppName(mod.applicationId)}</td>
                      <td className="py-3 px-4 text-right">
                        {editingId === mod._id ? (
                          <div className="flex justify-end gap-1">
                            <button onClick={() => saveInlineEdit(mod)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Salvar">
                              <Check size={16} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Cancelar">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => startInlineEdit(mod)} 
                              disabled={!canEdit}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Editar Inline"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleInactivate(mod._id)} 
                              disabled={!canEdit}
                              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Inativar"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )})}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Criação */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="text-indigo-500 w-5 h-5"/> Novo Módulo
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded text-sm">
                  {formError}
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Aplicação</label>
                <select
                  value={formData.applicationId}
                  onChange={(e) => setFormData({ ...formData, applicationId: e.target.value })}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                >
                  <option value="">Selecione a Aplicação</option>
                  {applications.map(app => (
                    <option key={app._id} value={app._id}>{app.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome do Módulo</label>
                <input
                  ref={nameInputRef}
                  autoFocus
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate(false)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              {user?.role === 'ADMIN' && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isGlobal"
                    checked={formData.isGlobal}
                    onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isGlobal" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Salvar como Global (Visível a todos)
                  </label>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleCreate(false)}
                disabled={formLoading}
                className="px-4 py-2 text-sm font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900 rounded-md transition-colors disabled:opacity-50"
              >
                Create
              </button>
              <button
                onClick={() => handleCreate(true)}
                disabled={formLoading}
                className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-md transition-colors disabled:opacity-50"
              >
                Create and Close
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
