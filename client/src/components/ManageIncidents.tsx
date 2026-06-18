import { useState, useEffect, useMemo, useRef } from 'react';
import { incidentApi, moduleApi, applicationApi, handleApiError } from '../services/api';
import { Incident, Module, Application } from '../types/index';
import { Plus, X, AlertTriangle, Edit2, Trash2, Globe, Home, Check, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Alert, Badge, Button, Card, Checkbox, Input, Modal, Select } from './ui';

const getId = (item: any) => typeof item === 'object' && item !== null ? item._id : item;

export default function ManageIncidents() {
  const { user, currentWorkspaceId } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [applicationFilter, setApplicationFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', moduleId: '', isGlobal: false });
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

  const handleCreate = async (closeModal: boolean) => {
    setFormError(null);
    if (!formData.name.trim() || !formData.moduleId) {
      setFormError('Nome e Módulo são obrigatórios.');
      return;
    }
    setFormLoading(true);
    const payload = {
      name: formData.name,
      moduleIds: [formData.moduleId],
      isGlobal: formData.isGlobal
    };
    try {
      await incidentApi.create(payload);
      fetchData();
      if (closeModal) {
        setIsModalOpen(false);
        setFormData({ name: '', moduleId: '', isGlobal: false });
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

  const startInlineEdit = (inc: Incident) => {
    setEditingId(inc._id);
    setEditName(inc.name);
  };

  const saveInlineEdit = async (inc: Incident) => {
    if (editName.trim() === inc.name) {
      setEditingId(null);
      return;
    }
    try {
      await incidentApi.update(inc._id, { name: editName });
      setIncidents(incidents.map(i => i._id === inc._id ? { ...i, name: editName } : i));
      setEditingId(null);
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  const handleInactivate = async (id: string) => {
    if (window.confirm('Tem certeza que deseja inativar este incidente?')) {
      try {
        setLoading(true);
        await incidentApi.delete(id);
        fetchData();
      } catch (err) {
        setError(handleApiError(err));
        setLoading(false);
      }
    }
  };

  const filteredItems = incidents.filter(inc => {
    const matchesName = inc.name.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesApp = true;
    if (applicationFilter) {
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
    if (window.confirm(`Tem certeza que deseja deletar ${selectedIds.length} item(s)?`)) {
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
    <div className="space-y-6 animate-fade-in-up max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-brand" size={28} strokeWidth={1.5} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink-900 m-0">Incidentes</h1>
            <p className="text-ink-500 mt-1">Gerencie os incidentes (chamados) para cada módulo.</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)} leftIcon={<Plus size={18} strokeWidth={2} />}>
          Novo Registro
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <div className="p-4 border-b border-line-subtle bg-surface-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col md:flex-row flex-wrap gap-2 w-full md:w-auto">
            <Select
              containerClassName="w-full md:w-auto min-w-[150px]"
              value={applicationFilter}
              onChange={(e) => {
                setApplicationFilter(e.target.value);
                setModuleFilter(''); // Reset module filter when app changes
              }}
            >
              <option value="">Todas Aplicações</option>
              {applications.map(app => (
                <option key={app._id} value={app._id}>{app.name}</option>
              ))}
            </Select>
            <Select
              containerClassName="w-full md:w-auto min-w-[150px]"
              value={moduleFilter}
              onChange={(e) => setModuleFilter(e.target.value)}
            >
              <option value="">Todos Módulos</option>
              {availableModulesForFilter.map(mod => (
                <option key={mod._id} value={mod._id}>{mod.name}</option>
              ))}
            </Select>
            <Input
              containerClassName="w-full md:w-48"
              placeholder="Filtrar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={16} strokeWidth={1.5} />}
            />
            {selectedIds.length > 0 && (
              <Button variant="danger" onClick={handleBulkDelete}>
                Excluir ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-ink-400">Carregando...</div>
        ) : incidents.length === 0 ? (
          <div className="p-8 text-center text-ink-400">Nenhum incidente cadastrado.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-sunken border-b border-line">
                  <th className="py-3 px-4 w-12 text-center">
                    <Checkbox
                      checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Escopo</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-ink-400 w-1/3">Nome</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Módulo</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-ink-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(inc => {
                  const isLocal = inc.workspaceId === currentWorkspaceId;
                  const canEdit = isLocal || user?.role === 'ADMIN';

                  return (
                  <tr key={inc._id} className={`border-b border-line-subtle hover:bg-hover transition-colors group ${selectedIds.includes(inc._id) ? 'bg-brand-tint' : ''}`}>
                    <td className="py-3 px-4 text-center">
                      <Checkbox
                        checked={selectedIds.includes(inc._id)}
                        onChange={() => toggleSelectOne(inc._id)}
                        disabled={!canEdit}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={isLocal ? 'neutral' : 'info'} withDot={false}>
                        {isLocal ? <Home size={12} strokeWidth={1.7} /> : <Globe size={12} strokeWidth={1.7} />}
                        {isLocal ? 'Local' : 'Global'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium text-ink-900">
                      {editingId === inc._id ? (
                        <div className="flex items-center gap-2">
                          <input
                            autoFocus
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(inc)}
                            className="w-full rounded-md border border-brand bg-surface px-2 py-1 text-sm text-ink-900 outline-none focus:ring-[3px] focus:ring-focus"
                          />
                        </div>
                      ) : (
                        <span
                          className={`cursor-pointer ${canEdit ? 'hover:text-brand hover:underline' : ''}`}
                          onClick={() => canEdit && startInlineEdit(inc)}
                        >
                          {inc.name}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-ink-500">
                      {inc.moduleIds?.length ? getModuleName(inc.moduleIds[0]) : 'None'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {editingId === inc._id ? (
                        <div className="flex justify-end gap-1">
                          <button onClick={() => saveInlineEdit(inc)} className="p-1.5 text-success-fg hover:bg-success-bg rounded-md transition-colors" title="Salvar">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 text-danger-fg hover:bg-danger-bg rounded-md transition-colors" title="Cancelar">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startInlineEdit(inc)}
                            disabled={!canEdit}
                            className="p-1.5 text-ink-400 hover:text-brand hover:bg-brand-tint rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Editar Inline"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleInactivate(inc._id)}
                            disabled={!canEdit}
                            className="p-1.5 text-ink-400 hover:text-danger-fg hover:bg-danger-bg rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
      </Card>

      {/* Modal de Criação */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={<span className="flex items-center gap-2"><Plus className="text-brand" size={20} /> Novo Incidente</span>}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button variant="secondary" onClick={() => handleCreate(false)} disabled={formLoading}>Create</Button>
            <Button variant="primary" onClick={() => handleCreate(true)} disabled={formLoading}>Create and Close</Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <Alert variant="danger">{formError}</Alert>}

          <Select
            label="Módulo"
            value={formData.moduleId}
            onChange={(e) => setFormData({ ...formData, moduleId: e.target.value })}
          >
            <option value="">Selecione o Módulo</option>
            {modules.map(mod => (
              <option key={mod._id} value={mod._id}>{mod.name}</option>
            ))}
          </Select>

          <Input
            ref={nameInputRef}
            autoFocus
            label="Nome do Incidente"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate(false)}
          />

          {user?.role === 'ADMIN' && (
            <Checkbox
              label="Salvar como Global (Visível a todos)"
              checked={formData.isGlobal}
              onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
