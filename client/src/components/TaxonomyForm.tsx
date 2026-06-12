import { useState, useEffect, useMemo } from 'react';
import { Clipboard, Check, Tag, LayoutTemplate, AlertCircle, Wrench, FileText, Sparkles } from 'lucide-react';
import { applicationApi, moduleApi, incidentApi, actionApi, tagApi, handleApiError } from '../services/api';
import { Application, Module, Incident, Action, Tag as TagType, TagCategory } from '../types/index';

/** Utility to extract ID from a potentially populated field */
const getId = (field: string | { _id: string }): string =>
  typeof field === 'object' && field !== null ? field._id : field;

export default function TaxonomyForm() {
  // Selected IDs
  const [selectedApp, setSelectedApp] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedIncident, setSelectedIncident] = useState('');
  const [selectedAction, setSelectedAction] = useState('');

  // Tags
  const [activeCategories, setActiveCategories] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Text fields
  const [motivo, setMotivo] = useState('');
  const [analise, setAnalise] = useState('');

  // Copy states
  const [copiedStates, setCopiedStates] = useState({ short: false, resolution: false });

  // Data from API
  const [applications, setApplications] = useState<Application[]>([]);
  const [allModules, setAllModules] = useState<Module[]>([]);
  const [allIncidents, setAllIncidents] = useState<Incident[]>([]);
  const [allActions, setAllActions] = useState<Action[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [tagCategories, setTagCategories] = useState<TagCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ──────────────────── DATA FETCHING ────────────────────

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [appsRes, modsRes, incsRes, actsRes, categoriesRes, tagsRes] = await Promise.all([
        applicationApi.getAll(),
        moduleApi.getAll(),
        incidentApi.getAll({}),
        actionApi.getAll({}),
        tagApi.getCategories(),
        tagApi.getAll(),
      ]);

      setApplications(appsRes.data);
      setAllModules(modsRes.data);
      setAllIncidents(incsRes.data);
      setAllActions(actsRes.data);
      setTagCategories(categoriesRes.data);
      setTags(tagsRes.data);
      setError(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  // ──────────────────── CASCADING FILTERS (SLICER LOGIC) ────────────────────

  /** Modules filtered by selected Application */
  const filteredModules = useMemo(() => {
    if (!selectedApp) return allModules;
    return allModules.filter(m => getId(m.applicationId) === selectedApp);
  }, [allModules, selectedApp]);

  /** Incidents filtered by selected Module (and indirectly by App) */
  const filteredIncidents = useMemo(() => {
    const validModuleIds = new Set(filteredModules.map(m => m._id));

    if (selectedModule) {
      // Show incidents linked to selected module
      return allIncidents.filter(inc =>
        inc.moduleIds.some(mid => getId(mid) === selectedModule)
      );
    }

    if (selectedApp) {
      // Show incidents linked to any module of this app
      return allIncidents.filter(inc =>
        inc.moduleIds.some(mid => validModuleIds.has(getId(mid)))
      );
    }

    return allIncidents;
  }, [allIncidents, filteredModules, selectedModule, selectedApp]);

  /** Actions filtered by selected Incident (and indirectly by Module/App) */
  const filteredActions = useMemo(() => {
    const validIncidentIds = new Set(filteredIncidents.map(i => i._id));

    if (selectedIncident) {
      return allActions.filter(act =>
        act.incidentIds.some(iid => getId(iid) === selectedIncident)
      );
    }

    if (selectedModule || selectedApp) {
      return allActions.filter(act =>
        act.incidentIds.some(iid => validIncidentIds.has(getId(iid)))
      );
    }

    return allActions;
  }, [allActions, filteredIncidents, selectedIncident, selectedModule, selectedApp]);

  // ──────────────────── REVERSE FILTER (when selecting from bottom up) ────────────────────

  /** When an action is selected, highlight which incidents it belongs to */
  const highlightedIncidentIds = useMemo(() => {
    if (!selectedAction) return new Set<string>();
    const action = allActions.find(a => a._id === selectedAction);
    if (!action) return new Set<string>();
    return new Set(action.incidentIds.map(iid => getId(iid)));
  }, [selectedAction, allActions]);

  /** When an incident is selected, highlight which modules it belongs to */
  const highlightedModuleIds = useMemo(() => {
    if (!selectedIncident) return new Set<string>();
    const incident = allIncidents.find(i => i._id === selectedIncident);
    if (!incident) return new Set<string>();
    return new Set(incident.moduleIds.map(mid => getId(mid)));
  }, [selectedIncident, allIncidents]);

  // ──────────────────── SELECTION HANDLERS ────────────────────

  const autoSelectChain = (startLevel: 'app' | 'module' | 'incident' | 'action', id: string, unselect: boolean = false) => {
    if (unselect) {
      if (startLevel === 'action') setSelectedAction('');
      if (startLevel === 'incident') { setSelectedIncident(''); setSelectedAction(''); }
      if (startLevel === 'module') { setSelectedModule(''); setSelectedIncident(''); setSelectedAction(''); }
      if (startLevel === 'app') { setSelectedApp(''); setSelectedModule(''); setSelectedIncident(''); setSelectedAction(''); }
      return;
    }

    let finalApp = selectedApp;
    let finalMod = selectedModule;
    let finalInc = selectedIncident;
    let finalAct = selectedAction;

    if (startLevel === 'action') {
      finalAct = id;
      const action = allActions.find(a => a._id === id);
      if (!action?.incidentIds.map(getId).includes(finalInc)) {
        const validIncs = allIncidents.filter(i => action?.incidentIds.map(getId).includes(i._id)).sort((a,b) => a.name.localeCompare(b.name));
        finalInc = validIncs[0]?._id || '';
      }
    }

    if (startLevel === 'incident' || (startLevel === 'action' && finalInc)) {
      if (startLevel === 'incident') finalInc = id;
      const incident = allIncidents.find(i => i._id === finalInc);
      if (!incident?.moduleIds.map(getId).includes(finalMod)) {
        const validMods = allModules.filter(m => incident?.moduleIds.map(getId).includes(m._id)).sort((a,b) => a.name.localeCompare(b.name));
        finalMod = validMods[0]?._id || '';
      }
    }

    if (startLevel === 'module' || ((startLevel === 'incident' || startLevel === 'action') && finalMod)) {
      if (startLevel === 'module') finalMod = id;
      const module = allModules.find(m => m._id === finalMod);
      if (module && getId(module.applicationId) !== finalApp) {
        finalApp = getId(module.applicationId);
      }
    }

    if (startLevel === 'app') {
      finalApp = id;
      if (!finalApp) {
        finalMod = '';
        finalInc = '';
        finalAct = '';
      }
    }

    // Cascade downwards to fill missing pieces with the first available option
    if (finalApp) {
      const module = allModules.find(m => m._id === finalMod);
      if (!module || getId(module.applicationId) !== finalApp) {
        const validMods = allModules.filter(m => getId(m.applicationId) === finalApp).sort((a,b) => a.name.localeCompare(b.name));
        finalMod = validMods[0]?._id || '';
      }
    }
    if (finalMod) {
      const incident = allIncidents.find(i => i._id === finalInc);
      if (!incident || !incident.moduleIds.map(getId).includes(finalMod)) {
        const validIncs = allIncidents.filter(i => i.moduleIds.map(getId).includes(finalMod)).sort((a,b) => a.name.localeCompare(b.name));
        finalInc = validIncs[0]?._id || '';
      }
    }
    if (finalInc) {
      const action = allActions.find(a => a._id === finalAct);
      if (!action || !action.incidentIds.map(getId).includes(finalInc)) {
        const validActs = allActions.filter(a => a.incidentIds.map(getId).includes(finalInc)).sort((a,b) => a.name.localeCompare(b.name));
        finalAct = validActs[0]?._id || '';
      }
    }

    setSelectedApp(finalApp);
    setSelectedModule(finalMod);
    setSelectedIncident(finalInc);
    setSelectedAction(finalAct);
  };

  const handleAppChange = (appId: string) => {
    if (!appId) autoSelectChain('app', '', true);
    else autoSelectChain('app', appId, false);
  };

  const handleModuleClick = (moduleId: string) => {
    autoSelectChain('module', moduleId, selectedModule === moduleId);
  };

  const handleIncidentClick = (incidentId: string) => {
    autoSelectChain('incident', incidentId, selectedIncident === incidentId);
  };

  const handleActionClick = (actionId: string) => {
    autoSelectChain('action', actionId, selectedAction === actionId);
  };

  // ──────────────────── TAG LOGIC ────────────────────

  const toggleCategory = (catId: string) => {
    setActiveCategories(prev =>
      prev.includes(catId) ? prev.filter(c => c !== catId) : [...prev, catId]
    );
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev =>
      prev.includes(tagId) ? prev.filter(t => t !== tagId) : [...prev, tagId]
    );
  };

  const visibleTags = useMemo(() => {
    if (activeCategories.length === 0) return tags;
    return tags.filter(t => activeCategories.includes(getId(t.categoryId)));
  }, [tags, activeCategories]);

  // ──────────────────── OUTPUT GENERATION ────────────────────

  const shortDescription = useMemo(() => {
    const parts = [
      selectedApp ? applications.find(a => a._id === selectedApp)?.name : '',
      selectedModule ? allModules.find(m => m._id === selectedModule)?.name : '',
      'Local Support',
      selectedIncident ? allIncidents.find(i => i._id === selectedIncident)?.name : '',
      selectedAction ? allActions.find(a => a._id === selectedAction)?.name : '',
    ];
    return parts.filter(Boolean).join(':');
  }, [selectedApp, selectedModule, selectedIncident, selectedAction, applications, allModules, allIncidents, allActions]);

  const selectedTagNames = useMemo(() =>
    selectedTags.map(id => tags.find(t => t._id === id)?.name).filter(Boolean) as string[],
    [selectedTags, tags]
  );

  const resolutionNotes = useMemo(() =>
    `${selectedTagNames.join('\n')}${selectedTagNames.length > 0 ? '\n\n' : ''}- Motivo: ${motivo}\n- Análise: ${analise}`,
    [selectedTagNames, motivo, analise]
  );

  const handleCopy = (text: string, type: 'short' | 'resolution') => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [type]: true }));
    setTimeout(() => setCopiedStates(prev => ({ ...prev, [type]: false })), 2000);
  };

  const handleClearAll = () => {
    setSelectedApp('');
    setSelectedModule('');
    setSelectedIncident('');
    setSelectedAction('');
    setSelectedTags([]);
    setActiveCategories([]);
    setMotivo('');
    setAnalise('');
  };

  // ──────────────────── RENDER ────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Sparkles size={32} className="animate-pulse" style={{ color: 'var(--accent-primary)' }} />
          <span style={{ color: 'var(--text-muted)' }}>Carregando dados...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            Taxonomia de Chamados
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            Monte a short description e resolution notes
          </p>
        </div>
        <button onClick={handleClearAll} className="btn-ghost text-xs px-3 py-1">
          Limpar Tudo
        </button>
      </div>

      {error && (
        <div className="section-card mb-4 flex items-center gap-2 py-2"
          style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <AlertCircle size={16} style={{ color: '#ef4444' }} />
          <span style={{ color: '#ef4444' }} className="text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
        
        {/* LEFT LATERAL: Output Panels */}
        <div className="w-full lg:col-span-1 order-2 lg:order-1">
          <div className="sticky top-20 space-y-4">
            {/* Short Description */}
            <div className="output-panel">
              <div className="output-panel-header">
                <div className="flex items-center gap-2">
                  <FileText size={14} style={{ color: 'var(--accent-primary)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Short Description</span>
                </div>
                <button
                  onClick={() => handleCopy(shortDescription, 'short')}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200"
                  style={{
                    color: copiedStates.short ? 'var(--success-color)' : 'var(--accent-primary)',
                    background: copiedStates.short ? 'var(--success-bg)' : 'var(--accent-primary-bg)',
                  }}
                >
                  {copiedStates.short ? <Check size={12} /> : <Clipboard size={12} />}
                  {copiedStates.short ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <div className="p-5">
                <p
                  className="font-mono text-sm whitespace-pre-wrap break-words"
                  style={{ color: shortDescription ? 'var(--text-primary)' : 'var(--text-muted)', fontStyle: shortDescription ? 'normal' : 'italic' }}>
                  {shortDescription || "Aguardando seleções completas..."}
                </p>
              </div>
            </div>

            {/* Resolution Notes */}
            <div className="output-panel">
              <div className="output-panel-header">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} style={{ color: 'var(--accent-secondary)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Resolution Notes</span>
                </div>
                <button
                  onClick={() => handleCopy(resolutionNotes, 'resolution')}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200"
                  style={{
                    color: copiedStates.resolution ? '#22c55e' : 'var(--accent-secondary)',
                    background: copiedStates.resolution ? 'rgba(34, 197, 94, 0.1)' : 'rgba(139, 92, 246, 0.1)',
                  }}
                >
                  {copiedStates.resolution ? <Check size={12} /> : <Clipboard size={12} />}
                  {copiedStates.resolution ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
              <div className="p-5">
                <pre className="font-mono text-sm whitespace-pre-wrap break-words" style={{ color: 'var(--text-primary)' }}>
                  {resolutionNotes}
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT/CENTER: Form */}
        <div className="w-full lg:col-span-3 xl:col-span-4 flex flex-col gap-4 stagger-children order-1 lg:order-2">
          {/* TOP ROW: Contexto & Tags (Lado a Lado) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            
            {/* Contexto */}
            <div className="section-card flex flex-col">
              <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                <div className="p-1.5 rounded-lg" style={{ background: 'rgba(99, 102, 241, 0.1)' }}>
                  <LayoutTemplate size={16} style={{ color: 'var(--accent-primary)' }} />
                </div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  1. Contexto
                </h2>
              </div>

              <div className="space-y-4 flex-1 flex flex-col min-h-0">
                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Aplicação
                  </label>
                  <select
                    value={selectedApp}
                    onChange={(e) => handleAppChange(e.target.value)}
                    className="form-input w-full"
                  >
                    <option value="">Selecione uma aplicação...</option>
                    {applications.map(a => (
                      <option key={a._id} value={a._id}>{a.name}</option>
                    ))}
                  </select>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Módulo
                    {!selectedApp && <span style={{ color: 'var(--text-muted)' }} className="font-normal ml-1">(selecione a aplicação)</span>}
                  </label>
                  <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-[100px] pr-1 pb-1">
                    {filteredModules.length > 0 ? (
                      filteredModules.map(m => (
                        <button
                          key={m._id}
                          onClick={() => handleModuleClick(m._id)}
                          className={`chip text-xs px-2.5 py-1 ${selectedModule === m._id ? 'active' : ''}`}
                          style={
                            selectedModule !== m._id && highlightedModuleIds.has(m._id)
                              ? { borderColor: 'var(--accent-tertiary)', color: 'var(--accent-tertiary)' }
                              : {}
                          }
                        >
                          {m.name}
                        </button>
                      ))
                    ) : (
                      <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                        {selectedApp ? 'Nenhum módulo encontrado.' : 'Aguardando seleção...'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tags & Categorias */}
            <div className="section-card flex flex-col">
              <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                <div className="p-1.5 rounded-lg" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
                  <Tag size={16} style={{ color: 'var(--accent-tertiary)' }} />
                </div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  2. Classificação (Tags)
                </h2>
              </div>

              <div className="space-y-4 flex-1 flex flex-col min-h-0">
                <div className="flex flex-col min-h-0">
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Categorias
                  </label>
                  <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-[60px] pr-1 pb-1">
                    {tagCategories.map(cat => (
                      <button
                        key={cat._id}
                        onClick={() => toggleCategory(cat._id)}
                        className={`category-tab text-xs px-2 py-1 ${activeCategories.includes(cat._id) ? 'active' : ''}`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-0">
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Tags
                    {selectedTags.length > 0 && (
                      <span className="font-normal ml-1" style={{ color: 'var(--accent-secondary)' }}>
                        ({selectedTags.length})
                      </span>
                    )}
                  </label>
                  <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-[100px] pr-1 pb-1 min-h-[28px]">
                    {visibleTags.length > 0 ? (
                      visibleTags.map(tag => (
                        <button
                          key={tag._id}
                          onClick={() => toggleTag(tag._id)}
                          className={`tag-chip text-xs px-2 py-1 ${selectedTags.includes(tag._id) ? 'active' : ''}`}
                        >
                          {tag.name}
                        </button>
                      ))
                    ) : (
                      <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                        {activeCategories.length === 0 ? 'Filtre por categoria acima.' : 'Vazio.'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* MIDDLE: Incidents & Actions (Full Width) */}
          <div className="section-card flex flex-col">
            <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-primary)' }}>
              <div className="p-1.5 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                <Wrench size={16} style={{ color: 'var(--accent-secondary)' }} />
              </div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                3. Problema e Resolução (Selecione a ação e o incidente)
              </h2>
            </div>

            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              {/* Incidents */}
              <div className="flex-1 flex flex-col min-h-0">
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Incidente Relatado
                </label>
                <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-[160px] pr-1 pb-1">
                  {filteredIncidents.length > 0 ? (
                    filteredIncidents.map(i => (
                      <button
                        key={i._id}
                        onClick={() => handleIncidentClick(i._id)}
                        className={`chip text-xs px-2.5 py-1 ${selectedIncident === i._id ? 'active' : ''}`}
                        style={
                          selectedIncident !== i._id && highlightedIncidentIds.has(i._id)
                            ? { borderColor: 'var(--accent-tertiary)', color: 'var(--accent-tertiary)' }
                            : {}
                        }
                      >
                        {i.name}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Aguardando seleção...</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex-1 flex flex-col min-h-0">
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Ação Tomada
                </label>
                <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-[160px] pr-1 pb-1">
                  {filteredActions.length > 0 ? (
                    filteredActions.map(a => (
                      <button
                        key={a._id}
                        onClick={() => handleActionClick(a._id)}
                        className={`chip text-xs px-2.5 py-1 ${selectedAction === a._id ? 'active' : ''}`}
                      >
                        {a.name}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>Aguardando seleção...</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* BOTTOM: Motivo e Análise */}
          <div className="section-card">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Motivo</label>
                <textarea
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ex: Utilizador bloqueado no AD..."
                  className="form-input resize-none h-16 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Análise</label>
                <textarea
                  value={analise}
                  onChange={(e) => setAnalise(e.target.value)}
                  placeholder="Ex: Acedido ao AD, verificado bloqueio..."
                  className="form-input resize-none h-16 text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
