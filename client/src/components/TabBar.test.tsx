import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import TabBar from './TabBar';
import { useTaxonomyStore } from '../store/useTaxonomyStore';

// Mock Lucide icons to avoid SVGs cluttering tests
vi.mock('lucide-react', () => ({
  Plus: () => <span data-testid="icon-plus">Plus</span>,
  X: () => <span data-testid="icon-x">X</span>,
  AlignLeft: () => <span data-testid="icon-align-left">Align</span>,
}));

// Mock window.confirm
const originalConfirm = window.confirm;

describe('TabBar Component', () => {
  beforeEach(() => {
    // Reset store
    useTaxonomyStore.setState({ tabs: [], activeTabId: null });
    window.confirm = vi.fn().mockImplementation(() => true);
  });

  afterAll(() => {
    window.confirm = originalConfirm;
  });

  it('renders correctly and auto-adds a first tab if empty', () => {
    render(<TabBar />);
    const state = useTaxonomyStore.getState();
    expect(state.tabs.length).toBe(1);
    expect(screen.getByText('Novo Chamado')).toBeInTheDocument();
  });

  it('adds a new tab when clicking the Plus button', () => {
    render(<TabBar />);
    
    // One tab auto-created
    expect(useTaxonomyStore.getState().tabs.length).toBe(1);
    
    // Find Plus button and click it
    const addBtn = screen.getByTitle('Nova Aba');
    fireEvent.click(addBtn);
    
    expect(useTaxonomyStore.getState().tabs.length).toBe(2);
  });

  it('switches active tab when clicking on a tab', () => {
    useTaxonomyStore.getState().addTab('Aba A');
    useTaxonomyStore.getState().addTab('Aba B');
    
    render(<TabBar />);
    
    const abaB = screen.getByText('Aba B');
    fireEvent.click(abaB);
    
    // Store should reflect active tab B
    const state = useTaxonomyStore.getState();
    expect(state.activeTabId).toBe(state.tabs[1].id);
  });

  it('removes a tab when clicking the X button', () => {
    useTaxonomyStore.getState().addTab('Aba Fixa');
    render(<TabBar />);
    
    const removeBtn = screen.getByTitle('Fechar Aba');
    fireEvent.click(removeBtn);
    
    // It should be removed, but since it was empty, it won't prompt confirm.
    // Also, since it was the last tab, TabBar's useEffect might spawn a new one,
    // let's check if the specific "Aba Fixa" is gone.
    expect(screen.queryByText('Aba Fixa')).not.toBeInTheDocument();
  });

  it('prompts window.confirm if closing an unsaved tab with data', () => {
    const store = useTaxonomyStore.getState();
    store.addTab('Aba Ocupada');
    store.updateActiveTab({ motivo: 'Tem dados aqui!' });
    
    render(<TabBar />);
    
    const removeBtns = screen.getAllByTitle('Fechar Aba');
    fireEvent.click(removeBtns[0]);
    
    expect(window.confirm).toHaveBeenCalledWith("Essa aba tem dados não salvos. Deseja realmente fechá-la?");
  });
});
