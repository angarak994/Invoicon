'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { client } from '../lib/api/client';
import { refreshClient } from '../lib/api/refreshClient';
import { tokenStore } from './tokenStore';
import { useTheme } from './ThemeContext';

interface UserPayload {
  _id: string;
  name: string;
  email: string;
  plan: 'free' | 'pro';
  invoicePrefix: string;
  defaultCurrency: string;
  defaultTaxPercentage: number;
  businessName?: string;
  businessAddress?: string;
  logoUrl?: string;
}

interface AuthContextType {
  user: UserPayload | null;
  loading: boolean;
  login: (accessToken: string, userPayload: UserPayload) => void;
  logout: () => Promise<void>;
  updateUserSession: (updatedData: Partial<UserPayload>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { updateBrandColor } = useTheme();

  // Stable ref for updateBrandColor — prevents re-triggering the session restore
  // effect if ThemeContext re-renders. This is architecturally safer than listing
  // the callback in the dependency array (which relies on useCallback staying in place).
  const updateBrandColorRef = useRef(updateBrandColor);
  updateBrandColorRef.current = updateBrandColor;

  // Restore secure session on mount using rotated refresh cookies
  useEffect(() => {
    async function restoreSession() {
      try {
        const refreshRes = await refreshClient.post('/api/v1/auth/refresh');
        const { accessToken } = refreshRes.data.data;
        
        tokenStore.set(accessToken);
        
        const userRes = await client.get('/api/v1/users/me');
        const userProfile = userRes.data.data;
        
        setUser(userProfile);
        
        if (userProfile.colorScheme) {
          updateBrandColorRef.current(userProfile.colorScheme);
        }
      } catch (err) {
        console.warn('No active session recovered on startup.');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    
    restoreSession();
  }, []);

  const login = useCallback((accessToken: string, userPayload: UserPayload) => {
    tokenStore.set(accessToken);
    setUser(userPayload);
    
    if ((userPayload as any).colorScheme) {
      updateBrandColorRef.current((userPayload as any).colorScheme);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await client.post('/api/v1/auth/logout');
    } catch (err) {
      console.error('Logout error cleaner triggered:', err);
    } finally {
      tokenStore.clear();
      setUser(null);
    }
  }, []);

  const updateUserSession = useCallback((updatedData: Partial<UserPayload>) => {
    setUser((prev) => {
      if (!prev) return null;
      const nextUser = { ...prev, ...updatedData };
      if ((updatedData as any).colorScheme) {
        updateBrandColorRef.current((updatedData as any).colorScheme);
      }
      return nextUser;
    });
  }, []);

  const contextValue = useMemo(() => ({
    user, loading, login, logout, updateUserSession
  }), [user, loading, login, logout, updateUserSession]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider context boundary');
  }
  return context;
}
