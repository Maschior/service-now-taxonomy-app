import { useState, useEffect } from 'react';
import { Clipboard, Check, Tag, LayoutTemplate, AlertCircle, Wrench, FileText } from 'lucide-react';
import { applicationApi, moduleApi, incidentApi, actionApi, tagApi, handleApiError } from '../services/api';
import { Application, Module, Incident, Action, Tag as TagType, TagCategory } from '../types/index';

export default function TaxonomyForm() {
  const [app, setApp] = useState('');
  const [module, setModule] = useState('');
  const [incident, setIncident] = useState('');
  const [action, setAction] = useState('');

  const [activeTagCategory, setActiveTagCategory] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [motivo, setMotivo] = useState('');
  const [analise, setAnalise] = useState('');

  const [copiedStates, setCopiedStates] = useState({ short: false, resolution: false });

  const [applications, setApplications] = useState<Application[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [actions, setActions] = useState<Action[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [appsRes, categoriesRes, tagsRes] = await Promise.all([
        applicationApi.getAll(),
        tagApi.getCategories(),
        tagApi.getAll()
      ]);

      setApplications(appsRes.data);
      setTagCategories(categoriesRes.data);
      setTags(tagsRes.data);

      if (categoriesRes.data.length > 0) {
        setActiveTagCategory(categoriesRes.data[0]._id);
      }
      setError(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (app) {
      fetchRelations(app);
    } else {
      setModules([]);
      setIncidents([]);
      setActions([]);
      setModule('');
      setIncident('');
      setAction('');
    }
  }, [app]);

  const fetchRelations = async (appId: string) => {
    try {
      const [modsRes, incsRes, actsRes] = await Promise.all([
        moduleApi.getAll(appId),
        incidentApi.getAll(appId),
        actionApi.getAll(appId)
      ]);

      setModules(modsRes.data);
      setIncidents(incsRes.data);
      setActions(actsRes.data);
    } catch (err) {
      console.error('Failed to fetch relations:', handleApiError(err));
    }
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const handleCopy = (text: string, type: 'short' | 'resolution') => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [type]: true }));
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [type]: false }));
    }, 2000);
  };

  const availableTags = tags.filter(t =>
    typeof t.categoryId === 'object' ? t.categoryId._id === activeTagCategory : t.categoryId === activeTagCategory
  );

  const selectedTagNames = selectedTags
    .map(id => tags.find(t => t._id === id)?.name)
    .filter(Boolean) as string[];

  const shortDescription = [
    app ? applications.find(a => a._id === app)?.name : '',
    module ? modules.find(m => m._id === module)?.name : '',
    'Local Support',
    incident ? incidents.find(i => i._id === incident)?.name : '',
    action ? actions.find(a => a._id === action)?.name : ''
  ]
    .filter(Boolean)
    .join(':');

  const resolutionNotes = `${selectedTagNames.join('\n')}${selectedTagNames.length > 0 ? '\n\n' : ''}- Motivo: ${motivo}\n- Análise: ${analise}`;

  const Chip = ({ label, isSelected, onClick, disabled }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 border
        ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 border-slate-200 text-slate-400' :
          isSelected
            ? 'bg-blue-600 text-white border-blue-600 shadow-md transform scale-105'
            : 'bg-white text-slate-700 border-slate-300 hover:border-blue-400 hover:bg-blue-50'}
      `}
    >
      {label}
    </button>
  );

  const SectionCard = ({ title, icon: Icon, children }: any) => (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
      <div className="flex items-center space-x-2 mb-4 border-b border-slate-100 pb-3">
        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
          <Icon size={20} />
        </div>
        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      </div>
      {children}
    </div>
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-red-600 rounded-md flex items-center justify-center text-white font-bold text-xl italic">
              C
            </div>
            <h1 className="text-xl font-bold text-slate-800">Taxonomia de Chamados</h1>
          </div>
          <button
            onClick={() => { setApp(''); setSelectedTags([]); setMotivo(''); setAnalise(''); }}
            className="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
          >
            Limpar Tudo
          </button>
        </div>
      </header>

      {error && (
        <div className="max-w-7xl mx-auto px-6 py-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        <div className="w-full lg:w-2/3">
          <SectionCard title="1. Contexto do Chamado" icon={LayoutTemplate}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Aplicação</label>
                <select
                  value={app}
                  onChange={(e) => setApp(e.target.value)}
                  className="w-full max-w-md bg-white border border-slate-300 text-slate-800 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block p-2.5 shadow-sm"
                >
                  <option value="">Selecione uma aplicação...</option>
                  {applications.map(a => (
                    <option key={a._id} value={a._id}>{a.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Módulo {app ? '' : <span className="text-slate-400 font-normal">(Selecione a aplicação primeiro)</span>}
                </label>
                <div className="flex flex-wrap gap-2">
                  {modules.length > 0 ? (
                    modules.map(m => (
                      <Chip key={m._id} label={m.name} isSelected={module === m._id} onClick={() => setModule(m._id)} />
                    ))
                  ) : (
                    <div className="text-sm text-slate-400 italic">Nenhum módulo disponível.</div>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="2. Problema e Resolução" icon={Wrench}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Incidente Relatado</label>
                <div className="flex flex-wrap gap-2">
                  {incidents.length > 0 ? (
                    incidents.map(i => (
                      <Chip key={i._id} label={i.name} isSelected={incident === i._id} onClick={() => setIncident(i._id)} disabled={!app} />
                    ))
                  ) : (
                    <div className="text-sm text-slate-400 italic">Aguardando aplicação...</div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Ação Tomada</label>
                <div className="flex flex-wrap gap-2">
                  {actions.length > 0 ? (
                    actions.map(a => (
                      <Chip key={a._id} label={a.name} isSelected={action === a._id} onClick={() => setAction(a._id)} disabled={!app} />
                    ))
                  ) : (
                    <div className="text-sm text-slate-400 italic">Aguardando aplicação...</div>
                  )}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="3. Classificação e Notas (Opcional)" icon={Tag}>
            <div className="space-y-6">
              <div>
                <div className="flex space-x-1 border-b border-slate-200 mb-4 overflow-x-auto pb-1">
                  {tagCategories.map(cat => (
                    <button
                      key={cat._id}
                      onClick={() => setActiveTagCategory(cat._id)}
                      className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors
                        ${activeTagCategory === cat._id
                          ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 min-h-[80px]">
                  {availableTags.map(tag => (
                    <button
                      key={tag._id}
                      onClick={() => toggleTag(tag._id)}
                      className={`px-3 py-1.5 rounded text-sm transition-colors border
                        ${selectedTags.includes(tag._id)
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-200 font-medium'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Motivo</label>
                  <textarea
                    value={motivo}
                    onChange={(e) => setMotivo(e.target.value)}
                    placeholder="Ex: Utilizador bloqueado no AD..."
                    className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none h-24 shadow-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-2">Análise (Passo a passo)</label>
                  <textarea
                    value={analise}
                    onChange={(e) => setAnalise(e.target.value)}
                    placeholder="Ex: Acedido ao AD, verificado bloqueio, procedido ao desbloqueio..."
                    className="w-full bg-white border border-slate-300 text-slate-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none h-24 shadow-sm"
                  />
                </div>
              </div>
            </div>
          </SectionCard>
        </div>

        <div className="w-full lg:w-1/3">
          <div className="sticky top-24 space-y-6">
            <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden flex flex-col">
              <div className="bg-slate-900 px-5 py-3 border-b border-slate-700 flex justify-between items-center">
                <div className="flex items-center space-x-2 text-slate-300">
                  <FileText size={16} />
                  <span className="font-semibold text-sm">Short Description</span>
                </div>
                <button
                  onClick={() => handleCopy(shortDescription, 'short')}
                  className="flex items-center space-x-1 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-900/30 px-3 py-1.5 rounded-md transition-colors"
                >
                  {copiedStates.short ? <Check size={14} /> : <Clipboard size={14} />}
                  <span>{copiedStates.short ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <div className="p-5 flex-1 bg-slate-800">
                <p className={`font-mono text-sm break-words ${shortDescription ? 'text-white' : 'text-slate-500 italic'}`}>
                  {shortDescription || "Os dados gerados aparecerão aqui..."}
                </p>
              </div>
            </div>

            <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden flex flex-col">
              <div className="bg-slate-900 px-5 py-3 border-b border-slate-700 flex justify-between items-center">
                <div className="flex items-center space-x-2 text-slate-300">
                  <AlertCircle size={16} />
                  <span className="font-semibold text-sm">Resolution Notes</span>
                </div>
                <button
                  onClick={() => handleCopy(resolutionNotes, 'resolution')}
                  className="flex items-center space-x-1 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-900/30 px-3 py-1.5 rounded-md transition-colors"
                >
                  {copiedStates.resolution ? <Check size={14} /> : <Clipboard size={14} />}
                  <span>{copiedStates.resolution ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <div className="p-5 flex-1 bg-slate-800">
                <pre className="font-mono text-sm text-white whitespace-pre-wrap break-words">
                  {resolutionNotes}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
