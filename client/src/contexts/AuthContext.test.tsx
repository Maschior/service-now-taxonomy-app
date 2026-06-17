import { render, screen, act } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';
import { describe, it, expect, beforeEach, vi } from 'vitest';

const TestComponent = () => {
  const { user, token, currentWorkspaceId, login, logout, setCurrentWorkspaceId } = useAuth();
  
  return (
    <div>
      <div data-testid="user">{user?.name || 'No User'}</div>
      <div data-testid="token">{token || 'No Token'}</div>
      <div data-testid="workspace">{currentWorkspaceId || 'No Workspace'}</div>
      <button 
        data-testid="login-btn" 
        onClick={() => login({ id: '1', name: 'Test User', email: 'test@test.com', role: 'USER', workspaces: ['ws1', 'ws2'] }, 'fake-token')}
      >
        Login
      </button>
      <button data-testid="logout-btn" onClick={logout}>Logout</button>
      <button data-testid="change-ws-btn" onClick={() => setCurrentWorkspaceId('ws2')}>Change WS</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('provides initial null state when no localStorage data exists', () => {
    render(<AuthProvider><TestComponent /></AuthProvider>);
    
    expect(screen.getByTestId('user').textContent).toBe('No User');
    expect(screen.getByTestId('token').textContent).toBe('No Token');
    expect(screen.getByTestId('workspace').textContent).toBe('No Workspace');
  });

  it('updates state and localStorage on login', () => {
    render(<AuthProvider><TestComponent /></AuthProvider>);
    
    act(() => {
      screen.getByTestId('login-btn').click();
    });

    expect(screen.getByTestId('user').textContent).toBe('Test User');
    expect(screen.getByTestId('token').textContent).toBe('fake-token');
    expect(screen.getByTestId('workspace').textContent).toBe('ws1');
    expect(localStorage.getItem('token')).toBe('fake-token');
    expect(localStorage.getItem('currentWorkspaceId')).toBe('ws1');
  });

  it('clears state and localStorage on logout', () => {
    render(<AuthProvider><TestComponent /></AuthProvider>);
    
    act(() => {
      screen.getByTestId('login-btn').click();
    });
    
    act(() => {
      screen.getByTestId('logout-btn').click();
    });

    expect(screen.getByTestId('user').textContent).toBe('No User');
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('allows changing current workspace id', () => {
    render(<AuthProvider><TestComponent /></AuthProvider>);
    
    act(() => {
      screen.getByTestId('login-btn').click();
    });

    act(() => {
      screen.getByTestId('change-ws-btn').click();
    });

    expect(screen.getByTestId('workspace').textContent).toBe('ws2');
    expect(localStorage.getItem('currentWorkspaceId')).toBe('ws2');
  });
});
