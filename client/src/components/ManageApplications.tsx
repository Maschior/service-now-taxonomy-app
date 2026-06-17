import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { applicationApi, handleApiError } from '../services/api';
import { Application } from '../types/index';
import { Plus, X, Package, Edit2, Trash2, Globe, Home, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function ManageApplications() {
  const { user, currentWorkspaceId } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', isGlobal: false });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

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

  const handleCreate = async (closeModal: boolean) => {
    setFormError(null);
    if (!formData.name.trim()) {
      setFormError('Nome é obrigatório.');
      return;
    }
    setFormLoading(true);
    try {
      await applicationApi.create(formData);
      fetchApplications();
      if (closeModal) {
        setIsModalOpen(false);
        setFormData({ name: '', description: '', isGlobal: false });
      } else {
        setFormData(prev => ({ ...prev, name: '' })); // Only clear name for continuous creation
        setTimeout(() => nameInputRef.current?.focus(), 50);
      }
    } catch (err) {
      setFormError(handleApiError(err));
    } finally {
      setFormLoading(false);
    }
  };

  const startInlineEdit = (app: Application) => {
    setEditingId(app._id);
    setEditName(app.name);
  };

  const saveInlineEdit = async (app: Application) => {
    if (editName.trim() === app.name) {
      setEditingId(null);
      return;
    }
    try {
      await applicationApi.update(app._id, { name: editName });
      setApplications(applications.map(a => a._id === app._id ? { ...a, name: editName } : a));
      setEditingId(null);
    } catch (err) {
      alert(handleApiError(err));
    }
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
    if (window.confirm(`Tem certeza que deseja deletar ${selectedIds.length} item(s)?`)) {
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
    <div className="space-y-6 animate-fade-in-up flex-1 p-8 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Package className="text-indigo-600 w-8 h-8" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white m-0">Aplicações</h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie as aplicações raízes do sistema.</p>
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
            <div className="flex gap-2 w-full md:w-auto">
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
          ) : applications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Nenhuma aplicação cadastrada.</div>
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
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300">Descrição</th>
                    <th className="py-3 px-4 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.map(app => {
                    const isLocal = app.workspaceId === currentWorkspaceId;
                    const canEdit = isLocal || user?.role === 'ADMIN';

                    return (
                    <tr key={app._id} className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group ${selectedIds.includes(app._id) ? "bg-indigo-50/50 dark:bg-indigo-900/20" : ""}`}>
                      <td className="py-3 px-4 text-center">
                        <input 
                          type="checkbox" 
                          checked={selectedIds.includes(app._id)} 
                          onChange={() => toggleSelectOne(app._id)}
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
                        {editingId === app._id ? (
                          <div className="flex items-center gap-2">
                            <input
                              autoFocus
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(app)}
                              className="w-full rounded border border-indigo-300 bg-white dark:bg-gray-700 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                            />
                          </div>
                        ) : (
                          <span 
                            className={`cursor-pointer ${canEdit ? 'hover:text-indigo-600 dark:hover:text-indigo-400 hover:underline' : ''}`}
                            onClick={() => canEdit && startInlineEdit(app)}
                          >
                            {app.name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500 dark:text-gray-400">{app.description || '-'}</td>
                      <td className="py-3 px-4 text-right">
                        {editingId === app._id ? (
                          <div className="flex justify-end gap-1">
                            <button onClick={() => saveInlineEdit(app)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Salvar">
                              <Check size={16} />
                            </button>
                            <button onClick={() => setEditingId(null)} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Cancelar">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={() => startInlineEdit(app)} 
                              disabled={!canEdit}
                              className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                              title="Editar Inline"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button 
                              onClick={() => handleInactivate(app._id)} 
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
                <Plus className="text-indigo-500 w-5 h-5"/> Nova Aplicação
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white custom-scrollbar"
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
