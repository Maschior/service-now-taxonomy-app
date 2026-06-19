import { useState, useEffect, useRef } from 'react';
import { actionApi, incidentApi, workspaceApi, handleApiError } from '../services/api';
import { Action, Incident } from '../types/index';
import { Plus, X, Activity, Edit2, Trash2, Globe, Home, Building2, Check, Search } from 'lucide-react';
import { useAuth, Workspace } from '../contexts/AuthContext';
import { useIsGlobalContext } from '../hooks/useIsGlobalContext';
import { Alert, Badge, Button, Card, Checkbox, Input, Modal, Select } from './ui';

const getId = (item: any) => typeof item === 'object' && item !== null ? item._id : item;

export default function ManageActions() {
  const { user, currentWorkspaceId } = useAuth();
  const isGlobalContext = useIsGlobalContext();
  const [actions, setActions] = useState<Action[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [incidentFilter, setIncidentFilter] = useState('');
  const [workspaceFilter, setWorkspaceFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', incidentId: '', isGlobal: false });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Lista de workspaces para o filtro/badges: admin no contexto Global vê todos os ativos; demais, só os seus.
  const accessibleWorkspaces = isGlobalContext ? allWorkspaces : (user?.workspaces ?? []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      workspaceApi.getAll().then((res) => setAllWorkspaces(res.data)).catch(() => {});
    }
  }, [user?.role]);

  useEffect(() => {
    setWorkspaceFilter('');
  }, [currentWorkspaceId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [actsRes, incsRes] = await Promise.all([
        actionApi.getAll({ scope: 'all' }),
        incidentApi.getAll({ scope: 'all' })
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

  const handleCreate = async (closeModal: boolean) => {
    setFormError(null);
    if (!formData.name.trim() || !formData.incidentId) {
      setFormError('Nome e Incidente são obrigatórios.');
      return;
    }
    setFormLoading(true);
    const payload = {
      name: formData.name,
      incidentIds: [formData.incidentId],
      isGlobal: formData.isGlobal
    };
    try {
      await actionApi.create(payload);
      fetchData();
      if (closeModal) {
        setIsModalOpen(false);
        setFormData({ name: '', incidentId: '', isGlobal: false });
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

  const startInlineEdit = (act: Action) => {
    setEditingId(act._id);
    setEditName(act.name);
  };

  const saveInlineEdit = async (act: Action) => {
    if (editName.trim() === act.name) {
      setEditingId(null);
      return;
    }
    try {
      await actionApi.update(act._id, { name: editName });
      setActions(actions.map(a => a._id === act._id ? { ...a, name: editName } : a));
      setEditingId(null);
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  const handleInactivate = async (id: string) => {
    if (window.confirm('Tem certeza que deseja inativar esta ação?')) {
      try {
        setLoading(true);
        await actionApi.delete(id);
        fetchData();
      } catch (err) {
        setError(handleApiError(err));
        setLoading(false);
      }
    }
  };

  const filteredItems = actions.filter(act => {
    const matchesName = act.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesIncident = incidentFilter ? act.incidentIds?.some(i => getId(i) === incidentFilter) : true;
    const matchesWorkspace = !workspaceFilter || act.workspaceId === workspaceFilter;
    return matchesName && matchesIncident && matchesWorkspace;
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
    if (window.confirm(`Tem certeza que deseja deletar ${selectedIds.length} item(s)?`)) {
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
    <div className="space-y-6 animate-fade-in-up max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Activity className="text-brand" size={28} strokeWidth={1.5} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink-900 m-0">Ações</h1>
            <p className="text-ink-500 mt-1">Gerencie as ações para cada incidente.</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)} leftIcon={<Plus size={18} strokeWidth={2} />}>
          Novo Registro
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <div className="p-4 border-b border-line-subtle bg-surface-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <Select
              containerClassName="w-full md:w-48"
              value={incidentFilter}
              onChange={(e) => setIncidentFilter(e.target.value)}
            >
              <option value="">Todos Incidentes</option>
              {incidents.map(inc => (
                <option key={inc._id} value={inc._id}>{inc.name}</option>
              ))}
            </Select>
            <Input
              containerClassName="w-full md:w-64"
              placeholder="Filtrar por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              leftIcon={<Search size={16} strokeWidth={1.5} />}
            />
            <Select
              containerClassName="w-full md:w-56"
              value={workspaceFilter}
              onChange={(e) => setWorkspaceFilter(e.target.value)}
            >
              <option value="">Todos os Workspaces</option>
              {accessibleWorkspaces.map((ws) => (
                <option key={ws._id} value={ws._id}>{ws.name}{ws.isGlobal ? ' (Global)' : ''}</option>
              ))}
            </Select>
            {selectedIds.length > 0 && (
              <Button variant="danger" onClick={handleBulkDelete}>
                Excluir ({selectedIds.length})
              </Button>
            )}
          </div>
        </div>
        {loading ? (
          <div className="p-8 text-center text-ink-400">Carregando...</div>
        ) : actions.length === 0 ? (
          <div className="p-8 text-center text-ink-400">Nenhuma ação cadastrada.</div>
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
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Incidente</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-ink-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(act => {
                  const isLocal = act.workspaceId === currentWorkspaceId;
                  const isGlobalItem = accessibleWorkspaces.find((w) => w._id === act.workspaceId)?.isGlobal === true;
                  const otherWorkspace = !isLocal && !isGlobalItem
                    ? accessibleWorkspaces.find((w) => w._id === act.workspaceId)
                    : undefined;
                  const canEdit = isGlobalItem ? user?.role === 'ADMIN' : true;

                  return (
                  <tr key={act._id} className={`border-b border-line-subtle hover:bg-hover transition-colors group ${selectedIds.includes(act._id) ? 'bg-brand-tint' : ''}`}>
                    <td className="py-3 px-4 text-center">
                      <Checkbox
                        checked={selectedIds.includes(act._id)}
                        onChange={() => toggleSelectOne(act._id)}
                        disabled={!canEdit}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={isLocal ? 'neutral' : isGlobalItem ? 'info' : 'brand'} withDot={false}>
                        {isLocal ? <Home size={12} strokeWidth={1.7} /> : isGlobalItem ? <Globe size={12} strokeWidth={1.7} /> : <Building2 size={12} strokeWidth={1.7} />}
                        {isLocal ? 'Local' : isGlobalItem ? 'Global' : (otherWorkspace?.name ?? 'Outro Workspace')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium text-ink-900">
                      {editingId === act._id ? (
                        <input
                          autoFocus
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(act)}
                          className="w-full rounded-md border border-brand bg-surface px-2 py-1 text-sm text-ink-900 outline-none focus:ring-[3px] focus:ring-focus"
                        />
                      ) : (
                        <span
                          className={`cursor-pointer ${canEdit ? 'hover:text-brand hover:underline' : ''}`}
                          onClick={() => canEdit && startInlineEdit(act)}
                        >
                          {act.name}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-ink-500">
                      {act.incidentIds?.length ? getIncidentName(act.incidentIds[0]) : 'None'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {editingId === act._id ? (
                        <div className="flex justify-end gap-1">
                          <button onClick={() => saveInlineEdit(act)} className="p-1.5 text-success-fg hover:bg-success-bg rounded-md transition-colors" title="Salvar">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 text-danger-fg hover:bg-danger-bg rounded-md transition-colors" title="Cancelar">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startInlineEdit(act)}
                            disabled={!canEdit}
                            className="p-1.5 text-ink-400 hover:text-brand hover:bg-brand-tint rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Editar Inline"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleInactivate(act._id)}
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

      {/* Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={<span className="flex items-center gap-2"><Plus className="text-brand" size={20} /> Nova Ação</span>}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button variant="secondary" onClick={() => handleCreate(false)} disabled={formLoading}>Criar</Button>
            <Button variant="primary" onClick={() => handleCreate(true)} disabled={formLoading}>Criar e fechar</Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <Alert variant="danger">{formError}</Alert>}

          <Select
            label="Incidente"
            value={formData.incidentId}
            onChange={(e) => setFormData({ ...formData, incidentId: e.target.value })}
          >
            <option value="">Selecione o Incidente</option>
            {incidents.map(inc => (
              <option key={inc._id} value={inc._id}>{inc.name}</option>
            ))}
          </Select>

          <Input
            ref={nameInputRef}
            autoFocus
            label="Nome da Ação"
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
