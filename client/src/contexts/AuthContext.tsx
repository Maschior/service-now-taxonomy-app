import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  workspaces: string[];
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  currentWorkspaceId: string | null;
  login: (userData: User, token: string) => void;
  logout: () => void;
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
      if (storedWorkspace) {
        setCurrentWorkspaceId(storedWorkspace);
      } else {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.workspaces && parsedUser.workspaces.length > 0) {
          setCurrentWorkspaceId(parsedUser.workspaces[0]);
        }
      }
    }
  }, []);

  const login = (userData: User, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    localStorage.setItem('token', authToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    if (userData.workspaces && userData.workspaces.length > 0) {
      setCurrentWorkspaceId(userData.workspaces[0]);
      localStorage.setItem('currentWorkspaceId', userData.workspaces[0]);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setCurrentWorkspaceId(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('currentWorkspaceId');
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
    <AuthContext.Provider value={{ user, token, currentWorkspaceId, login, logout, setCurrentWorkspaceId: changeWorkspace }}>
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
