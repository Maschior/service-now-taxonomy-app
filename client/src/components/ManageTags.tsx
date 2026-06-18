import { useState, useEffect, useRef } from 'react';
import { tagApi, handleApiError } from '../services/api';
import { Tag, TagCategory } from '../types/index';
import { Trash2, Plus, Tags, Edit, Globe, Home, Settings, Search } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Alert, Badge, Button, Card, Checkbox, Input, Modal, Select } from './ui';

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
    <div className="space-y-6 animate-fade-in-up max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Tags className="text-brand" size={28} strokeWidth={1.5} />
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink-900 m-0">Gerenciar Tags</h1>
            <p className="text-ink-500 mt-1">Organize tags e categorias no seu workspace</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setEditingCategoryId(null);
              setCategoryName('');
              setIsCategoryModalOpen(true);
            }}
            leftIcon={<Settings size={18} strokeWidth={2} />}
          >
            Categorias
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              setEditingId(null);
              setFormData({ name: '', categoryId: '', isGlobal: false });
              setIsTagModalOpen(true);
            }}
            leftIcon={<Plus size={18} strokeWidth={2} />}
          >
            Nova Tag
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      <Card>
        <div className="p-4 border-b border-line-subtle bg-surface-2 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
            <Select
              containerClassName="w-full md:w-64"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Todas as Categorias</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </Select>
            <Input
              containerClassName="w-full md:w-64"
              placeholder="Buscar tag..."
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
          <div className="p-8 text-center text-ink-400">Carregando tags...</div>
        ) : tags.length === 0 ? (
          <div className="p-8 text-center text-ink-400">Nenhuma tag cadastrada ainda.</div>
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
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Nome</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-ink-400">Categoria</th>
                  <th className="py-3 px-4 text-xs font-semibold uppercase tracking-wide text-ink-400 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(tag => {
                  const isLocal = tag.workspaceId === currentWorkspaceId;
                  const canEdit = isLocal || user?.role === 'ADMIN';

                  return (
                  <tr key={tag._id} className={`border-b border-line-subtle hover:bg-hover transition-colors group ${selectedIds.includes(tag._id) ? 'bg-brand-tint' : ''}`}>
                    <td className="py-3 px-4 text-center">
                      <Checkbox
                        checked={selectedIds.includes(tag._id)}
                        onChange={() => toggleSelectOne(tag._id)}
                        disabled={!canEdit}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={isLocal ? 'neutral' : 'info'} withDot={false}>
                        {isLocal ? <Home size={12} strokeWidth={1.7} /> : <Globe size={12} strokeWidth={1.7} />}
                        {isLocal ? 'Local' : 'Global'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-medium text-ink-900">{tag.name}</td>
                    <td className="py-3 px-4 text-sm text-ink-500">{getCategoryName(tag.categoryId)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEdit(tag)}
                          disabled={!canEdit}
                          className="p-1.5 text-ink-400 hover:text-brand hover:bg-brand-tint rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleInactivate(tag._id)}
                          disabled={!canEdit}
                          className="p-1.5 text-ink-400 hover:text-danger-fg hover:bg-danger-bg rounded-md disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
      </Card>

      {/* MODAL DE CRIAÇÃO/EDIÇÃO DE TAG */}
      <Modal
        isOpen={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        title={<span className="flex items-center gap-2"><Plus className="text-brand" size={20} /> {editingId ? 'Editar Tag' : 'Nova Tag'}</span>}
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsTagModalOpen(false)}>Cancelar</Button>
            <Button variant="secondary" onClick={() => handleCreateTag(false)} disabled={formLoading}>Create</Button>
            <Button variant="primary" onClick={() => handleCreateTag(true)} disabled={formLoading}>Create and Close</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Categoria"
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
          >
            <option value="">Selecione a Categoria</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat._id}>{cat.name}</option>
            ))}
          </Select>

          <Input
            ref={nameInputRef}
            autoFocus
            label="Nome da Tag"
            type="text"
            placeholder="Ex: #urgente"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateTag(false)}
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

      {/* MODAL DE CATEGORIAS */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title={<span className="flex items-center gap-2"><Settings className="text-brand" size={20} /> Gerenciar Categorias</span>}
        footer={
          <Button type="submit" form="category-form" variant="primary" className="w-full">
            {editingCategoryId ? 'Atualizar Categoria' : 'Adicionar Categoria'}
          </Button>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-[13px] font-semibold text-ink-700 mb-2">Selecione para Editar ou Deletar</label>
            <div className="flex gap-2">
              <Select
                containerClassName="flex-1"
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
              >
                <option value="">-- Criar Nova Categoria --</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
              </Select>
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
                  className="p-2 text-danger-fg hover:bg-danger-bg rounded-md transition-colors"
                  title="Excluir Categoria"
                >
                  <Trash2 size={18} />
                </button>
              )}
            </div>
          </div>

          <form id="category-form" onSubmit={handleCategorySubmit} className="space-y-4 pt-4 border-t border-line-subtle">
            <Input
              label="Nome da Categoria"
              type="text"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              placeholder="Ex: Localização, Tipo de Erro..."
            />

            {user?.role === 'ADMIN' && !editingCategoryId && (
              <Checkbox
                label="Criar como Global"
                checked={isGlobalCategory}
                onChange={(e) => setIsGlobalCategory(e.target.checked)}
              />
            )}
          </form>
        </div>
      </Modal>

    </div>
  );
}
