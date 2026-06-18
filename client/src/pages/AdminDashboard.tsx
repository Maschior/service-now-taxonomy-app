import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { applicationApi, moduleApi, incidentApi, actionApi, tagApi, importApi, handleApiError, userApi } from '../services/api';
import { BarChart3, Package, AlertTriangle, Zap, Tags, ArrowRight, Sparkles, Info, UploadCloud, Users } from 'lucide-react';
import { Alert, Button } from '../components/ui';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    applications: 0,
    modules: 0,
    incidents: 0,
    actions: 0,
    tags: 0,
    users: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Bulk Import state
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [appsRes, modsRes, incsRes, actsRes, tagsRes, usersRes] = await Promise.all([
        applicationApi.getAll(),
        moduleApi.getAll(),
        incidentApi.getAll({}),
        actionApi.getAll({}),
        tagApi.getAll(),
        userApi.getAll()
      ]);

      setStats({
        applications: appsRes.data.length,
        modules: modsRes.data.length,
        incidents: incsRes.data.length,
        actions: actsRes.data.length,
        tags: tagsRes.data.length,
        users: usersRes.data.length
      });
      setError(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setImportMsg('');
    setError(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        if (text) {
          const res = await importApi.importCsv(text);
          let msg = res.data.message;

          // Append error details if any
          if (res.data.errors && res.data.errors.length > 0) {
            msg += '\n\nErros encontrados:\n';
            res.data.errors.slice(0, 5).forEach((err: string) => {
              msg += `• ${err}\n`;
            });
            if (res.data.errors.length > 5) {
              msg += `... e mais ${res.data.errors.length - 5} erros`;
            }
            setError(msg);
          } else {
            setImportMsg(msg);
          }

          fetchStats(); // Refresh stats after import
        }
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setImporting(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
    };
    reader.onerror = () => {
      setError('Erro ao ler o arquivo CSV.');
      setImporting(false);
    };
    reader.readAsText(file);
  };

  const statCards = [
    { icon: Package, label: 'Applications', value: stats.applications },
    { icon: BarChart3, label: 'Modules', value: stats.modules },
    { icon: AlertTriangle, label: 'Incidents', value: stats.incidents },
    { icon: Zap, label: 'Actions', value: stats.actions },
    { icon: Tags, label: 'Tags', value: stats.tags },
    { icon: Users, label: 'Users', value: stats.users },
  ];

  const quickLinks = [
    { path: '/manage/users', label: 'Gerenciar Usuários' },
    { path: '/manage/applications', label: 'Gerenciar Applications' },
    { path: '/manage/modules', label: 'Gerenciar Modules' },
    { path: '/manage/incidents', label: 'Gerenciar Incidents' },
    { path: '/manage/actions', label: 'Gerenciar Actions' },
    { path: '/manage/tags', label: 'Gerenciar Tags' },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <div className="font-mono text-xs uppercase tracking-[0.08em] text-brand font-medium">Administração</div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-ink-900 mt-1">
          Admin Dashboard
        </h1>
        <p className="text-sm mt-1 text-ink-500">
          Gerencie os dados da taxonomia
        </p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {importMsg && <Alert variant="success">{importMsg}</Alert>}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Sparkles size={32} className="animate-pulse text-brand" />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 stagger-children">
            {statCards.map(({ icon: Icon, label, value }) => (
              <div key={label} className="stat-card">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-chip flex items-center justify-center text-ink-700">
                    <Icon size={20} strokeWidth={1.5} />
                  </div>
                </div>
                <p className="text-2xl font-bold text-ink-900">{value}</p>
                <p className="text-xs font-medium mt-1 text-ink-400">{label}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Bulk Import */}
            <div className="section-card lg:col-span-3">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-line-subtle">
                <div className="p-1.5 rounded-lg bg-brand-tint">
                  <UploadCloud size={18} strokeWidth={1.5} className="text-brand" />
                </div>
                <h2 className="text-base font-semibold text-ink-900">
                  Importar via CSV (ServiceNow)
                </h2>
              </div>
              <div className="flex flex-col gap-4">
                <p className="text-sm leading-relaxed text-ink-500">
                  Faça o upload de um arquivo `.csv` contendo os dados de <strong>Short Description</strong> extraídos do Service Now. O formato esperado para cada linha é:
                </p>
                <code className="block p-3 rounded-lg text-xs font-mono bg-sunken text-ink-500 border border-line">
                  "Application:Module:Local Support:Incident:Action"
                </code>
                <div className="flex justify-start">
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                  />
                  <Button
                    variant="primary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={importing}
                    leftIcon={importing ? <Sparkles size={16} className="animate-pulse" /> : <UploadCloud size={16} />}
                  >
                    {importing ? 'Importando...' : 'Selecionar Arquivo CSV'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="section-card lg:col-span-1">
              <h2 className="text-base font-semibold mb-4 text-ink-900">
                Ações Rápidas
              </h2>
              <div className="space-y-2">
                {quickLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="flex items-center justify-between px-4 py-2.5 rounded-lg transition-colors duration-150 group bg-sunken border border-line hover:border-brand hover:bg-brand-tint"
                  >
                    <span className="text-sm font-medium text-ink-700 group-hover:text-brand">
                      {link.label}
                    </span>
                    <ArrowRight
                      size={14}
                      className="text-ink-400 group-hover:text-brand transition-transform duration-150 group-hover:translate-x-1"
                    />
                  </Link>
                ))}
              </div>
            </div>

            {/* Info */}
            <div className="section-card lg:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <Info size={16} strokeWidth={1.5} className="text-brand" />
                <h2 className="text-base font-semibold text-ink-900">
                  Informações
                </h2>
              </div>
              <div className="space-y-3">
                <p className="text-sm leading-relaxed text-ink-500">
                  Use este dashboard para gerenciar aplicações, módulos, incidentes, ações e tags da taxonomia.
                </p>
                <div className="text-xs leading-relaxed p-3 rounded-lg bg-sunken text-ink-400">
                  <strong className="text-ink-700">Hierarquia:</strong>
                  <br />
                  Application → Module → Incident → Action
                  <br /><br />
                  <strong className="text-ink-700">Relacionamentos:</strong>
                  <br />
                  • 1 App → N Módulos
                  <br />
                  • N Módulos ↔ N Incidentes
                  <br />
                  • N Incidentes ↔ N Ações
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
