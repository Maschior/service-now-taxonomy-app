import { useState, useEffect, useRef } from 'react';
import { applicationApi, workspaceApi, handleApiError } from '../services/api';
import { Application } from '../types/index';
import { Plus, X, Package, Edit2, Trash2, Globe, Home, Building2, Check, Search } from 'lucide-react';
import { useAuth, Workspace } from '../contexts/AuthContext';
import { useIsGlobalContext } from '../hooks/useIsGlobalContext';
import { Alert, Badge, Button, Card, Checkbox, Input, Modal, Select, Textarea } from './ui';

export default function ManageApplications() {
  const { user, currentWorkspaceId } = useAuth();
  const isGlobalContext = useIsGlobalContext();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [workspaceFilter, setWorkspaceFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '', isGlobal: false });
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  // Lista de workspaces para o filtro/badges: admin no contexto Global vê todos os ativos; demais, só os seus.
  const accessibleWorkspaces = isGlobalContext ? allWorkspaces : (user?.workspaces ?? []);

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    if (user?.role === 'ADMIN') {
      workspaceApi.getAll().then((res) => setAllWorkspaces(res.data)).catch(() => {});
    }
  }, [user?.role]);

  useEffect(() => {
    setWorkspaceFilter('');
  }, [currentWorkspaceId]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const res = await applicationApi.getAll({ scope: 'all' });
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

  const filteredItems = applications.filter(app =>
    app.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (!workspaceFilter || app.workspaceId === workspaceFilter)
  );

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
    <div className="space-y-6 animate-fade-in-up max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Package className="text-brand" size={28} strokeWidth={1.5} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink-900 m-0">Aplicações</h1>
            <p className="text-ink-500 mt-1">Gerencie as aplicações raízes do sistema.</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)} leftIcon={<Plus size={18} strokeWidth={2} />}>
          Novo Registro
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <div className="p-4 border-b border-line-subtle bg-surface-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex gap-2 w-full md:w-auto">
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
        ) : applications.length === 0 ? (
          <div className="p-8 text-center text-ink-400">Nenhuma aplicação cadastrada.</div>
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
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Descrição</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-ink-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(app => {
                  const isLocal = app.workspaceId === currentWorkspaceId;
                  const isGlobalItem = accessibleWorkspaces.find((w) => w._id === app.workspaceId)?.isGlobal === true;
                  const otherWorkspace = !isLocal && !isGlobalItem
                    ? accessibleWorkspaces.find((w) => w._id === app.workspaceId)
                    : undefined;
                  const canEdit = isGlobalItem ? user?.role === 'ADMIN' : true;

                  return (
                  <tr key={app._id} className={`border-b border-line-subtle hover:bg-hover transition-colors group ${selectedIds.includes(app._id) ? 'bg-brand-tint' : ''}`}>
                    <td className="py-3 px-4 text-center">
                      <Checkbox
                        checked={selectedIds.includes(app._id)}
                        onChange={() => toggleSelectOne(app._id)}
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
                      {editingId === app._id ? (
                        <input
                          autoFocus
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && saveInlineEdit(app)}
                          className="w-full rounded-md border border-brand bg-surface px-2 py-1 text-sm text-ink-900 outline-none focus:ring-[3px] focus:ring-focus"
                        />
                      ) : (
                        <span
                          className={`cursor-pointer ${canEdit ? 'hover:text-brand hover:underline' : ''}`}
                          onClick={() => canEdit && startInlineEdit(app)}
                        >
                          {app.name}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-ink-500">{app.description || '-'}</td>
                    <td className="py-3 px-4 text-right">
                      {editingId === app._id ? (
                        <div className="flex justify-end gap-1">
                          <button onClick={() => saveInlineEdit(app)} className="p-1.5 text-success-fg hover:bg-success-bg rounded-md transition-colors" title="Salvar">
                            <Check size={16} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1.5 text-danger-fg hover:bg-danger-bg rounded-md transition-colors" title="Cancelar">
                            <X size={16} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startInlineEdit(app)}
                            disabled={!canEdit}
                            className="p-1.5 text-ink-400 hover:text-brand hover:bg-brand-tint rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Editar Inline"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleInactivate(app._id)}
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
        title={<span className="flex items-center gap-2"><Plus className="text-brand" size={20} /> Nova Aplicação</span>}
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

          <Input
            ref={nameInputRef}
            autoFocus
            label="Nome"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate(false)}
          />

          <Textarea
            label="Descrição"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
          />

          {user?.role === 'ADMIN' && (
            <Checkbox
              label="Salvar como Global (visível a todos)"
              checked={formData.isGlobal}
              onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
            />
          )}
        </div>
      </Modal>
    </div>
  );
}
