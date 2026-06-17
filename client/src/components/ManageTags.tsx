import { useState, useEffect } from 'react';
import { tagApi, handleApiError } from '../services/api';
import { Tag, TagCategory } from '../types/index';
import { Trash2, Plus, X, Tags, Edit, Globe, Home } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const getId = (item: any) => typeof item === 'object' && item !== null ? item._id : item;

export default function ManageTags() {
  const { user, currentWorkspaceId } = useAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', categoryId: '', isGlobal: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Category state
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [isGlobalCategory, setIsGlobalCategory] = useState(false);

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
      setError(handleApiError(err));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.categoryId) return;

    try {
      if (editingId) {
        await tagApi.update(editingId, formData);
      } else {
        await tagApi.create(formData);
      }
      setFormData({ name: '', categoryId: '', isGlobal: false });
      setEditingId(null);
      fetchData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleEdit = (tag: Tag) => {
    setFormData({ name: tag.name, categoryId: getId(tag.categoryId), isGlobal: false });
    setEditingId(tag._id);
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
        <Tags className="text-primary w-8 h-8" />
        <h1 className="text-3xl font-bold m-0">Manage Tags</h1>
      </div>

      {error && <div className="bg-red-50 border border-red-200 p-4 rounded text-red-700">{error}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="section-card p-6 h-fit">
          <h2 className="text-xl font-semibold mb-4">Manage Categories</h2>
          <div className="mb-4">
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
              className="form-input"
            >
              <option value="">-- Create New Category --</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Category name (e.g., Equipment Type)"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="form-input"
            />
            {user?.role === 'ADMIN' && !editingCategoryId && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isGlobalCategory"
                  checked={isGlobalCategory}
                  onChange={(e) => setIsGlobalCategory(e.target.checked)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <label htmlFor="isGlobalCategory" className="text-sm font-medium text-[var(--text-secondary)]">
                  Criar como Global
                </label>
              </div>
            )}
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Plus size={18} /> {editingCategoryId ? 'Atualizar' : 'Adicionar'}
              </button>
              {editingCategoryId && (
                <button
                  type="button"
                  onClick={async () => {
                    if (window.confirm('Delete this category and ALL its tags? This cannot be undone.')) {
                      try {
                        await tagApi.deleteCategory(editingCategoryId);
                        setEditingCategoryId(null);
                        setCategoryName('');
                        fetchData();
                      } catch (err) {
                        setError(handleApiError(err));
                      }
                    }
                  }}
                  className="btn-primary" style={{ background: '#ef4444', border: 'none' }}
                >
                  <Trash2 size={18} /> Delete
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="section-card p-6 h-fit">
          <h2 className="text-xl font-semibold mb-4">Add/Edit Tag</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="form-input"
            >
              <option value="">Select Category</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Tag name (e.g., #PLC)"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
            />
            {user?.role === 'ADMIN' && !editingId && (
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isGlobalTag"
                  checked={formData.isGlobal}
                  onChange={(e) => setFormData({ ...formData, isGlobal: e.target.checked })}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
                <label htmlFor="isGlobalTag" className="text-sm font-medium text-[var(--text-secondary)]">
                  Criar como Global
                </label>
              </div>
            )}
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Plus size={18} /> {editingId ? 'Atualizar' : 'Adicionar'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => { setEditingId(null); setFormData({ name: '', categoryId: '', isGlobal: false }); }}
                  className="btn-ghost flex items-center gap-2"
                >
                  <X size={18} /> Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      <div className="section-card">
        <div className="p-6 border-b border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h2 className="text-xl font-semibold m-0">Existing Tags ({filteredItems.length})</h2>
          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="form-input text-sm w-full md:w-48"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>{cat.name}</option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Filter by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input text-sm w-full md:w-48"
            />
            {selectedIds.length > 0 && (
              <button onClick={handleBulkDelete} className="btn-primary" style={{ background: '#ef4444', border: 'none' }}>
                Delete ({selectedIds.length})
              </button>
            )}
          </div>
        </div>
        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : tags.length === 0 ? (
          <div className="p-6 text-center text-slate-500">No tags yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th className="text-left p-4 w-12">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.length === filteredItems.length && filteredItems.length > 0} 
                      onChange={toggleSelectAll} 
                    />
                  </th>
                  <th className="text-left p-4">Escopo</th>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-right p-4">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(tag => {
                  const isLocal = tag.workspaceId === currentWorkspaceId;
                  const canEdit = isLocal || user?.role === 'ADMIN';

                  return (
                  <tr key={tag._id} className={selectedIds.includes(tag._id) ? "bg-red-500/5" : ""}>
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(tag._id)} 
                        onChange={() => toggleSelectOne(tag._id)} 
                        disabled={!canEdit}
                      />
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${isLocal ? 'bg-indigo-100 text-indigo-800' : 'bg-amber-100 text-amber-800'}`}>
                        {isLocal ? <Home size={12} /> : <Globe size={12} />}
                        {isLocal ? 'Local' : 'Global'}
                      </span>
                    </td>
                    <td className="p-4 font-mono">{tag.name}</td>
                    <td className="p-4 opacity-70 text-sm">{getCategoryName(tag.categoryId)}</td>
                    <td className="p-4 text-right space-x-2">
                      <button 
                        onClick={() => handleEdit(tag)} 
                        disabled={!canEdit}
                        className="btn-ghost p-2 text-blue-500 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Editar"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleInactivate(tag._id)} 
                        disabled={!canEdit}
                        className="btn-ghost p-2 text-red-500 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Inativar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
