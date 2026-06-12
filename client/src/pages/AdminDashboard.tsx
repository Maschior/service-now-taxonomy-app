import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { applicationApi, moduleApi, incidentApi, actionApi, tagApi, handleApiError } from '../services/api';
import { BarChart3, Package, AlertTriangle, Zap, Tags, ArrowRight, Sparkles, Info } from 'lucide-react';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    applications: 0,
    modules: 0,
    incidents: 0,
    actions: 0,
    tags: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const [appsRes, modsRes, incsRes, actsRes, tagsRes] = await Promise.all([
        applicationApi.getAll(),
        moduleApi.getAll(),
        incidentApi.getAll({}),
        actionApi.getAll({}),
        tagApi.getAll()
      ]);

      setStats({
        applications: appsRes.data.length,
        modules: modsRes.data.length,
        incidents: incsRes.data.length,
        actions: actsRes.data.length,
        tags: tagsRes.data.length
      });
      setError(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { icon: Package, label: 'Applications', value: stats.applications, gradient: 'from-blue-500 to-indigo-500' },
    { icon: BarChart3, label: 'Modules', value: stats.modules, gradient: 'from-emerald-500 to-teal-500' },
    { icon: AlertTriangle, label: 'Incidents', value: stats.incidents, gradient: 'from-amber-500 to-orange-500' },
    { icon: Zap, label: 'Actions', value: stats.actions, gradient: 'from-purple-500 to-violet-500' },
    { icon: Tags, label: 'Tags', value: stats.tags, gradient: 'from-cyan-500 to-blue-500' },
  ];

  const quickLinks = [
    { path: '/manage/applications', label: 'Gerenciar Applications', color: 'var(--accent-primary)' },
    { path: '/manage/modules', label: 'Gerenciar Modules', color: '#10b981' },
    { path: '/manage/incidents', label: 'Gerenciar Incidents', color: '#f59e0b' },
    { path: '/manage/actions', label: 'Gerenciar Actions', color: '#8b5cf6' },
    { path: '/manage/tags', label: 'Gerenciar Tags', color: '#06b6d4' },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold" style={{ color: 'var(--text-primary)' }}>
          Admin Dashboard
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          Gerencie os dados da taxonomia
        </p>
      </div>

      {error && (
        <div className="section-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <span style={{ color: '#ef4444' }}>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Sparkles size={32} className="animate-pulse" style={{ color: 'var(--accent-primary)' }} />
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 stagger-children">
            {statCards.map(({ icon: Icon, label, value, gradient }) => (
              <div key={label} className="stat-card">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center`}>
                    <Icon size={20} className="text-white" />
                  </div>
                </div>
                <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value}</p>
                <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
              </div>
            ))}
          </div>

          {/* Quick Actions & Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="section-card">
              <h2 className="text-base font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>
                Ações Rápidas
              </h2>
              <div className="space-y-2">
                {quickLinks.map(link => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className="flex items-center justify-between px-4 py-2.5 rounded-lg transition-all duration-200 group"
                    style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}
                  >
                    <span className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {link.label}
                    </span>
                    <ArrowRight
                      size={14}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                      style={{ color: link.color }}
                    />
                  </Link>
                ))}
              </div>
            </div>

            <div className="section-card">
              <div className="flex items-center gap-2 mb-4">
                <Info size={16} style={{ color: 'var(--accent-primary)' }} />
                <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Informações
                </h2>
              </div>
              <div className="space-y-3">
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Use este dashboard para gerenciar aplicações, módulos, incidentes, ações e tags da taxonomia.
                </p>
                <div className="text-xs leading-relaxed p-3 rounded-lg" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
                  <strong style={{ color: 'var(--text-secondary)' }}>Hierarquia:</strong>
                  <br />
                  Application → Module → Incident → Action
                  <br /><br />
                  <strong style={{ color: 'var(--text-secondary)' }}>Relacionamentos:</strong>
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
