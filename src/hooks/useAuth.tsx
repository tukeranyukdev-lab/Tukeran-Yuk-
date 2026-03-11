import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { apiFetch } from '../utils/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  setUser: (user: User | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('tukeran_user');
    const savedToken = localStorage.getItem('tukeran_token');
    if (savedUser && savedToken) {
      setUser(JSON.parse(savedUser));
      setToken(savedToken);
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');
    
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('tukeran_user', JSON.stringify(data.user));
    localStorage.setItem('tukeran_token', data.token);
  };

  const register = async (username: string, email: string, password: string) => {
    const res = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Registration failed');

    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('tukeran_user', JSON.stringify(data.user));
    localStorage.setItem('tukeran_token', data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('tukeran_user');
    localStorage.removeItem('tukeran_token');
  };

  const updateUser = (userData: User | null) => {
    setUser(userData);
    if (userData) {
      localStorage.setItem('tukeran_user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('tukeran_user');
      localStorage.removeItem('tukeran_token');
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, setUser: updateUser, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
