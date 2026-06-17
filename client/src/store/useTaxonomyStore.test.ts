import { describe, it, expect, beforeEach } from 'vitest';
import { useTaxonomyStore } from './useTaxonomyStore';

describe('useTaxonomyStore', () => {
  beforeEach(() => {
    // Reset the store before each test
    useTaxonomyStore.setState({
      tabs: [],
      activeTabId: null
    });
  });

  it('should add a new tab automatically if store is empty', () => {
    const { addTab } = useTaxonomyStore.getState();
    addTab();
    
    const state = useTaxonomyStore.getState();
    expect(state.tabs.length).toBe(1);
    expect(state.tabs[0].title).toBe('Novo Chamado');
    expect(state.activeTabId).toBe(state.tabs[0].id);
  });

  it('should remove a tab and fallback to another tab', () => {
    const store = useTaxonomyStore.getState();
    store.addTab('Aba 1');
    store.addTab('Aba 2');
    
    let state = useTaxonomyStore.getState();
    expect(state.tabs.length).toBe(2);
    
    const firstTabId = state.tabs[0].id;
    const secondTabId = state.tabs[1].id;
    
    // activeTabId is secondTabId since it was added last
    expect(state.activeTabId).toBe(secondTabId);
    
    // Remove the active tab
    state.removeTab(secondTabId);
    
    state = useTaxonomyStore.getState();
    expect(state.tabs.length).toBe(1);
    expect(state.activeTabId).toBe(firstTabId);
  });

  it('should update active tab data and mark as saved', () => {
    const store = useTaxonomyStore.getState();
    store.addTab();
    
    store.updateActiveTab({ selectedApp: 'app-123' });
    
    let state = useTaxonomyStore.getState();
    const activeTab = state.tabs.find(t => t.id === state.activeTabId);
    
    expect(activeTab?.data.selectedApp).toBe('app-123');
    expect(activeTab?.isSaved).toBe(false);
    
    store.markActiveTabAsSaved();
    state = useTaxonomyStore.getState();
    expect(state.tabs.find(t => t.id === state.activeTabId)?.isSaved).toBe(true);
  });

  it('should close all other tabs', () => {
    const store = useTaxonomyStore.getState();
    store.addTab('1');
    store.addTab('2');
    store.addTab('3');
    
    let state = useTaxonomyStore.getState();
    const targetId = state.tabs[1].id;
    
    store.closeAllOtherTabs(targetId);
    state = useTaxonomyStore.getState();
    
    expect(state.tabs.length).toBe(1);
    expect(state.tabs[0].id).toBe(targetId);
    expect(state.activeTabId).toBe(targetId);
  });
});
