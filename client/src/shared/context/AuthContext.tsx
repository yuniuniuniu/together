import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { User } from '../types';
import { authApi } from '../api/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  sendCode: (email: string) => Promise<void>;
  login: (email: string, code: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true, // Start loading to check for existing session
  });

  // Check for existing session on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      authApi.getMe()
        .then(response => {
          setState({
            user: response.data,
            isAuthenticated: true,
            isLoading: false,
          });
        })
        .catch(() => {
          localStorage.removeItem('auth_token');
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        });
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const sendCode = useCallback(async (email: string): Promise<void> => {
    await authApi.sendCode(email);
  }, []);

  const login = useCallback(async (email: string, code: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await authApi.verify(email, code);
      localStorage.setItem('auth_token', response.data.token);
      setState({
        user: response.data.user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      // Call logout API to invalidate session on server
      await authApi.logout();
    } catch {
      // Continue with local logout even if API fails
    }
    localStorage.removeItem('auth_token');
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    const response = await authApi.updateProfile(updates);
    setState(prev => ({
      ...prev,
      user: response.data,
    }));
  }, []);

  const setUser = useCallback((user: User | null) => {
    setState(prev => ({
      ...prev,
      user,
      isAuthenticated: !!user,
    }));
  }, []);

  const value: AuthContextValue = {
    ...state,
    sendCode,
    login,
    logout,
    updateProfile,
    setUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { AuthContext };
