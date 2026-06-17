import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import Login from './Login';
import * as authApi from '../services/authApi';
import { AuthProvider } from '../contexts/AuthContext';

// Mock the auth api module
vi.mock('../services/authApi', () => ({
  login: vi.fn(),
}));

const renderLogin = () => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        <Login />
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form correctly', () => {
    renderLogin();
    expect(screen.getByText('ServiceNow Taxonomy')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('admin@taxonomy.local')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('handles successful login', async () => {
    const mockUser = { id: '1', name: 'Admin', email: 'admin@taxonomy.local', role: 'ADMIN', workspaces: ['ws1'] };
    (authApi.login as any).mockResolvedValueOnce({ user: mockUser, token: 'fake-token' });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('admin@taxonomy.local'), { target: { value: 'admin@taxonomy.local' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'admin123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(authApi.login).toHaveBeenCalledWith('admin@taxonomy.local', 'admin123');
    });
  });

  it('displays error message on failed login', async () => {
    (authApi.login as any).mockRejectedValueOnce({ response: { data: { error: 'Invalid credentials' } } });

    renderLogin();

    fireEvent.change(screen.getByPlaceholderText('admin@taxonomy.local'), { target: { value: 'wrong@test.com' } });
    fireEvent.change(screen.getByPlaceholderText('••••••••'), { target: { value: 'wrongpass' } });
    
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
    });
  });
});
