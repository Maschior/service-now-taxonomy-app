import { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Clipboard, Check, Tag, LayoutTemplate, AlertCircle, Wrench, Sparkles, Save, Search, Undo2, Sun, Moon, Keyboard } from 'lucide-react';
import { closureApi, handleApiError } from '../services/api';
import { useDebounce } from '../hooks/useDebounce';
import { useDarkMode } from '../hooks/useDarkMode';
import { useTaxonomyData } from '../hooks/useTaxonomyData';
import { useTaxonomyStore } from '../store/useTaxonomyStore';


/** Utility to extract ID from a potentially populated field */
const getId = (field: string | { _id: string }): string =>
  typeof field === 'object' && field !== null ? field._id : field;

export default function TaxonomyForm() {

  const { theme, toggleTheme } = useDarkMode();

  const [previousState, setPreviousState] = useState<any>(null);
  const [isConfirmClearModalOpen, setIsConfirmClearModalOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);

  // Search states
  const [appSearch, setAppSearch] = useState('');
  const debouncedAppSearch = useDebounce(appSearch, 300);

  const [moduleSearch, setModuleSearch] = useState('');
  const debouncedModuleSearch = useDebounce(moduleSearch, 300);

  const [incidentSearch, setIncidentSearch] = useState('');
  const debouncedIncidentSearch = useDebounce(incidentSearch, 300);

  const [actionSearch, setActionSearch] = useState('');
  const debouncedActionSearch = useDebounce(actionSearch, 300);

  // Tab State
  const { tabs, activeTabId, updateActiveTab, markActiveTabAsSaved, removeTab, addTab, setActiveTab } = useTaxonomyStore();
  const activeTab = useMemo(() => tabs.find(t => t.id === activeTabId), [tabs, activeTabId]);
  const formData = activeTab?.data || {
    selectedApp: '', selectedModule: '', selectedIncident: '', selectedAction: '',
    activeCategories: [], selectedTags: [], motivo: '', analise: '', solucao: ''
  };

  const {
    selectedApp, selectedModule, selectedIncident, selectedAction,
    activeCategories, selectedTags, motivo, analise, solucao
  } = formData;

  // Copy states
  const [copiedStates, setCopiedStates] = useState({ short: false, resolution: false });

  // Closure registration feedback
  const [savingClosure, setSavingClosure] = useState(false);
  const [closureSaved, setClosureSaved] = useState(false);

  // Data from API
  const { applications, allModules, allIncidents, allActions, tags, tagCategories, loading, error, setError } = useTaxonomyData();

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
      if (startLevel === 'action') updateActiveTab({ selectedAction: '' });
      if (startLevel === 'incident') updateActiveTab({ selectedIncident: '', selectedAction: '' });
      if (startLevel === 'module') updateActiveTab({ selectedModule: '', selectedIncident: '', selectedAction: '' });
      if (startLevel === 'app') updateActiveTab({ selectedApp: '', selectedModule: '', selectedIncident: '', selectedAction: '' });
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

    updateActiveTab({
      selectedApp: finalApp,
      selectedModule: finalMod,
      selectedIncident: finalInc,
      selectedAction: finalAct,
    });
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
        updateActiveTab({ selectedApp: appId });
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
    updateActiveTab(prev => ({
      activeCategories: prev.activeCategories.includes(catId) 
        ? prev.activeCategories.filter(c => c !== catId) 
        : [...prev.activeCategories, catId]
    }));
  };

  const toggleTag = (tagId: string) => {
    updateActiveTab(prev => ({
      selectedTags: prev.selectedTags.includes(tagId) 
        ? prev.selectedTags.filter(t => t !== tagId) 
        : [...prev.selectedTags, tagId]
    }));
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
    if (!text) return;

    const fallbackCopy = (val: string) => {
      const textArea = document.createElement("textarea");
      textArea.value = val;
      // Prevent scrolling and keep it invisible
      textArea.style.position = "fixed";
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.width = "2em";
      textArea.style.height = "2em";
      textArea.style.padding = "0";
      textArea.style.border = "none";
      textArea.style.outline = "none";
      textArea.style.boxShadow = "none";
      textArea.style.background = "transparent";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        const successful = document.execCommand('copy');
        if (successful) {
          setCopiedStates(prev => ({ ...prev, [type]: true }));
          setTimeout(() => setCopiedStates(prev => ({ ...prev, [type]: false })), 2000);
        } else {
          console.error('Fallback: Copy command was unsuccessful');
        }
      } catch (err) {
        console.error('Fallback: Oops, unable to copy', err);
      }
      document.body.removeChild(textArea);
    };

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopiedStates(prev => ({ ...prev, [type]: true }));
          setTimeout(() => setCopiedStates(prev => ({ ...prev, [type]: false })), 2000);
        })
        .catch(err => {
          console.warn('Clipboard API failed, trying fallback', err);
          fallbackCopy(text);
        });
    } else {
      fallbackCopy(text);
    }
  };

  const handleClearAll = () => {
    setIsConfirmClearModalOpen(true);
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
      markActiveTabAsSaved();
      
      const currentTabId = activeTabId;
      setTimeout(() => {
        setClosureSaved(false);
        if (currentTabId) {
          removeTab(currentTabId);
        }
      }, 1500); // 1.5s to see the success state
      
      setError(null);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setSavingClosure(false);
    }
  }, [shortDescription, resolutionNotes, selectedApp, selectedModule, selectedIncident, selectedAction, selectedTags, motivo, analise, solucao, isFormIncomplete, markActiveTabAsSaved, activeTabId, removeTab]);

  const executeClearAll = async (withSave: boolean) => {
    if (withSave) {
      if (isFormIncomplete) return;
      await handleRegisterClosure();
    }
    
    setPreviousState({
      selectedApp, selectedModule, selectedIncident, selectedAction,
      activeCategories, selectedTags,
      motivo, analise, solucao
    });
    
    updateActiveTab({
      selectedApp: '', selectedModule: '', selectedIncident: '', selectedAction: '',
      selectedTags: [], activeCategories: [], motivo: '', analise: '', solucao: ''
    });
    
    setIsConfirmClearModalOpen(false);
  };

  const handleUndo = () => {
    if (!previousState) return;
    updateActiveTab(previousState);
    setPreviousState(null);
  };

  // ──────────────────── KEYBOARD SHORTCUTS ────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S / Cmd+S: Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (!isFormIncomplete && !savingClosure) {
          handleRegisterClosure();
        }
      }
      
      // Alt+T: New Tab
      if (e.altKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        addTab();
      }

      // Alt+W: Close Tab
      if (e.altKey && e.key.toLowerCase() === 'w') {
        e.preventDefault();
        if (activeTabId) {
          const tab = tabs.find(t => t.id === activeTabId);
          if (tab) {
             const isEmpty = !tab.data.selectedApp && !tab.data.motivo.trim() && !tab.data.analise.trim() && !tab.data.solucao.trim();
             if (!isEmpty && !tab.isSaved) {
               if (!window.confirm("Essa aba tem dados não salvos. Deseja realmente fechá-la?")) return;
             }
             removeTab(activeTabId);
          }
        }
      }
      
      // Alt + 1-9: Navigate to tab
      if (e.altKey && !isNaN(parseInt(e.key)) && parseInt(e.key) > 0 && parseInt(e.key) <= 9) {
        e.preventDefault();
        const index = parseInt(e.key) - 1;
        if (tabs[index]) {
          setActiveTab(tabs[index].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, activeTabId, isFormIncomplete, savingClosure, handleRegisterClosure, addTab, removeTab, setActiveTab]);

  // ──────────────────── RENDER ────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <Sparkles size={32} className="animate-pulse" style={{ color: 'var(--brand)' }} />
          <span style={{ color: 'var(--ink-400)' }}>Carregando dados...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in-up">
      {/* Modal de Atalhos */}
      {isShortcutsModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="p-6 rounded-2xl w-full max-w-md animate-fade-in-up border shadow-2xl"
               style={{ background: 'var(--bg-page)', borderColor: 'var(--border-strong)' }}>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Keyboard size={20} className="text-[var(--brand)]" />
              Atalhos de Teclado
            </h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: 'var(--ink-500)' }}>Salvar Fechamento</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-sunken rounded-md text-xs font-mono font-bold shadow-sm" style={{ color: 'var(--ink-900)', border: '1px solid var(--border-strong)' }}>Ctrl</kbd>
                  <span className="text-[var(--ink-400)] font-bold px-1 flex items-center">+</span>
                  <kbd className="px-2 py-1 bg-sunken rounded-md text-xs font-mono font-bold shadow-sm" style={{ color: 'var(--ink-900)', border: '1px solid var(--border-strong)' }}>S</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: 'var(--ink-500)' }}>Nova Aba</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-sunken rounded-md text-xs font-mono font-bold shadow-sm" style={{ color: 'var(--ink-900)', border: '1px solid var(--border-strong)' }}>Alt</kbd>
                  <span className="text-[var(--ink-400)] font-bold px-1 flex items-center">+</span>
                  <kbd className="px-2 py-1 bg-sunken rounded-md text-xs font-mono font-bold shadow-sm" style={{ color: 'var(--ink-900)', border: '1px solid var(--border-strong)' }}>T</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: 'var(--ink-500)' }}>Fechar Aba Atual</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-sunken rounded-md text-xs font-mono font-bold shadow-sm" style={{ color: 'var(--ink-900)', border: '1px solid var(--border-strong)' }}>Alt</kbd>
                  <span className="text-[var(--ink-400)] font-bold px-1 flex items-center">+</span>
                  <kbd className="px-2 py-1 bg-sunken rounded-md text-xs font-mono font-bold shadow-sm" style={{ color: 'var(--ink-900)', border: '1px solid var(--border-strong)' }}>W</kbd>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium" style={{ color: 'var(--ink-500)' }}>Mudar de Aba</span>
                <div className="flex gap-1">
                  <kbd className="px-2 py-1 bg-sunken rounded-md text-xs font-mono font-bold shadow-sm" style={{ color: 'var(--ink-900)', border: '1px solid var(--border-strong)' }}>Alt</kbd>
                  <span className="text-[var(--ink-400)] font-bold px-1 flex items-center">+</span>
                  <kbd className="px-2 py-1 bg-sunken rounded-md text-xs font-mono font-bold shadow-sm" style={{ color: 'var(--ink-900)', border: '1px solid var(--border-strong)' }}>1-9</kbd>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <button 
                onClick={() => setIsShortcutsModalOpen(false)}
                className="btn-primary text-sm px-4 py-2 justify-center"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Confirmação de Limpeza */}
      {isConfirmClearModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="p-6 rounded-2xl w-full max-w-md animate-fade-in-up border shadow-2xl"
               style={{ background: 'var(--bg-page)', borderColor: 'var(--border-strong)' }}>
            <h3 className="text-lg font-bold mb-2">Atenção</h3>
            <p className="text-sm mb-6" style={{ color: 'var(--ink-500)' }}>
              Deseja registrar o fechamento antes de limpar os campos?
            </p>
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button 
                onClick={() => setIsConfirmClearModalOpen(false)}
                className="btn-ghost text-sm px-4 py-2"
              >
                Cancelar
              </button>
              <button 
                onClick={() => executeClearAll(false)}
                className="btn-ghost text-sm px-4 py-2 text-danger-fg hover:bg-danger-bg hover:text-danger-fg hover:border-danger-fg"
              >
                Apenas Limpar
              </button>
              <button 
                onClick={() => executeClearAll(true)}
                disabled={isFormIncomplete || savingClosure}
                className="btn-primary text-sm px-4 py-2"
                style={{ opacity: (isFormIncomplete || savingClosure) ? 0.5 : 1, cursor: (isFormIncomplete || savingClosure) ? 'not-allowed' : 'pointer' }}
              >
                {savingClosure ? 'Salvando...' : 'Registrar e Limpar'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6 mb-5">
       

        {/* Short Description (Middle) + Action Buttons (Right) */}
        <div className="flex-1 flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Short Description Bar */}
          <div className="flex-1 flex items-center gap-3 px-3.5 py-2 rounded-xl" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', minWidth: 0 }}>
            <span className="text-xs font-semibold whitespace-nowrap" style={{ color: 'var(--ink-400)' }}>
              Short Description:
            </span>
            <span className="font-mono text-xs font-semibold truncate flex-1" style={{ color: shortDescription ? 'var(--ink-900)' : 'var(--ink-400)' }}>
              {shortDescription || "Aguardando seleções..."}
            </span>
            <button
              onClick={() => handleCopy(shortDescription, 'short')}
              disabled={!shortDescription}
              className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg transition-all duration-200"
              style={{
                color: !shortDescription ? 'var(--ink-400)' : copiedStates.short ? 'var(--success-fg)' : 'var(--brand)',
                background: !shortDescription ? 'transparent' : copiedStates.short ? 'var(--success-bg)' : 'var(--brand-tint)',
                opacity: !shortDescription ? 0.5 : 1,
                cursor: !shortDescription ? 'not-allowed' : 'pointer'
              }}
            >
              {copiedStates.short ? <Check size={12} /> : <Clipboard size={12} />}
              <span>{copiedStates.short ? 'Copiado!' : 'Copiar'}</span>
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleRegisterClosure}
              disabled={savingClosure || isFormIncomplete}
              className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg transition-all duration-200"
              style={{
                color: closureSaved ? 'var(--success-fg)' : 'var(--brand)',
                background: closureSaved ? 'var(--success-bg)' : 'var(--brand-tint)',
                opacity: (savingClosure || isFormIncomplete) && !closureSaved ? 0.4 : 1,
                cursor: savingClosure ? 'wait' : isFormIncomplete ? 'not-allowed' : 'pointer',
              }}
            >
              {closureSaved ? <Check size={14} /> : <Save size={14} />}
              <span>{closureSaved ? 'Salvo!' : savingClosure ? 'Salvando...' : 'Salvar'}</span>
            </button>
            {previousState && (
              <button onClick={handleUndo} className="flex items-center justify-center btn-ghost text-xs px-2 py-2" title="Desfazer Limpeza">
                <Undo2 size={14} />
              </button>
            )}
            <button onClick={handleClearAll} className="btn-ghost text-xs px-3.5 py-2">
              Limpar Tudo
            </button>
            <div className="w-px h-5 mx-1" style={{ background: 'var(--border)' }} />
            <button
              onClick={() => setIsShortcutsModalOpen(true)}
              className="flex items-center justify-center btn-ghost text-xs px-2 py-2"
              title="Atalhos do Teclado"
            >
              <Keyboard size={16} />
            </button>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center btn-ghost text-xs px-2 py-2"
              title="Alterar Tema"
            >
              <div className="relative min-w-[14px] w-3.5 h-3.5 flex items-center justify-center">
                <span className="absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out"
                  style={{ transform: theme === 'dark' ? 'rotate(90deg) scale(0)' : 'rotate(0) scale(1)', opacity: theme === 'dark' ? 0 : 1 }}>
                  <Sun size={14} />
                </span>
                <span className="absolute inset-0 flex items-center justify-center transition-all duration-500 ease-out"
                  style={{ transform: theme === 'dark' ? 'rotate(0) scale(1)' : 'rotate(-90deg) scale(0)', opacity: theme === 'dark' ? 1 : 0 }}>
                  <Moon size={14} />
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="section-card mb-4 flex items-center gap-2 py-2"
          style={{ borderColor: 'var(--danger-border)', background: 'var(--danger-bg)' }}>
          <AlertCircle size={16} style={{ color: 'var(--danger-fg)' }} />
          <span style={{ color: 'var(--danger-fg)' }} className="text-sm">{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
        
        {/* LEFT COLUMN: Output Panels (Resolution Notes) + Tags */}
        <div className="w-full lg:col-span-1 order-2 lg:order-1">
          <div className="sticky top-20 space-y-4">
            
            {/* Resolution Notes */}
            <div className="output-panel">
              <div className="output-panel-header">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} style={{ color: 'var(--brand)' }} />
                  <span className="text-xs font-semibold" style={{ color: 'var(--ink-400)' }}>Resolution Notes</span>
                </div>
                <button
                  onClick={() => handleCopy(resolutionNotes, 'resolution')}
                  className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-all duration-200"
                  style={{
                    color: copiedStates.resolution ? 'var(--success-fg)' : 'var(--brand)',
                    background: copiedStates.resolution ? 'var(--success-bg)' : 'var(--brand-tint)',
                  }}
                >
                  {copiedStates.resolution ? <Check size={12} /> : <Clipboard size={12} />}
                  <span>{copiedStates.resolution ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
              <div className="p-5">
                <pre className="font-mono text-sm whitespace-pre-wrap break-words" style={{ color: 'var(--ink-900)' }}>
                  {resolutionNotes}
                </pre>
              </div>
            </div>

            {/* Tags & Categorias */}
            <div className="section-card flex flex-col">
              <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
                <div className="p-1.5 rounded-lg" style={{ background: 'var(--brand-tint)' }}>
                  <Tag size={16} style={{ color: 'var(--brand)' }} />
                </div>
                <h2 className="text-sm font-semibold" style={{ color: 'var(--ink-900)' }}>
                  Classificação (Tags)
                </h2>
              </div>

              <div className="space-y-4 flex-1 flex flex-col min-h-0">
                <div className="flex flex-col min-h-0">
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink-500)' }}>
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
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink-500)' }}>
                    Tags {selectedTags.length > 0 && <span style={{ color: 'var(--brand)' }}>({selectedTags.length})</span>}
                  </label>
                  <div className="flex flex-wrap gap-1.5 overflow-y-auto max-h-[400px] p-1 min-h-[28px]">
                    {visibleTags.length > 0 ? (
                      visibleTags.map(tag => (
                        <button
                          key={tag._id}
                          onClick={() => toggleTag(tag._id)}
                          className={`tag-chip text-xs px-2.5 py-1 ${selectedTags.includes(tag._id) ? 'active' : ''}`}
                        >
                          {tag.name}
                        </button>
                      ))
                    ) : (
                      <span className="text-xs italic" style={{ color: 'var(--ink-400)' }}>
                        {activeCategories.length === 0 ? 'Filtre por categoria acima.' : 'Vazio.'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Form elements */}
        <div className="w-full lg:col-span-3 xl:col-span-4 flex flex-col gap-4 stagger-children order-1 lg:order-2">
          
          {/* Motivo, Análise & Solução (moved to the top of the right column) */}
          <div className="section-card">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink-500)' }}>Motivo</label>
                <textarea
                  value={motivo}
                  onChange={(e) => updateActiveTab({ motivo: e.target.value })}
                  placeholder="Ex: Utilizador bloqueado no AD..."
                  className="form-input resize-none h-16 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink-500)' }}>Análise</label>
                <textarea
                  value={analise}
                  onChange={(e) => updateActiveTab({ analise: e.target.value })}
                  placeholder="Ex: Acedido ao AD, verificado bloqueio..."
                  className="form-input resize-none h-16 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1" style={{ color: 'var(--ink-500)' }}>Solução</label>
                <textarea
                  value={solucao}
                  onChange={(e) => updateActiveTab({ solucao: e.target.value })}
                  placeholder="Ex: Desbloqueado a conta no AD..."
                  className="form-input resize-none h-16 text-sm"
                />
              </div>
            </div>
          </div>
          
          {/* Contexto (Application chips + Module chips) */}
          <div className="section-card flex flex-col">
            <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="p-1.5 rounded-lg" style={{ background: 'var(--brand-tint)' }}>
                <LayoutTemplate size={16} style={{ color: 'var(--brand)' }} />
              </div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--ink-900)' }}>
                1. Contexto
              </h2>
            </div>

            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              {/* Application Chips */}
              <div>
                <label className="flex items-center gap-3 text-xs font-medium mb-1" style={{ color: 'var(--ink-500)' }}>
                  <span>Aplicação</span>
                  <div className="relative">
                    <Search size={12} className="absolute left-1.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-400)' }} />
                    <input
                      type="text"
                      placeholder="Pesquisar..."
                      value={appSearch}
                      onChange={e => setAppSearch(e.target.value)}
                      className="pl-5 pr-2 py-0.5 text-xs rounded border bg-transparent focus:outline-none"
                      style={{ width: '120px', borderColor: 'var(--border)', color: 'var(--ink-900)' }}
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
                            ? { borderColor: 'var(--brand)', color: 'var(--brand)' }
                            : {}
                        }
                      >
                        {a.name}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs italic" style={{ color: 'var(--ink-400)' }}>
                      Nenhuma aplicação encontrada.
                    </span>
                  )}
                </div>
              </div>

              {/* Module Chips (Grouped by Name) */}
              <div className="flex-1 flex flex-col min-h-0">
                <label className="flex items-center gap-3 text-xs font-medium mb-1" style={{ color: 'var(--ink-500)' }}>
                  <span>
                    Módulo
                    {!selectedApp && <span style={{ color: 'var(--ink-400)' }} className="font-normal ml-1">(selecione a aplicação)</span>}
                  </span>
                  <div className="relative">
                    <Search size={12} className="absolute left-1.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-400)' }} />
                    <input
                      type="text"
                      placeholder="Pesquisar..."
                      value={moduleSearch}
                      onChange={e => setModuleSearch(e.target.value)}
                      className="pl-5 pr-2 py-0.5 text-xs rounded border bg-transparent focus:outline-none"
                      style={{ width: '120px', borderColor: 'var(--border)', color: 'var(--ink-900)' }}
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
                            ? { borderColor: 'var(--brand)', color: 'var(--brand)' }
                            : {}
                        }
                      >
                        {name}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs italic" style={{ color: 'var(--ink-400)' }}>
                      {selectedApp ? 'Nenhum módulo encontrado.' : 'Aguardando seleção...'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* MIDDLE: Incidents & Actions (Full Width) */}
          <div className="section-card flex flex-col">
            <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="p-1.5 rounded-lg" style={{ background: 'var(--brand-tint)' }}>
                <Wrench size={16} style={{ color: 'var(--brand)' }} />
              </div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--ink-900)' }}>
                2. Problema e Resolução (Selecione a ação e o incidente)
              </h2>
            </div>

            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              {/* Incidents */}
              <div className="flex-1 flex flex-col min-h-0">
                <label className="flex items-center gap-3 text-xs font-medium mb-1" style={{ color: 'var(--ink-500)' }}>
                  <span>Incidente Relatado</span>
                  <div className="relative">
                    <Search size={12} className="absolute left-1.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-400)' }} />
                    <input
                      type="text"
                      placeholder="Pesquisar..."
                      value={incidentSearch}
                      onChange={e => setIncidentSearch(e.target.value)}
                      className="pl-5 pr-2 py-0.5 text-xs rounded border bg-transparent focus:outline-none"
                      style={{ width: '120px', borderColor: 'var(--border)', color: 'var(--ink-900)' }}
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
                            ? { borderColor: 'var(--brand)', color: 'var(--brand)' }
                            : {}
                        }
                      >
                        {i.name}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs italic" style={{ color: 'var(--ink-400)' }}>Aguardando seleção...</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex-1 flex flex-col min-h-0">
                <label className="flex items-center gap-3 text-xs font-medium mb-1" style={{ color: 'var(--ink-500)' }}>
                  <span>Ação Tomada</span>
                  <div className="relative">
                    <Search size={12} className="absolute left-1.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--ink-400)' }} />
                    <input
                      type="text"
                      placeholder="Pesquisar..."
                      value={actionSearch}
                      onChange={e => setActionSearch(e.target.value)}
                      className="pl-5 pr-2 py-0.5 text-xs rounded border bg-transparent focus:outline-none"
                      style={{ width: '120px', borderColor: 'var(--border)', color: 'var(--ink-900)' }}
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
                    <span className="text-xs italic" style={{ color: 'var(--ink-400)' }}>Aguardando seleção...</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
