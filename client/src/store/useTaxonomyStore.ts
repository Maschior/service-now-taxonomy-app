import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface TaxonomyFormData {
  selectedApp: string;
  selectedModule: string;
  selectedIncident: string;
  selectedAction: string;
  activeCategories: string[];
  selectedTags: string[];
  ticketNumber: string;
  motivo: string;
  analise: string;
  solucao: string;
}

export interface Tab {
  id: string;
  title: string;
  isSaved: boolean;
  data: TaxonomyFormData;
}

interface TaxonomyStore {
  tabs: Tab[];
  activeTabId: string | null;
  
  // Tab Management
  addTab: (title?: string) => void;
  removeTab: (id: string) => void;
  closeAllOtherTabs: (id: string) => void;
  closeTabsToLeft: (id: string) => void;
  closeTabsToRight: (id: string) => void;
  setActiveTab: (id: string) => void;
  clearAllTabs: () => void;
  
  // Updating active tab data
  updateActiveTab: (updater: Partial<TaxonomyFormData> | ((prev: TaxonomyFormData) => Partial<TaxonomyFormData>)) => void;
  markActiveTabAsSaved: () => void;
  updateTabTitle: (id: string, title: string) => void;
}

const initialFormData: TaxonomyFormData = {
  selectedApp: '',
  selectedModule: '',
  selectedIncident: '',
  selectedAction: '',
  activeCategories: [],
  selectedTags: [],
  ticketNumber: '',
  motivo: '',
  analise: '',
  solucao: '',
};

// ponytail: crypto.randomUUID requires a secure context (HTTPS/localhost) and throws on plain HTTP
const generateId = (): string =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const createNewTab = (title: string = 'Novo Chamado'): Tab => ({
  id: generateId(),
  title,
  isSaved: false,
  data: { ...initialFormData },
});

export const useTaxonomyStore = create<TaxonomyStore>()(
  persist(
    (set) => ({
      tabs: [],
      activeTabId: null,

      addTab: (title) => {
        const newTab = createNewTab(title);
        set((state) => ({
          tabs: [...state.tabs, newTab],
          activeTabId: newTab.id,
        }));
      },

      removeTab: (id) => {
        set((state) => {
          const newTabs = state.tabs.filter((t) => t.id !== id);
          let newActiveId = state.activeTabId;
          
          if (state.activeTabId === id) {
            const index = state.tabs.findIndex((t) => t.id === id);
            if (newTabs.length > 0) {
              newActiveId = newTabs[Math.max(0, index - 1)].id;
            } else {
              newActiveId = null;
            }
          }
          return { tabs: newTabs, activeTabId: newActiveId };
        });
      },

      closeAllOtherTabs: (id) => {
        set((state) => {
          const targetTab = state.tabs.find(t => t.id === id);
          if (!targetTab) return state;
          return { tabs: [targetTab], activeTabId: id };
        });
      },

      closeTabsToLeft: (id) => {
        set((state) => {
          const index = state.tabs.findIndex(t => t.id === id);
          if (index <= 0) return state;
          
          const newTabs = state.tabs.slice(index);
          const isActivedRemoved = !newTabs.some(t => t.id === state.activeTabId);
          
          return {
            tabs: newTabs,
            activeTabId: isActivedRemoved ? id : state.activeTabId
          };
        });
      },

      closeTabsToRight: (id) => {
        set((state) => {
          const index = state.tabs.findIndex(t => t.id === id);
          if (index === -1 || index === state.tabs.length - 1) return state;
          
          const newTabs = state.tabs.slice(0, index + 1);
          const isActivedRemoved = !newTabs.some(t => t.id === state.activeTabId);
          
          return {
            tabs: newTabs,
            activeTabId: isActivedRemoved ? id : state.activeTabId
          };
        });
      },

      setActiveTab: (id) => set({ activeTabId: id }),

      clearAllTabs: () => set({ tabs: [], activeTabId: null }),

      updateActiveTab: (updater) => {
        set((state) => {
          if (!state.activeTabId) return state;
          
          const tabIndex = state.tabs.findIndex((t) => t.id === state.activeTabId);
          if (tabIndex === -1) return state;

          const currentData = state.tabs[tabIndex].data;
          const updates = typeof updater === 'function' ? updater(currentData) : updater;

          const newTabs = [...state.tabs];
          newTabs[tabIndex] = {
            ...newTabs[tabIndex],
            data: { ...currentData, ...updates },
          };

          return { tabs: newTabs };
        });
      },

      markActiveTabAsSaved: () => {
        set((state) => {
          if (!state.activeTabId) return state;
          const newTabs = state.tabs.map((t) =>
            t.id === state.activeTabId ? { ...t, isSaved: true } : t
          );
          return { tabs: newTabs };
        });
      },

      updateTabTitle: (id, title) => {
        set((state) => {
          const newTabs = state.tabs.map((t) =>
            t.id === id ? { ...t, title } : t
          );
          return { tabs: newTabs };
        });
      },
    }),
    {
      name: 'taxonomy-tabs-storage',
      storage: createJSONStorage(() => ({
        getItem: (name: string) => {
          try {
            const wsId = localStorage.getItem('currentWorkspaceId') || 'global';
            return localStorage.getItem(`${name}-${wsId}`);
          } catch (e) {
            console.warn("localStorage is disabled or not accessible.");
            return null;
          }
        },
        setItem: (name: string, value: string) => {
          try {
            const wsId = localStorage.getItem('currentWorkspaceId') || 'global';
            localStorage.setItem(`${name}-${wsId}`, value);
          } catch (e: any) {
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
              alert("O armazenamento do navegador está cheio! Feche algumas abas antigas para conseguir salvar mais chamados.");
            } else {
              console.warn("Failed to save to localStorage:", e);
            }
          }
        },
        removeItem: (name: string) => {
          try {
            const wsId = localStorage.getItem('currentWorkspaceId') || 'global';
            localStorage.removeItem(`${name}-${wsId}`);
          } catch (e) {
            console.warn("Failed to remove from localStorage:", e);
          }
        },
      })),
    }
  )
);
