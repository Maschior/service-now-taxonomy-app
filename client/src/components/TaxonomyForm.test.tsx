import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import TaxonomyForm from './TaxonomyForm';
import { useTaxonomyStore } from '../store/useTaxonomyStore';

// Mock dependencies
vi.mock('../hooks/useDarkMode', () => ({
  useDarkMode: () => ({ theme: 'dark', toggleTheme: vi.fn() })
}));

vi.mock('../hooks/useTaxonomyData', () => ({
  useTaxonomyData: () => ({
    applications: [{ _id: 'app1', name: 'App 1' }],
    allModules: [{ _id: 'mod1', name: 'Module 1', applicationId: 'app1' }],
    allIncidents: [{ _id: 'inc1', name: 'Incident 1', moduleIds: ['mod1'] }],
    allActions: [{ _id: 'act1', name: 'Action 1', incidentIds: ['inc1'] }],
    tags: [],
    tagCategories: [],
    loading: false,
    error: null,
    setError: vi.fn(),
  })
}));

vi.mock('../services/api', () => ({
  closureApi: {
    create: vi.fn().mockResolvedValue({}),
  }
}));

// Mock icons
vi.mock('lucide-react', () => ({
  Sparkles: () => <span>Sparkles</span>,
  Clipboard: () => <span>Clipboard</span>,
  Check: () => <span>Check</span>,
  AlertCircle: () => <span>AlertCircle</span>,
  Undo2: () => <span>Undo2</span>,
  Trash2: () => <span>Trash2</span>,
  Plus: () => <span>Plus</span>,
  X: () => <span>X</span>,
  AlignLeft: () => <span>AlignLeft</span>,
  Save: () => <span>Save</span>,
  RefreshCcw: () => <span>RefreshCcw</span>,
  AlertTriangle: () => <span>AlertTriangle</span>,
  Sun: () => <span>Sun</span>,
  Moon: () => <span>Moon</span>,
  Tag: () => <span>Tag</span>,
  LayoutTemplate: () => <span>LayoutTemplate</span>,
  Terminal: () => <span>Terminal</span>,
  Search: () => <span>Search</span>,
  Wrench: () => <span>Wrench</span>
}));

// Mock TabBar to simplify the component tree
vi.mock('./TabBar', () => ({
  default: () => <div data-testid="mock-tabbar" />
}));

describe('TaxonomyForm Component', () => {
  beforeEach(() => {
    useTaxonomyStore.setState({ tabs: [], activeTabId: null });
    // TabBar usually initializes the first tab, but we mocked it, so we do it manually.
    useTaxonomyStore.getState().addTab();
    vi.clearAllMocks();
  });

  it('renders correctly without loading state', () => {
    render(<TaxonomyForm />);
    expect(screen.getByTestId('mock-tabbar')).toBeInTheDocument();
    expect(screen.getByText(/App 1/)).toBeInTheDocument();
  });

  it('updates store on text input', async () => {
    render(<TaxonomyForm />);
    
    // Find Motivo textarea
    const textarea = screen.getByPlaceholderText(/Ex: Utilizador bloqueado no AD.../i);
    fireEvent.change(textarea, { target: { value: 'Motivo teste' } });
    
    // Store should be updated
    const state = useTaxonomyStore.getState();
    const activeTab = state.tabs.find(t => t.id === state.activeTabId);
    expect(activeTab?.data.motivo).toBe('Motivo teste');
  });

});
