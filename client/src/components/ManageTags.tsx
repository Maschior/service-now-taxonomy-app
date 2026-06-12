import { useState, useEffect } from 'react';
import { tagApi, handleApiError } from '../services/api';
import { Tag, TagCategory } from '../types/index';
import { Trash2, Plus, Edit2, X, Tags } from 'lucide-react';

const getId = (item: any) => typeof item === 'object' && item !== null ? item._id : item;

export default function ManageTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tag state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', categoryId: '' });

  // Category state
  const [categoryName, setCategoryName] = useState('');

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
      await tagApi.createCategory({ name: categoryName });
      setCategoryName('');
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
      setFormData({ name: '', categoryId: '' });
      setEditingId(null);
      fetchData();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const handleEdit = (tag: Tag) => {
    setFormData({
      name: tag.name,
      categoryId: getId(tag.categoryId)
    });
    setEditingId(tag._id);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure?')) {
      try {
        await tagApi.delete(id);
        fetchData();
      } catch (err) {
        setError(handleApiError(err));
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
          <h2 className="text-xl font-semibold mb-4">Add Category</h2>
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Category name (e.g., Equipment Type)"
              value={categoryName}
              onChange={(e) => setCategoryName(e.target.value)}
              className="form-input"
            />
            <button type="submit" className="btn-primary flex items-center gap-2">
              <Plus size={18} /> Add Category
            </button>
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
            <div className="flex gap-2">
              <button type="submit" className="btn-primary flex items-center gap-2">
                <Plus size={18} /> {editingId ? 'Update' : 'Add'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => { setEditingId(null); setFormData({ name: '', categoryId: '' }); }}
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
        <h2 className="text-xl font-semibold p-6 border-b border-white/10">Existing Tags ({tags.length})</h2>
        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : tags.length === 0 ? (
          <div className="p-6 text-center text-slate-500">No tags yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table w-full">
              <thead>
                <tr>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tags.map(tag => (
                  <tr key={tag._id}>
                    <td className="p-4 font-mono">{tag.name}</td>
                    <td className="p-4 opacity-70">{getCategoryName(tag.categoryId)}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(tag)}
                        className="btn-ghost inline-flex items-center gap-1 px-3 py-1"
                      >
                        <Edit2 size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tag._id)}
                        className="text-red-400 hover:text-red-300 inline-flex items-center gap-1 px-3 py-1"
                      >
                        <Trash2 size={16} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
