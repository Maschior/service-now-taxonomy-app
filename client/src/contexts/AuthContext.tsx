import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Workspace {
  _id: string;
  name: string;
  isGlobal: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  photoUrl?: string;
  role: string;
  workspaces: Workspace[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  currentWorkspaceId: string | null;
  login: (userData: User, token: string, selectedWorkspaceId?: string) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  setCurrentWorkspaceId: (id: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedWorkspace = localStorage.getItem('currentWorkspaceId');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      if (storedWorkspace && storedWorkspace !== '[object Object]') {
        setCurrentWorkspaceId(storedWorkspace);
      } else {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.workspaces && parsedUser.workspaces.length > 0) {
          const firstWorkspace = parsedUser.workspaces[0];
          setCurrentWorkspaceId(typeof firstWorkspace === 'string' ? firstWorkspace : firstWorkspace._id);
        }
      }
    }
  }, []);

  const login = (userData: User, authToken: string, selectedWorkspaceId?: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    if (selectedWorkspaceId) {
      setCurrentWorkspaceId(selectedWorkspaceId);
      localStorage.setItem('currentWorkspaceId', selectedWorkspaceId);
    } else if (userData.workspaces && userData.workspaces.length > 0) {
      const firstWorkspace = userData.workspaces[0];
      const workspaceId = typeof firstWorkspace === 'string' ? firstWorkspace : firstWorkspace._id;
      setCurrentWorkspaceId(workspaceId);
      localStorage.setItem('currentWorkspaceId', workspaceId);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setCurrentWorkspaceId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentWorkspaceId');
    
    // Security: Clear any taxonomy tabs persistence to prevent tab leakage between accounts
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('taxonomy-store-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  };

  const changeWorkspace = (id: string | null) => {
    setCurrentWorkspaceId(id);
    if (id) {
      localStorage.setItem('currentWorkspaceId', id);
    } else {
      localStorage.removeItem('currentWorkspaceId');
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, currentWorkspaceId, login, logout, updateUser, setCurrentWorkspaceId: changeWorkspace }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
