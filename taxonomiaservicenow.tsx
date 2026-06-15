import React, { useState, useEffect } from 'react';
import { Clipboard, Check, Tag, ChevronRight, LayoutTemplate, AlertCircle, Wrench, FileText } from 'lucide-react';

// --- MOCK DATA ---
const mockDatabase = {
  applications: [
    'Apriso', 'CMES', 'Cribmaster', 'Datametrics', 'Dw', 'Ease Work',
    'EDI', 'FarolTV', 'Gerezim', 'IEDPlan', 'Ignition', 'Laplus',
    'Manta', 'Mastersaf', 'MFGTools', 'MSQnet', 'OMEGA', 'Plaquetas',
    'Softway', 'Supervisório', 'Taly Profile', 'Techwork', 'TIA Portal', 'VNC', 'WI Empanela'
  ].sort(),
  tagTypes: ['Fábrica', 'Gerais', 'Cadastro', 'Renotificação', 'Script', 'Softway'],
  tags: {
    'Fábrica': ['#ATPU', '#Bateria', '#Estágio_10100', '#Falha_RDWeb', '#Geladeira', '#OP_120', '#PLC', '#Restart_IPC', '#TOPSERVER', '#TOUCHSCREEN', '#Usinagem'],
    'Gerais': ['#Rede', '#Hardware', '#Software', '#Acesso'],
    'Cadastro': ['#Novo_Usuario', '#Bloqueio', '#Permissao'],
    'Renotificação': ['#Chamado_Reaberto', '#SLA_Estourado'],
    'Script': ['#Correção_DB', '#Rotina_Manual'],
    'Softway': ['#Erro_Integracao', '#Sefaz_Offline']
  },
  relations: {
    'Apriso': {
      modules: ['Apriso', 'Local Support'],
      incidents: ['Access Failure', 'Access Request', 'Application Failure', 'Customer Request', 'Login Failure', 'No Traceability', 'Operation Offline', 'Process Failure', 'Unavailability'],
      actions: ['Access Provided', 'Access Restored', 'Analysis', 'Cancelled', 'Contingency Action', 'Duplicated', 'IPC Restart', 'Monitoring', 'No Action Needed', 'No Issues Found', 'Operation Restarted', 'Restart', 'Service Restart', 'Solved By Another Team', 'TOP Server Start/Restart']
    },
    'CMES': {
      modules: ['CMES Core', 'Relatórios'],
      incidents: ['Bug de Tela', 'Falha de Sincronização', 'Lentidão'],
      actions: ['Correção Aplicada', 'Cache Limpo', 'Encaminhado N3']
    },
    'default': {
      modules: ['Módulo Genérico 1', 'Módulo Genérico 2'],
      incidents: ['Incidente Não Listado', 'Falha Genérica'],
      actions: ['Solução de Contorno', 'Reinicialização']
    }
  }
};

export default function App() {
  // --- STATES ---
  const [app, setApp] = useState('');
  const [module, setModule] = useState('');
  const [incident, setIncident] = useState('');
  const [action, setAction] = useState('');
  
  const [activeTagCategory, setActiveTagCategory] = useState('Fábrica');
  const [selectedTags, setSelectedTags] = useState([]);
  
  const [motivo, setMotivo] = useState('');
  const [analise, setAnalise] = useState('');

  const [copiedStates, setCopiedStates] = useState({ short: false, resolution: false });

  // --- DERIVED DATA ---
  const relations = app ? (mockDatabase.relations[app] || mockDatabase.relations['default']) : null;
  const availableModules = relations?.modules || [];
  const availableIncidents = relations?.incidents || [];
  const availableActions = relations?.actions || [];
  const availableTags = mockDatabase.tags[activeTagCategory] || [];

  // --- EFFECTS ---
  // Resetar campos dependentes quando a aplicação muda
  useEffect(() => {
    setModule('');
    setIncident('');
    setAction('');
  }, [app]);

  // --- HANDLERS ---
  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleCopy = (text, type) => {
    if (!text) return;

    const fallbackCopy = (val) => {
      const textArea = document.createElement("textarea");
      textArea.value = val;
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
        }
      } catch (err) {
        console.error('Fallback: Unable to copy', err);
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

  // --- STRINGS GERADAS ---
  const shortDescription = [app, module, 'Local Support', incident, action]
    .filter(Boolean)
    .join(':');

  const resolutionNotes = `${selectedTags.join('\n')}${selectedTags.length > 0 ? '\n\n' : ''}- Motivo: ${motivo}\n- Análise: ${analise}`;

  // --- UI COMPONENTS ---
  const Chip = ({ label, isSelected, onClick, disabled }) => (
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

  const SectionCard = ({ title, icon: Icon, children }) => (
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      {/* HEADER */}
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

      {/* MAIN CONTENT */}
      <main className="max-w-7xl mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8">
        
        {/* COLUNA ESQUERDA: Formulário / Seleções */}
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
                  {mockDatabase.applications.map(a => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">
                  Módulo {app ? '' : <span className="text-slate-400 font-normal">(Selecione a aplicação primeiro)</span>}
                </label>
                <div className="flex flex-wrap gap-2">
                  {availableModules.length > 0 ? (
                    availableModules.map(m => (
                      <Chip key={m} label={m} isSelected={module === m} onClick={() => setModule(m)} />
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
                   {availableIncidents.length > 0 ? (
                    availableIncidents.map(i => (
                      <Chip key={i} label={i} isSelected={incident === i} onClick={() => setIncident(i)} disabled={!app} />
                    ))
                  ) : (
                    <div className="text-sm text-slate-400 italic">Aguardando aplicação...</div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-600 mb-2">Ação Tomada</label>
                <div className="flex flex-wrap gap-2">
                   {availableActions.length > 0 ? (
                    availableActions.map(a => (
                      <Chip key={a} label={a} isSelected={action === a} onClick={() => setAction(a)} disabled={!app} />
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
              
              {/* Tabs para categorias de Tags */}
              <div>
                <div className="flex space-x-1 border-b border-slate-200 mb-4 overflow-x-auto pb-1">
                  {mockDatabase.tagTypes.map(type => (
                    <button
                      key={type}
                      onClick={() => setActiveTagCategory(type)}
                      className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition-colors
                        ${activeTagCategory === type 
                          ? 'text-blue-600 bg-blue-50 border-b-2 border-blue-600' 
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                
                {/* Lista de tags da categoria ativa */}
                <div className="flex flex-wrap gap-2 min-h-[80px]">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded text-sm transition-colors border
                        ${selectedTags.includes(tag)
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-200 font-medium'
                          : 'bg-white text-slate-600 border-slate-200 hover:border-indigo-300 hover:bg-slate-50'}`}
                    >
                      {tag}
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

        {/* COLUNA DIREITA: Resultados Finais (Sticky) */}
        <div className="w-full lg:w-1/3">
          <div className="sticky top-24 space-y-6">
            
            {/* Card: Short Description */}
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

            {/* Card: Resolution Notes */}
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