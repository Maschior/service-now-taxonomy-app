import React, { useState, useEffect, useMemo } from 'react';
import { userApi, workspaceApi, handleApiError } from '../services/api';
import { useAuth, Workspace } from '../contexts/AuthContext';
import { Shield, Trash2, Edit2, Check, X, UserPlus } from 'lucide-react';
import { Alert, Badge, Button, Card, Input, Modal, Select } from './ui';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
  workspaces: Workspace[];
}

// Lista de seleção (checkbox) de workspaces, reutilizada na criação e na edição.
const WorkspacePicker: React.FC<{
  options: Workspace[];
  selected: string[];
  onChange: (ids: string[]) => void;
}> = ({ options, selected, onChange }) => {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((s) => s !== id) : [...selected, id]);
  };

  if (options.length === 0) {
    return <p className="text-xs text-ink-400">Nenhum workspace disponível para atribuição.</p>;
  }

  return (
    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
      {options.map((w) => (
        <label key={w._id} className="flex items-center gap-2 text-sm text-ink-700 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(w._id)}
            onChange={() => toggle(w._id)}
            className="h-4 w-4 accent-[var(--brand)] cursor-pointer"
          />
          <span>{w.name}</span>
          {w.isGlobal && <Badge variant="info" withDot={false}>Global</Badge>}
        </label>
      ))}
    </div>
  );
};

