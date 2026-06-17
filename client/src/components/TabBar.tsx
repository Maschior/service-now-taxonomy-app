import { Plus, X, AlignLeft } from 'lucide-react';
import { useTaxonomyStore } from '../store/useTaxonomyStore';
import { useEffect } from 'react';

export default function TabBar() {
  const { tabs, activeTabId, addTab, removeTab, setActiveTab } = useTaxonomyStore();

  // If there are no tabs, create the first one automatically
  useEffect(() => {
    if (tabs.length === 0) {
      addTab();
    }
  }, [tabs.length, addTab]);

  return (
    <div className="flex items-center gap-1 w-full overflow-x-auto p-2" style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border-primary)' }}>
      {tabs.map((tab) => (
        <div
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          onAuxClick={(e) => {
            // Middle click to close
            if (e.button === 1) removeTab(tab.id);
          }}
          className={`group flex items-center gap-2 px-3 py-1.5 rounded-t-lg cursor-pointer select-none transition-all duration-200 min-w-[120px] max-w-[200px] border-b-2`}
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
            onClick={(e) => {
              e.stopPropagation();
              removeTab(tab.id);
            }}
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
        className="flex items-center justify-center p-1.5 ml-1 rounded-lg transition-colors"
        style={{ color: 'var(--text-secondary)', background: 'var(--bg-card)' }}
        title="Nova Aba"
      >
        <Plus size={16} />
      </button>
    </div>
  );
}
