import { useState, useEffect } from 'react';
import { closureApi, handleApiError } from '../services/api';
import { Closure } from '../types';
import { useDebounce } from '../hooks/useDebounce';
import { Search, Trash2, Calendar, LayoutTemplate, Tag as TagIcon } from 'lucide-react';
import { Alert, Button } from '../components/ui';

export default function ClosuresPage() {
  const [closures, setClosures] = useState<Closure[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  const [shortDesc, setShortDesc] = useState('');
  const debouncedShortDesc = useDebounce(shortDesc, 500);

  useEffect(() => {
    fetchClosures();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, debouncedSearch, debouncedShortDesc]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, debouncedShortDesc]);

  const fetchClosures = async () => {
    try {
      setLoading(true);
      const res = await closureApi.getAll({
        page,
        limit,
        search: debouncedSearch || undefined,
        shortDescription: debouncedShortDesc || undefined
      });
      setClosures(res.data.data);
      setTotalPages(res.data.pagination.totalPages);
      setTotal(res.data.pagination.total);
      setError(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir este fechamento?')) return;
    try {
      await closureApi.delete(id);
      fetchClosures();
    } catch (err) {
      setError(handleApiError(err));
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  return (
    <div className="animate-fade-in-up space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink-900">Registros de Fechamento</h1>
          <p className="text-sm text-ink-500">Histórico de incidentes e ações tomadas</p>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {/* Filters */}
      <div className="section-card p-4 flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-[13px] font-semibold mb-2 text-ink-700">Busca de Texto (Notas, Motivo...)</label>
          <div className="relative">
            <Search size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Pesquisar por conteúdo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="form-input pl-10 text-sm"
            />
          </div>
        </div>
        <div className="flex-1">
          <label className="block text-[13px] font-semibold mb-2 text-ink-700">Hierarquia (Short Description)</label>
          <div className="relative">
            <LayoutTemplate size={16} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
            <input
              type="text"
              placeholder="Ex: App:Mod..."
              value={shortDesc}
              onChange={e => setShortDesc(e.target.value)}
              className="form-input pl-10 text-sm font-mono"
            />
          </div>
        </div>
      </div>

      {/* List */}
      <div className="space-y-4">
        {loading && closures.length === 0 ? (
          <div className="text-center py-8 text-ink-400">Carregando fechamentos...</div>
        ) : closures.length === 0 ? (
          <div className="text-center py-8 section-card text-ink-400">Nenhum fechamento encontrado.</div>
        ) : (
          closures.map(closure => (
            <div key={closure._id} className="section-card p-4 relative flex flex-col gap-3">
              <button
                onClick={() => handleDelete(closure._id)}
                className="absolute top-4 right-4 p-1.5 rounded-md text-ink-400 hover:bg-danger-bg hover:text-danger-fg transition-colors"
                title="Excluir Fechamento"
              >
                <Trash2 size={16} />
              </button>

              <div>
                <h3 className="font-semibold font-mono text-sm mb-1 text-ink-900 pr-8">
                  {closure.shortDescription}
                </h3>
                <div className="flex items-center gap-4 text-xs text-ink-400">
                  <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(closure.createdAt)}</span>
                  {closure.tags && closure.tags.length > 0 && (
                    <span className="flex items-center gap-1">
                      <TagIcon size={12} /> {closure.tags.length} Tags
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mt-2 pt-3 border-t border-line-subtle">
                <div>
                  <span className="block text-xs font-semibold mb-1 text-ink-700">Motivo</span>
                  <p className="break-words text-ink-900">{closure.motivo || '-'}</p>
                </div>
                <div>
                  <span className="block text-xs font-semibold mb-1 text-ink-700">Análise</span>
                  <p className="break-words text-ink-900">{closure.analise || '-'}</p>
                </div>
                <div>
                  <span className="block text-xs font-semibold mb-1 text-ink-700">Solução</span>
                  <p className="break-words text-ink-900">{closure.solucao || '-'}</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 0 && (
        <div className="flex items-center justify-between section-card p-3">
          <span className="text-xs text-ink-400">
            Mostrando {closures.length} de {total} registros
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              Anterior
            </Button>
            <span className="text-xs font-medium text-ink-900">
              Página {page} de {totalPages}
            </span>
            <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
