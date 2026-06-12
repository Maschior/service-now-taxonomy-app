import { useState, useEffect, useMemo, useCallback } from 'react';
import { Clipboard, Check, Tag, LayoutTemplate, AlertCircle, Wrench, FileText, Sparkles, Save, Search } from 'lucide-react';
import { applicationApi, moduleApi, incidentApi, actionApi, tagApi, closureApi, handleApiError } from '../services/api';
import { Application, Module, Incident, Action, Tag as TagType, TagCategory } from '../types/index';
import { useDebounce } from '../hooks/useDebounce';

const CACHE_KEY = 'taxonomy-form-state';

interface CachedState {
  selectedApp: string;
  selectedModule: string;
  selectedIncident: string;
  selectedAction: string;
  activeCategories: string[];
  selectedTags: string[];
  motivo: string;
  analise: string;
  solucao: string;
}

const loadCache = (): Partial<CachedState> => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
};

const saveCache = (state: CachedState) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(state));
  } catch { /* ignore quota errors */ }
};

const clearCache = () => {
  try { localStorage.removeItem(CACHE_KEY); } catch {}
};

/** Utility to extract ID from a potentially populated field */
const getId = (field: string | { _id: string }): string =>
  typeof field === 'object' && field !== null ? field._id : field;

export default function TaxonomyForm() {
  // Load cached state on first render
  const [cached] = useState(() => loadCache());

  // Search states
  const [appSearch, setAppSearch] = useState('');
  const debouncedAppSearch = useDebounce(appSearch, 300);

  const [moduleSearch, setModuleSearch] = useState('');
  const debouncedModuleSearch = useDebounce(moduleSearch, 300);

  const [incidentSearch, setIncidentSearch] = useState('');
  const debouncedIncidentSearch = useDebounce(incidentSearch, 300);

  const [actionSearch, setActionSearch] = useState('');
  const debouncedActionSearch = useDebounce(actionSearch, 300);

  // Selected IDs
  const [selectedApp, setSelectedApp] = useState(cached.selectedApp || '');
  const [selectedModule, setSelectedModule] = useState(cached.selectedModule || '');
  const [selectedIncident, setSelectedIncident] = useState(cached.selectedIncident || '');
  const [selectedAction, setSelectedAction] = useState(cached.selectedAction || '');

  // Tags
  const [activeCategories, setActiveCategories] = useState<string[]>(cached.activeCategories || []);
  const [selectedTags, setSelectedTags] = useState<string[]>(cached.selectedTags || []);

  // Text fields
  const [motivo, setMotivo] = useState(cached.motivo || '');
  const [analise, setAnalise] = useState(cached.analise || '');
  const [solucao, setSolucao] = useState(cached.solucao || '');

  // Copy states
  const [copiedStates, setCopiedStates] = useState({ short: false, resolution: false });

  // Closure registration feedback
  const [savingClosure, setSavingClosure] = useState(false);
  const [closureSaved, setClosureSaved] = useState(false);

  // ──────────────────── CACHE SYNC ────────────────────

  useEffect(() => {
    saveCache({
      selectedApp, selectedModule, selectedIncident, selectedAction,
      activeCategories, selectedTags,
      motivo, analise, solucao
    });
  }, [selectedApp, selectedModule, selectedIncident, selectedAction, activeCategories, selectedTags, motivo, analise, solucao]);

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

  /** Unique module names from filteredModules (Group By name for display) */
  const uniqueFilteredModuleNames = useMemo(() => {
    const seen = new Set<string>();
    return filteredModules
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter(m => {
        if (seen.has(m.name)) return false;
        seen.add(m.name);
        return true;
      })
      .map(m => m.name);
  }, [filteredModules]);

  /** The name of the currently selected module (derived from selectedModule ID) */
  const selectedModuleName = useMemo(() => {
    if (!selectedModule) return '';
    return allModules.find(m => m._id === selectedModule)?.name || '';
  }, [selectedModule, allModules]);

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

  // ──────────────────── SEARCH FILTERING ────────────────────
  const searchedApplications = useMemo(() => {
    if (!debouncedAppSearch.trim()) return applications;
    const lower = debouncedAppSearch.toLowerCase();
    return applications.filter(a => a.name.toLowerCase().includes(lower));
  }, [applications, debouncedAppSearch]);

  const searchedModuleNames = useMemo(() => {
    if (!debouncedModuleSearch.trim()) return uniqueFilteredModuleNames;
    const lower = debouncedModuleSearch.toLowerCase();
    return uniqueFilteredModuleNames.filter(name => name.toLowerCase().includes(lower));
  }, [uniqueFilteredModuleNames, debouncedModuleSearch]);

  const searchedIncidents = useMemo(() => {
    if (!debouncedIncidentSearch.trim()) return filteredIncidents;
    const lower = debouncedIncidentSearch.toLowerCase();
    return filteredIncidents.filter(i => i.name.toLowerCase().includes(lower));
  }, [filteredIncidents, debouncedIncidentSearch]);

  const searchedActions = useMemo(() => {
    if (!debouncedActionSearch.trim()) return filteredActions;
    const lower = debouncedActionSearch.toLowerCase();
    return filteredActions.filter(a => a.name.toLowerCase().includes(lower));
  }, [filteredActions, debouncedActionSearch]);

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

  /** Highlighted module names (derived from highlightedModuleIds for grouped display) */
  const highlightedModuleNames = useMemo(() => {
    if (highlightedModuleIds.size === 0) return new Set<string>();
    return new Set(
      allModules.filter(m => highlightedModuleIds.has(m._id)).map(m => m.name)
    );
  }, [highlightedModuleIds, allModules]);

  /** When a module name is selected, highlight which apps own a module with that name */
  const highlightedAppIds = useMemo(() => {
    if (!selectedModuleName) return new Set<string>();
    return new Set(
      allModules
        .filter(m => m.name === selectedModuleName)
        .map(m => getId(m.applicationId))
    );
  }, [selectedModuleName, allModules]);

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

  const handleAppClick = (appId: string) => {
    if (selectedApp === appId) {
      // Unselect app
      autoSelectChain('app', appId, true);
      return;
    }
    // If a module name was selected, re-resolve the module ID for the new app
    if (selectedModuleName) {
      const resolvedMod = allModules.find(
        m => m.name === selectedModuleName && getId(m.applicationId) === appId
      );
      if (resolvedMod) {
        // Set app first, then resolve module under that app
        setSelectedApp(appId);
        autoSelectChain('module', resolvedMod._id, false);
        return;
      }
    }
    autoSelectChain('app', appId, false);
  };

  /** Handle click on a grouped module name chip */
  const handleModuleNameClick = (moduleName: string) => {
    // If clicking the already-selected module name, unselect it
    if (selectedModuleName === moduleName) {
      autoSelectChain('module', '', true);
      return;
    }

    if (selectedApp) {
      // App is selected: resolve to the specific module for this app
      const mod = allModules.find(
        m => m.name === moduleName && getId(m.applicationId) === selectedApp
      );
      if (mod) {
        autoSelectChain('module', mod._id, false);
      }
    } else {
      // No app selected: find all apps that own this module name, pick the first
      const matchingModules = allModules
        .filter(m => m.name === moduleName)
        .sort((a, b) => a.name.localeCompare(b.name));
      if (matchingModules.length > 0) {
        autoSelectChain('module', matchingModules[0]._id, false);
      }
    }
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
    `${selectedTagNames.join('\n')}${selectedTagNames.length > 0 ? '\n\n' : ''}- Motivo: ${motivo}\n- Análise: ${analise}\n- Solução: ${solucao}`,
    [selectedTagNames, motivo, analise, solucao]
  );

  const handleCopy = (text: string, type: 'short' | 'resolution') => {
    navigator.clipboard.writeText(text);
    setCopiedStates(prev => ({ ...prev, [type]: true }));
    setTimeout(() => setCopiedStates(prev => ({ ...prev, [type]: false })), 2000);
  };

  const handleClearAll = () => {
    if (!window.confirm('Tem certeza que deseja limpar todos os campos?')) return;
    setSelectedApp('');
    setSelectedModule('');
    setSelectedIncident('');
    setSelectedAction('');
    setSelectedTags([]);
    setActiveCategories([]);
    setMotivo('');
    setAnalise('');
    setSolucao('');
    clearCache();
  };

  const isFormIncomplete = useMemo(() => {
    return (
      !selectedApp ||
      !selectedModule ||
      !selectedIncident ||
      !selectedAction ||
      !motivo.trim() ||
      !analise.trim() ||
      !solucao.trim()
    );
  }, [selectedApp, selectedModule, selectedIncident, selectedAction, motivo, analise, solucao]);

  const handleRegisterClosure = useCallback(async () => {
    if (isFormIncomplete) {
      setError('Por favor, preencha todos os campos antes de registrar o fechamento.');
      return;
    }
    try {
      setSavingClosure(true);
      await closureApi.create({
        shortDescription,
        resolutionNotes,
        applicationId: selectedApp || undefined,
        moduleId: selectedModule || undefined,
        incidentId: selectedIncident || undefined,
        actionId: selectedAction || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        motivo: motivo || undefined,
        analise: analise || undefined,
        solucao: solucao || undefined,
      });
      setClosureSaved(true);
      setTimeout(() => setClosureSaved(false), 3000);
      setError(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSavingClosure(false);
    }
  }, [shortDescription, resolutionNotes, selectedApp, selectedModule, selectedIncident, selectedAction, selectedTags, motivo, analise, solucao, isFormIncomplete]);

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
        <div className="flex items-center gap-2">
          <button
            onClick={handleRegisterClosure}
            disabled={savingClosure || isFormIncomplete}
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200"
            style={{
              color: closureSaved ? 'var(--success-color)' : 'var(--accent-primary)',
              background: closureSaved ? 'var(--success-bg)' : 'var(--accent-primary-bg)',
              opacity: (savingClosure || isFormIncomplete) && !closureSaved ? 0.4 : 1,
              cursor: savingClosure ? 'wait' : isFormIncomplete ? 'not-allowed' : 'pointer',
            }}
          >
            {closureSaved ? <Check size={14} /> : <Save size={14} />}
            {closureSaved ? 'Registrado!' : savingClosure ? 'Salvando...' : 'Registrar Fechamento'}
          </button>
          <button onClick={handleClearAll} className="btn-ghost text-xs px-3 py-1">
            Limpar Tudo
          </button>
        </div>
      </div>

      {error && (
        <div className="section-card mb-4 flex items-center gap-2 py-2"
          style={{ borderColor: 'rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.05)' }}>
          <AlertCircle size={16} style={{ color: '#ef4444' }} />
          <span style={{ color: '#ef4444' }} className="text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
        
        {/* LEFT LATERAL: Output Panels + Tags */}
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

            {/* Tags & Categorias (moved here from main column) */}
            <div className="section-card flex flex-col">
              <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-primary)' }}>
                <div className="p-1.5 rounded-lg" style={{ background: 'rgba(6, 182, 212, 0.1)' }}>
                  <Tag size={16} style={{ color: 'var(--accent-tertiary)' }} />
                </div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Classificação (Tags)
                </h2>
              </div>

              <div className="space-y-4 flex-1 flex flex-col min-h-0">
                <div className="flex flex-col min-h-0">
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Categorias
                  </label>
                  <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-[60px] p-1">
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
                  <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-[120px] p-1 min-h-[28px]">
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
        </div>

        {/* RIGHT/CENTER: Form */}
        <div className="w-full lg:col-span-3 xl:col-span-4 flex flex-col gap-4 stagger-children order-1 lg:order-2">
          
          {/* Contexto (Application chips + Module chips) - Full Width */}
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
              {/* Application Chips */}
              <div>
                <label className="flex items-center justify-between text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  <span>Aplicação</span>
                  <div className="relative">
                    <Search size={12} className="absolute left-1.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Pesquisar..."
                      value={appSearch}
                      onChange={e => setAppSearch(e.target.value)}
                      className="pl-5 pr-2 py-0.5 text-xs rounded border bg-transparent focus:outline-none"
                      style={{ width: '120px', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </label>
                <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-[100px] p-1">
                  {searchedApplications.length > 0 ? (
                    searchedApplications.map(a => (
                      <button
                        key={a._id}
                        onClick={() => handleAppClick(a._id)}
                        className={`chip text-xs px-2.5 py-1 ${selectedApp === a._id ? 'active' : ''}`}
                        style={
                          selectedApp !== a._id && highlightedAppIds.has(a._id)
                            ? { borderColor: 'var(--accent-tertiary)', color: 'var(--accent-tertiary)' }
                            : {}
                        }
                      >
                        {a.name}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs italic" style={{ color: 'var(--text-muted)' }}>
                      Nenhuma aplicação encontrada.
                    </span>
                  )}
                </div>
              </div>

              {/* Module Chips (Grouped by Name) */}
              <div className="flex-1 flex flex-col min-h-0">
                <label className="flex items-center justify-between text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  <span>
                    Módulo
                    {!selectedApp && <span style={{ color: 'var(--text-muted)' }} className="font-normal ml-1">(selecione a aplicação)</span>}
                  </span>
                  <div className="relative">
                    <Search size={12} className="absolute left-1.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Pesquisar..."
                      value={moduleSearch}
                      onChange={e => setModuleSearch(e.target.value)}
                      className="pl-5 pr-2 py-0.5 text-xs rounded border bg-transparent focus:outline-none"
                      style={{ width: '120px', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </label>
                <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-[100px] p-1">
                  {searchedModuleNames.length > 0 ? (
                    searchedModuleNames.map(name => (
                      <button
                        key={name}
                        onClick={() => handleModuleNameClick(name)}
                        className={`chip text-xs px-2.5 py-1 ${selectedModuleName === name ? 'active' : ''}`}
                        style={
                          selectedModuleName !== name && highlightedModuleNames.has(name)
                            ? { borderColor: 'var(--accent-tertiary)', color: 'var(--accent-tertiary)' }
                            : {}
                        }
                      >
                        {name}
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

          {/* MIDDLE: Incidents & Actions (Full Width) */}
          <div className="section-card flex flex-col">
            <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid var(--border-primary)' }}>
              <div className="p-1.5 rounded-lg" style={{ background: 'rgba(139, 92, 246, 0.1)' }}>
                <Wrench size={16} style={{ color: 'var(--accent-secondary)' }} />
              </div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                2. Problema e Resolução (Selecione a ação e o incidente)
              </h2>
            </div>

            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              {/* Incidents */}
              <div className="flex-1 flex flex-col min-h-0">
                <label className="flex items-center justify-between text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  <span>Incidente Relatado</span>
                  <div className="relative">
                    <Search size={12} className="absolute left-1.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Pesquisar..."
                      value={incidentSearch}
                      onChange={e => setIncidentSearch(e.target.value)}
                      className="pl-5 pr-2 py-0.5 text-xs rounded border bg-transparent focus:outline-none"
                      style={{ width: '120px', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </label>
                <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-[160px] p-1">
                  {searchedIncidents.length > 0 ? (
                    searchedIncidents.map(i => (
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
                <label className="flex items-center justify-between text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                  <span>Ação Tomada</span>
                  <div className="relative">
                    <Search size={12} className="absolute left-1.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      placeholder="Pesquisar..."
                      value={actionSearch}
                      onChange={e => setActionSearch(e.target.value)}
                      className="pl-5 pr-2 py-0.5 text-xs rounded border bg-transparent focus:outline-none"
                      style={{ width: '120px', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </label>
                <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-[160px] p-1">
                  {searchedActions.length > 0 ? (
                    searchedActions.map(a => (
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

          {/* BOTTOM: Motivo, Análise & Solução */}
          <div className="section-card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Solução</label>
                <textarea
                  value={solucao}
                  onChange={(e) => setSolucao(e.target.value)}
                  placeholder="Ex: Desbloqueado a conta no AD..."
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