export const ManageUsers: React.FC = () => {
  const { user: currentUser, currentWorkspaceId } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [allWorkspaces, setAllWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<{ name: string; email: string; password: string; role: string; workspaces: string[] }>(
    { name: '', email: '', password: '', role: 'USER', workspaces: [] }
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ name: string; email: string; role: string; workspaces: string[] }>(
    { name: '', email: '', role: 'USER', workspaces: [] }
  );

  // Quais workspaces o admin atual pode atribuir. No contexto Global, todos;
  // caso contrário, apenas os workspaces aos quais o próprio admin pertence.
  const assignableWorkspaces = useMemo<Workspace[]>(() => {
    const isGlobalContext = currentUser?.workspaces?.some((w) => w.isGlobal && w._id === currentWorkspaceId);
    return isGlobalContext ? allWorkspaces : (currentUser?.workspaces ?? []);
  }, [allWorkspaces, currentUser, currentWorkspaceId]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [usersRes, workspacesRes] = await Promise.all([
        userApi.getAll(),
        workspaceApi.getAll().catch(() => ({ data: [] as Workspace[] }))
      ]);
      setUsers(usersRes.data);
      setAllWorkspaces(workspacesRes.data as Workspace[]);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormError(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'USER',
      workspaces: currentWorkspaceId ? [currentWorkspaceId] : []
    });
    setIsModalOpen(true);
  };

  const handleCreate = async (closeModal: boolean) => {
    setFormError(null);
    if (!formData.name || !formData.email || !formData.password) {
      setFormError('Preencha todos os campos obrigatórios.');
      return;
    }
    if (formData.workspaces.length === 0) {
      setFormError('Selecione ao menos um workspace para o usuário.');
      return;
    }
    setFormLoading(true);
    try {
      const res = await userApi.create(formData);
      setUsers([...users, res.data]);
      if (closeModal) {
        setIsModalOpen(false);
        setFormData({ name: '', email: '', password: '', role: 'USER', workspaces: [] });
      } else {
        // Mantém papel e workspaces para cadastros em sequência; limpa os dados pessoais.
        setFormData({ name: '', email: '', password: '', role: formData.role, workspaces: formData.workspaces });
      }
    } catch (err) {
      setFormError(handleApiError(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja remover este usuário do seu workspace?')) return;
    try {
      await userApi.delete(id);
      setUsers(users.filter((u) => u._id !== id));
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  const startEdit = (u: UserData) => {
    setEditingId(u._id);
    setEditData({
      name: u.name,
      email: u.email,
      role: u.role,
      workspaces: (u.workspaces ?? []).map((w) => w._id)
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await userApi.update(id, editData);
      setUsers(users.map((u) => (u._id === id ? res.data : u)));
      setEditingId(null);
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="flex-1 p-8 flex items-center justify-center text-danger-fg">
        Acesso Negado: Apenas administradores podem ver esta tela.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Shield className="text-brand" size={28} strokeWidth={1.5} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink-900 m-0">Gerenciamento de Usuários</h1>
            <p className="text-ink-500 mt-1">Gerencie os acessos e workspaces dos usuários.</p>
          </div>
        </div>
        <Button variant="primary" onClick={openCreateModal} leftIcon={<UserPlus size={18} strokeWidth={2} />}>
          Novo Usuário
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        {loading ? (
          <div className="p-8 text-center text-ink-400">Carregando usuários...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-sunken border-b border-line">
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Nome</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Email</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Papel (Role)</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Workspaces</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-ink-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-ink-400">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="border-b border-line-subtle hover:bg-hover transition-colors group">
                      <td className="py-3 px-4">
                        {editingId === u._id ? (
                          <input
                            type="text"
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            className="w-full rounded-md border border-brand bg-surface px-2 py-1 text-sm text-ink-900 outline-none focus:ring-[3px] focus:ring-focus"
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium text-ink-900 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-brand text-on-brand flex items-center justify-center text-xs font-bold">
                              {u.name.substring(0, 2).toUpperCase()}
                            </div>
                            {u.name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-ink-500">
                        {editingId === u._id ? (
                          <input
                            type="email"
                            value={editData.email}
                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                            className="w-full rounded-md border border-brand bg-surface px-2 py-1 text-sm text-ink-900 outline-none focus:ring-[3px] focus:ring-focus"
                          />
                        ) : (
                          u.email
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {editingId === u._id ? (
                          <Select
                            value={editData.role}
                            onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                          </Select>
                        ) : (
                          <Badge variant={u.role === 'ADMIN' ? 'brand' : 'neutral'} withDot={false}>
                            {u.role}
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 align-top">
                        {editingId === u._id ? (
                          <WorkspacePicker
                            options={assignableWorkspaces}
                            selected={editData.workspaces}
                            onChange={(ids) => setEditData({ ...editData, workspaces: ids })}
                          />
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {(u.workspaces ?? []).length === 0 ? (
                              <span className="text-xs text-ink-400">—</span>
                            ) : (
                              (u.workspaces ?? []).map((w) => (
                                <Badge key={w._id} variant={w.isGlobal ? 'info' : 'neutral'} withDot={false}>
                                  {w.name}
                                </Badge>
                              ))
                            )}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right align-top">
                        {editingId === u._id ? (
                          <div className="flex justify-end gap-1">
                            <button onClick={() => saveEdit(u._id)} className="p-1.5 text-success-fg hover:bg-success-bg rounded-md transition-colors" title="Salvar">
                              <Check size={16} />
                            </button>
                            <button onClick={cancelEdit} className="p-1.5 text-danger-fg hover:bg-danger-bg rounded-md transition-colors" title="Cancelar">
                              <X size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(u)} className="p-1.5 text-ink-400 hover:text-brand hover:bg-brand-tint rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Editar">
                              <Edit2 size={16} />
                            </button>
                            {currentUser.id !== u._id && (
                              <button onClick={() => handleDelete(u._id)} className="p-1.5 text-ink-400 hover:text-danger-fg hover:bg-danger-bg rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors" title="Remover">
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Modal de Criação */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={<span className="flex items-center gap-2"><UserPlus className="text-brand" size={20} /> Novo Usuário</span>}
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
            label="Nome Completo"
            type="text"
            autoFocus
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <Input
            label="E-mail"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <Input
            label="Senha Inicial"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />

          <Select
            label="Papel (Role)"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <option value="USER">USER (Comum)</option>
            <option value="ADMIN">ADMIN (Administrador)</option>
          </Select>

          <div>
            <label className="block text-[13px] font-semibold text-ink-700 mb-2">Workspaces</label>
            <WorkspacePicker
              options={assignableWorkspaces}
              selected={formData.workspaces}
              onChange={(ids) => setFormData({ ...formData, workspaces: ids })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
};
