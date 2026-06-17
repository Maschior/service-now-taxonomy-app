import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { tagApi, handleApiError } from '../services/api';
import { Tag, TagCategory } from '../types/index';
import { Trash2, Plus, X, Tags, Edit, Globe, Home, Settings } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const getId = (item: any) => typeof item === 'object' && item !== null ? item._id : item;

export default function ManageTags() {
  const { user, currentWorkspaceId } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Tag Modal State
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', categoryId: '', isGlobal: false });
  const [formLoading, setFormLoading] = useState(false);

  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [isGlobalCategory, setIsGlobalCategory] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [tagsRes, catsRes] = await Promise.all([
        tagApi.getAll(),
        tagApi.getCategories()
      ]);
      setTags(tagsRes.data);
      setCategories(catsRes.data);
      setError(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    try {
      if (editingCategoryId) {
        await tagApi.updateCategory(editingCategoryId, { name: categoryName });
      } else {
        await tagApi.createCategory({ name: categoryName, isGlobal: isGlobalCategory });
      }
      setCategoryName('');
      setIsGlobalCategory(false);
      setEditingCategoryId(null);
      fetchData();
    } catch (err) {
      alert(handleApiError(err));
    }
  };

  const handleCreateTag = async (closeModal: boolean) => {
    if (!formData.name.trim() || !formData.categoryId) return;
    setFormLoading(true);
    try {
      if (editingId) {
        await tagApi.update(editingId, formData);
      } else {
        await tagApi.create(formData);
      }
      fetchData();
      if (closeModal) {
        setIsTagModalOpen(false);
        setFormData({ name: '', categoryId: '', isGlobal: false });
        setEditingId(null);
      } else {
        setFormData(prev => ({ ...prev, name: '' }));
        setTimeout(() => nameInputRef.current?.focus(), 50);
      }
    } catch (err) {
      alert(handleApiError(err));
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (tag: Tag) => {
    setFormData({ name: tag.name, categoryId: getId(tag.categoryId), isGlobal: false });
    setEditingId(tag._id);
    setIsTagModalOpen(true);
  };

  const handleInactivate = async (id: string) => {
    if (window.confirm('Tem certeza que deseja inativar esta tag?')) {
      try {
        setLoading(true);
        await tagApi.delete(id);
        fetchData();
      } catch (err) {
        setError(handleApiError(err));
        setLoading(false);
      }
    }
  };

  const filteredItems = tags.filter(tag => {
    const matchesName = tag.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter ? getId(tag.categoryId) === categoryFilter : true;
    return matchesName && matchesCategory;
  });

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredItems.length && filteredItems.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredItems.map(t => t._id));
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
        await Promise.all(selectedIds.map(id => tagApi.delete(id)));
        setSelectedIds([]);
        fetchData();
      } catch (err) {
        setError(handleApiError(err));
        setLoading(false);
      }
    }
  };

  const getCategoryName = (catId: string | TagCategory) => {
    const id = getId(catId);
    return categories.find(c => c._id === id)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
          <Tags size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white m-0">Gerenciar Tags</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Organize tags e categorias no seu workspace
          </p>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 p-4 rounded text-red-700">{error}</div>}

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
            Tags ({filteredItems.length})
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setEditingCategoryId(null);
                setCategoryName('');
                setIsCategoryModalOpen(true);
              }}
              className="px-4 py-2 text-sm font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-md transition-colors flex items-center gap-2"
            >
              <Settings size={16} /> Categorias
            </button>
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({ name: '', categoryId: '', isGlobal: false });
                setIsTagModalOpen(true);
              }}
              className="px-4 py-2 text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 rounded-md transition-colors shadow-sm flex items-center gap-2"
            >
              <Plus size={16} /> Nova Tag
            </button>
          </div>
        </div>

        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-3 bg-white dark:bg-gray-800">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full md:w-64 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
          >
            <option value="">Todas as Categorias</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </select>
          <div className="relative flex-1 md:max-w-md">
            <input
              type="text"
              placeholder="Buscar tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
            />
          </div>
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              className="px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-md transition-colors"
            >
              Excluir ({selectedIds.length})
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">Carregando tags...</div>
        ) : tags.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50">
            Nenhuma tag cadastrada ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="p-4 w-12 font-medium">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.length === filteredItems.length && filteredItems.length > 0} 
                      onChange={toggleSelectAll}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                  </th>
                  <th className="p-4 font-medium">Escopo</th>
                  <th className="p-4 font-medium">Nome</th>
                  <th className="p-4 font-medium">Categoria</th>
                  <th className="p-4 font-medium text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {filteredItems.map(tag => {
                  const isLocal = tag.workspaceId === currentWorkspaceId;
                  const canEdit = isLocal || user?.role === 'ADMIN';

                  return (
                  <tr key={tag._id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${selectedIds.includes(tag._id) ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}>
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(tag._id)} 
                        onChange={() => toggleSelectOne(tag._id)} 
                        disabled={!canEdit}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                      />
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${isLocal ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'}`}>
                        {isLocal ? <Home size={12} /> : <Globe size={12} />}
                        {isLocal ? 'Local' : 'Global'}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-gray-900 dark:text-gray-100">{tag.name}</td>
                    <td className="p-4 text-gray-500 dark:text-gray-400">{getCategoryName(tag.categoryId)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleEdit(tag)} 
                          disabled={!canEdit}
                          className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleInactivate(tag._id)} 
                          disabled={!canEdit}
                          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Inativar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL DE CRIAÇÃO/EDIÇÃO DE TAG */}
      {isTagModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="text-indigo-500 w-5 h-5"/> {editingId ? 'Editar Tag' : 'Nova Tag'}
              </h3>
              <button onClick={() => setIsTagModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoria</label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                >
                  <option value="">Selecione a Categoria</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Tag</label>
                <input
                  ref={nameInputRef}
                  autoFocus
                  type="text"
                  placeholder="Ex: #urgente"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateTag(false)}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                />
              </div>

              {user?.role === 'ADMIN' && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="isGlobalTag"
                    checked={formData.isGlobal}
                    onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
                    className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="isGlobalTag" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Salvar como Global (Visível a todos)
                  </label>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 bg-gray-50 dark:bg-gray-800/50">
              <button
                onClick={() => setIsTagModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleCreateTag(false)}
                disabled={formLoading}
                className="px-4 py-2 text-sm font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-400 hover:bg-indigo-200 dark:hover:bg-indigo-900 rounded-md transition-colors disabled:opacity-50"
              >
                Create
              </button>
              <button
                onClick={() => handleCreateTag(true)}
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

      {/* MODAL DE CATEGORIAS */}
      {isCategoryModalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Settings className="text-indigo-500 w-5 h-5"/> Gerenciar Categorias
              </h3>
              <button onClick={() => setIsCategoryModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Selecione para Editar ou Deletar</label>
                <div className="flex gap-2">
                  <select
                    value={editingCategoryId || ''}
                    onChange={(e) => {
                      const id = e.target.value;
                      setEditingCategoryId(id || null);
                      if (id) {
                        const cat = categories.find(c => c._id === id);
                        setCategoryName(cat ? cat.name : '');
                      } else {
                        setCategoryName('');
                      }
                    }}
                    className="flex-1 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                  >
                    <option value="">-- Criar Nova Categoria --</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                  {editingCategoryId && (
                    <button
                      onClick={async () => {
                        if (window.confirm('Excluir esta categoria apagará todas as tags vinculadas. Deseja continuar?')) {
                          await tagApi.deleteCategory(editingCategoryId);
                          setEditingCategoryId(null);
                          setCategoryName('');
                          fetchData();
                        }
                      }}
                      className="p-2 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded-md transition-colors"
                      title="Excluir Categoria"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={handleCategorySubmit} className="space-y-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome da Categoria</label>
                  <input
                    type="text"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                    placeholder="Ex: Localização, Tipo de Erro..."
                  />
                </div>

                {user?.role === 'ADMIN' && !editingCategoryId && (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="isGlobalCat"
                      checked={isGlobalCategory}
                      onChange={(e) => setIsGlobalCategory(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <label htmlFor="isGlobalCat" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Criar como Global
                    </label>
                  </div>
                )}

                <button type="submit" className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-md transition-colors">
                  {editingCategoryId ? 'Atualizar Categoria' : 'Adicionar Categoria'}
                </button>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}

    </div>
  );
}
