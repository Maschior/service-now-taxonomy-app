import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { userApi, handleApiError } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Trash2, Edit2, Check, X, UserPlus } from 'lucide-react';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export const ManageUsers: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'USER' });
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{ name: string; email: string; role: string }>({ name: '', email: '', role: 'USER' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await userApi.getAll();
      setUsers(res.data);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (closeModal: boolean) => {
    setFormError(null);
    if (!formData.name || !formData.email || !formData.password) {
      setFormError('Preencha todos os campos obrigatórios.');
      return;
    }
    setFormLoading(true);
    try {
      const res = await userApi.create(formData);
      setUsers([...users, res.data]);
      if (closeModal) {
        setIsModalOpen(false);
        setFormData({ name: '', email: '', password: '', role: 'USER' });
      } else {
        // Keep email, password, role the same if needed, or clear all? 
        // For users, it's better to clear at least email and password.
        setFormData({ name: '', email: '', password: '', role: formData.role });
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
      setUsers(users.filter(u => u._id !== id));
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  const startEdit = (u: UserData) => {
    setEditingId(u._id);
    setEditData({ name: u.name, email: u.email, role: u.role });
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = async (id: string) => {
    try {
      const res = await userApi.update(id, editData);
      setUsers(users.map(u => (u._id === id ? res.data : u)));
      setEditingId(null);
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="flex-1 p-8 flex items-center justify-center text-red-500">
        Acesso Negado: Apenas administradores podem ver esta tela.
      </div>
    );
  }

  return (
    <div className="flex-1 p-8 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Shield className="w-6 h-6 text-indigo-500" />
              Gerenciamento de Usuários
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Gerencie os acessos ao workspace.</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 flex items-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Novo Usuário
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-gray-500">Carregando usuários...</div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-4 px-6 text-sm font-semibold text-gray-600 dark:text-gray-300">Nome</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-600 dark:text-gray-300">Email</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-600 dark:text-gray-300">Papel (Role)</th>
                  <th className="py-4 px-6 text-sm font-semibold text-gray-600 dark:text-gray-300 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u._id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
                      <td className="py-3 px-6">
                        {editingId === u._id ? (
                          <input
                            type="text"
                            value={editData.name}
                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            className="w-full border border-indigo-300 rounded px-2 py-1 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            autoFocus
                          />
                        ) : (
                          <span className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                              {u.name.substring(0, 2).toUpperCase()}
                            </div>
                            {u.name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-gray-600 dark:text-gray-400">
                        {editingId === u._id ? (
                          <input
                            type="email"
                            value={editData.email}
                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                            className="w-full border border-indigo-300 rounded px-2 py-1 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        ) : (
                          u.email
                        )}
                      </td>
                      <td className="py-3 px-6">
                        {editingId === u._id ? (
                          <select
                            value={editData.role}
                            onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                            className="border border-indigo-300 rounded px-2 py-1 bg-white dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            <option value="USER">USER</option>
                            <option value="ADMIN">ADMIN</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs font-medium ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
                            {u.role}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-6 text-right">
                        {editingId === u._id ? (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => saveEdit(u._id)} className="p-1.5 text-green-600 hover:bg-green-50 rounded" title="Salvar">
                              <Check className="w-4 h-4" />
                            </button>
                            <button onClick={cancelEdit} className="p-1.5 text-red-600 hover:bg-red-50 rounded" title="Cancelar">
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => startEdit(u)} className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded" title="Editar">
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {currentUser.id !== u._id && (
                              <button onClick={() => handleDelete(u._id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded" title="Remover">
                                <Trash2 className="w-4 h-4" />
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
          )}
        </div>
      </div>

      {/* Modal de Criação */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Novo Usuário</h3>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                <input
                  type="text"
                  autoFocus
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Senha Inicial</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Papel (Role)</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                >
                  <option value="USER">USER (Comum)</option>
                  <option value="ADMIN">ADMIN (Administrador)</option>
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
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
};
