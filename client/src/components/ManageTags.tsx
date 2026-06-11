import { useState, useEffect } from 'react';
import { tagApi, handleApiError } from '../services/api';
import { Tag, TagCategory } from '../types/index';
import { Trash2, Plus, Edit2, X } from 'lucide-react';

export default function ManageTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [categories, setCategories] = useState<TagCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', categoryId: '' });

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
      categoryId: typeof tag.categoryId === 'object' ? tag.categoryId._id : tag.categoryId
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
    if (typeof catId === 'object') return catId.name;
    return categories.find(c => c._id === catId)?.name || 'Unknown';
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Manage Tags</h1>

      {error && <div className="bg-red-50 border border-red-200 p-4 rounded text-red-700">{error}</div>}

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Add/Edit Tag</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            className="w-full border border-slate-300 rounded-lg p-2"
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
            className="w-full border border-slate-300 rounded-lg p-2"
          />
          <div className="flex gap-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Plus size={18} /> {editingId ? 'Update' : 'Add'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={() => { setEditingId(null); setFormData({ name: '', categoryId: '' }); }}
                className="bg-slate-400 text-white px-4 py-2 rounded-lg hover:bg-slate-500 flex items-center gap-2"
              >
                <X size={18} /> Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="bg-white rounded-lg shadow">
        <h2 className="text-xl font-semibold p-6 border-b">Existing Tags ({tags.length})</h2>
        {loading ? (
          <div className="p-6 text-center">Loading...</div>
        ) : tags.length === 0 ? (
          <div className="p-6 text-center text-slate-500">No tags yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Category</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tags.map(tag => (
                  <tr key={tag._id} className="border-t hover:bg-slate-50">
                    <td className="p-4 font-mono">{tag.name}</td>
                    <td className="p-4 text-slate-600">{getCategoryName(tag.categoryId)}</td>
                    <td className="p-4 text-right space-x-2">
                      <button
                        onClick={() => handleEdit(tag)}
                        className="text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
                      >
                        <Edit2 size={16} /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(tag._id)}
                        className="text-red-600 hover:text-red-800 inline-flex items-center gap-1"
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
