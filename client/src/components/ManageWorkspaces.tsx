import React, { useState, useEffect } from 'react';
import { workspaceApi, handleApiError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Workspace } from '../types/index';
import { Building2, Plus, Trash2, Edit2, Check, X, Globe, Home } from 'lucide-react';
import { Alert, Badge, Button, Card, Input, Modal } from './ui';

export const ManageWorkspaces: React.FC = () => {
  const { user, currentWorkspaceId, updateUser } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      const res = await workspaceApi.getAll();
      setWorkspaces(res.data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setFormError(null);
    if (!newName.trim()) {
      setFormError('O nome do workspace é obrigatório.');
      return;
    }
    setFormLoading(true);
    try {
      const res = await workspaceApi.create({ name: newName.trim() });
      setWorkspaces([...workspaces, res.data].sort((a, b) =>
        Number(b.isGlobal) - Number(a.isGlobal) || a.name.localeCompare(b.name)
      ));

      // O backend dá acesso ao admin criador; reflete isso no switcher imediatamente.
      if (user) {
        updateUser({
          workspaces: [
            ...user.workspaces,
            { _id: res.data._id, name: res.data.name, isGlobal: res.data.isGlobal }
          ]
        });
      }

      setIsModalOpen(false);
      setNewName('');
    } catch (err) {
      setFormError(handleApiError(err));
    } finally {
      setFormLoading(false);
    }
  };

  const startEdit = (ws: Workspace) => {
    setEditingId(ws._id);
    setEditName(ws.name);
  };

  const saveEdit = async (ws: Workspace) => {
    if (editName.trim() === ws.name) {
      setEditingId(null);
      return;
    }
    try {
      const res = await workspaceApi.update(ws._id, { name: editName.trim() });
      setWorkspaces(workspaces.map(w => (w._id === ws._id ? res.data : w)));
      setEditingId(null);
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  const handleDelete = async (ws: Workspace) => {
    if (!window.confirm(`Tem certeza que deseja desativar o workspace "${ws.name}"? Os usuários perderão o acesso a ele.`)) return;
    try {
      await workspaceApi.delete(ws._id);
      setWorkspaces(workspaces.filter(w => w._id !== ws._id));

      // Remove o workspace desativado do switcher do usuário atual.
      if (user) {
        updateUser({ workspaces: user.workspaces.filter(w => w._id !== ws._id) });
      }
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  if (user?.role !== 'ADMIN') {
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
          <Building2 className="text-brand" size={28} strokeWidth={1.5} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink-900 m-0">Gerenciamento de Workspaces</h1>
            <p className="text-ink-500 mt-1">Crie e gerencie os workspaces (ambientes) do sistema.</p>
          </div>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)} leftIcon={<Plus size={18} strokeWidth={2} />}>
          Novo Workspace
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        {loading ? (
          <div className="p-8 text-center text-ink-400">Carregando workspaces...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-sunken border-b border-line">
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-ink-400 w-1/2">Nome</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Tipo</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-ink-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {workspaces.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-8 text-center text-ink-400">
                      Nenhum workspace encontrado.
                    </td>
                  </tr>
                ) : (
                  workspaces.map((ws) => {
                    const isCurrent = ws._id === currentWorkspaceId;
                    return (
                      <tr key={ws._id} className="border-b border-line-subtle hover:bg-hover transition-colors group">
                        <td className="py-3 px-4">
                          {editingId === ws._id ? (
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && saveEdit(ws)}
                              className="w-full rounded-md border border-brand bg-surface px-2 py-1 text-sm text-ink-900 outline-none focus:ring-[3px] focus:ring-focus"
                              autoFocus
                            />
                          ) : (
                            <span className="font-medium text-ink-900 flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-brand text-on-brand flex items-center justify-center text-xs font-bold">
                                {ws.name.substring(0, 2).toUpperCase()}
                              </div>
                              {ws.name}
                              {isCurrent && (
                                <Badge variant="brand" withDot={false}>Atual</Badge>
                              )}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={ws.isGlobal ? 'info' : 'neutral'} withDot={false}>
                            {ws.isGlobal ? <Globe size={12} strokeWidth={1.7} /> : <Home size={12} strokeWidth={1.7} />}
                            {ws.isGlobal ? 'Global' : 'Local'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {editingId === ws._id ? (
                            <div className="flex justify-end gap-1">
                              <button onClick={() => saveEdit(ws)} className="p-1.5 text-success-fg hover:bg-success-bg rounded-md transition-colors" title="Salvar">
                                <Check size={16} />
                              </button>
                              <button onClick={() => setEditingId(null)} className="p-1.5 text-danger-fg hover:bg-danger-bg rounded-md transition-colors" title="Cancelar">
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => startEdit(ws)}
                                disabled={ws.isGlobal}
                                className="p-1.5 text-ink-400 hover:text-brand hover:bg-brand-tint rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title={ws.isGlobal ? 'O workspace Global não pode ser renomeado' : 'Editar'}
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => handleDelete(ws)}
                                disabled={ws.isGlobal}
                                className="p-1.5 text-ink-400 hover:text-danger-fg hover:bg-danger-bg rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                title={ws.isGlobal ? 'O workspace Global não pode ser desativado' : 'Desativar'}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
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
        title={<span className="flex items-center gap-2"><Building2 className="text-brand" size={20} /> Novo Workspace</span>}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleCreate} disabled={formLoading}>Criar</Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <Alert variant="danger">{formError}</Alert>}

          <Input
            label="Nome do Workspace"
            type="text"
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
          />

          <p className="text-xs text-ink-400">
            Você receberá acesso automático ao novo workspace e poderá alterná-lo na barra lateral.
          </p>
        </div>
      </Modal>
    </div>
  );
};
