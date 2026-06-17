import { Plus, X, AlignLeft } from 'lucide-react';
import { useTaxonomyStore } from '../store/useTaxonomyStore';
import { useEffect, useState, useRef } from 'react';

export default function TabBar() {
  const { 
    tabs, activeTabId, addTab, removeTab, setActiveTab, 
    closeAllOtherTabs, closeTabsToLeft, closeTabsToRight 
  } = useTaxonomyStore();

  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, tabId: string } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // If there are no tabs, create the first one automatically
  useEffect(() => {
    if (tabs.length === 0) {
      addTab();
    }
  }, [tabs.length, addTab]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCloseTab = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const tab = tabs.find(t => t.id === id);
    if (!tab) return;

    // Check if tab has data and is not saved
    const isEmpty = !tab.data.selectedApp && !tab.data.motivo.trim() && !tab.data.analise.trim() && !tab.data.solucao.trim();
    if (!isEmpty && !tab.isSaved) {
      if (!window.confirm("Essa aba tem dados não salvos. Deseja realmente fechá-la?")) {
        return;
      }
    }
    removeTab(id);
    if (contextMenu?.tabId === id) setContextMenu(null);
  };

  const handleContextMenu = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      tabId: id
    });
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-1 w-full overflow-x-auto p-2" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            onAuxClick={(e) => {
              if (e.button === 1) handleCloseTab(tab.id, e);
            }}
            onContextMenu={(e) => handleContextMenu(e, tab.id)}
            className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer select-none transition-all duration-200 min-w-[120px] max-w-[200px] border-b-2 relative`}
            style={{
              background: activeTabId === tab.id ? 'var(--bg-primary)' : 'rgba(0,0,0,0.02)',
              borderBottomColor: activeTabId === tab.id ? 'var(--accent-primary)' : 'transparent',
              opacity: activeTabId === tab.id ? 1 : 0.7,
            }}
          >
            <AlignLeft size={14} style={{ color: tab.isSaved ? 'var(--success-color)' : 'var(--text-muted)' }} />
            <span 
              className="text-sm font-medium truncate flex-1" 
              style={{ color: activeTabId === tab.id ? 'var(--text-primary)' : 'var(--text-secondary)' }}
              title={tab.title}
            >
              {tab.title}
            </span>
            <button
              onClick={(e) => handleCloseTab(tab.id, e)}
              className="p-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/10 hover:text-red-500"
              style={{ color: 'var(--text-muted)' }}
              title="Fechar Aba"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        <button
          onClick={() => addTab()}
          className="flex items-center justify-center p-1.5 ml-1 rounded-lg transition-colors hover:opacity-80"
          style={{ color: 'var(--text-secondary)', background: 'var(--bg-card)' }}
          title="Nova Aba"
        >
          <Plus size={16} />
        </button>
      </div>

      {contextMenu && (
        <div 
          ref={contextMenuRef}
          className="fixed z-[9999] py-1 rounded-lg shadow-xl border text-sm animate-fade-in"
          style={{ 
            background: 'var(--bg-card)', 
            borderColor: 'var(--border-secondary)',
            left: Math.min(contextMenu.x, window.innerWidth - 200), // Prevent overflow right
            top: contextMenu.y 
          }}
        >
          <button 
            className="w-full text-left px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5"
            onClick={() => handleCloseTab(contextMenu.tabId)}
          >
            Fechar Aba
          </button>
          <button 
            className="w-full text-left px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5"
            onClick={() => {
              closeAllOtherTabs(contextMenu.tabId);
              setContextMenu(null);
            }}
          >
            Fechar Outras Abas
          </button>
          <button 
            className="w-full text-left px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5"
            onClick={() => {
              closeTabsToLeft(contextMenu.tabId);
              setContextMenu(null);
            }}
          >
            Fechar Abas à Esquerda
          </button>
          <button 
            className="w-full text-left px-4 py-2 hover:bg-black/5 dark:hover:bg-white/5"
            onClick={() => {
              closeTabsToRight(contextMenu.tabId);
              setContextMenu(null);
            }}
          >
            Fechar Abas à Direita
          </button>
        </div>
      )}
    </div>
  );
}
