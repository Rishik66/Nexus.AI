import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiService, User, Business } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  business: Business | null;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  pendingApprovalsCount: number;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, fullName: string, role?: 'ADMIN' | 'MANAGER' | 'EMPLOYEE', companyName?: string) => Promise<void>;
  logout: () => void;
  switchRole: (newRole: 'ADMIN' | 'MANAGER' | 'EMPLOYEE') => Promise<void>;
  refreshApprovals: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'EMPLOYEE'>('ADMIN');
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('nexus_token');
    }
    return null;
  });

  // Check and restore session on mount if token exists
  useEffect(() => {
    const checkSession = async () => {
      const storedToken = typeof window !== 'undefined' && window.localStorage
        ? window.localStorage.getItem('nexus_token')
        : null;

      if (!storedToken) {
        setUser(null);
        setToken(null);
        setIsLoading(false);
        return;
      }

      try {
        const meRes = await ApiService.getMe();
        if (meRes?.user) {
          setUser(meRes.user);
          setRole(meRes.user.role);
          setToken(storedToken);

          const biz = await ApiService.getCurrentBusiness();
          if (biz) setBusiness(biz);

          await refreshApprovals();
        } else {
          // Token invalid
          localStorage.removeItem('nexus_token');
          setUser(null);
          setToken(null);
        }
      } catch (err) {
        console.warn('Session verification failed, logging out:', err);
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem('nexus_token');
        }
        setUser(null);
        setToken(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const refreshApprovals = async () => {
    try {
      const data = await ApiService.getApprovals();
      setPendingApprovalsCount(data.pendingCount || 0);
    } catch (err) {
      // ignore
    }
  };

  const login = async (email: string, pass: string) => {
    const res = await ApiService.login(email, pass);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('nexus_token', res.token);
    }
    setToken(res.token);
    setUser(res.user);
    setRole(res.user.role);

    try {
      const biz = await ApiService.getCurrentBusiness();
      if (biz) setBusiness(biz);
    } catch {
      // ignore
    }

    await refreshApprovals();
  };

  const register = async (
    email: string,
    pass: string,
    fullName: string,
    newRole: 'ADMIN' | 'MANAGER' | 'EMPLOYEE' = 'ADMIN',
    companyName?: string
  ) => {
    const res = await ApiService.register({
      email,
      password: pass,
      full_name: fullName,
      company_name: companyName,
      role: newRole,
    });
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('nexus_token', res.token);
    }
    setToken(res.token);
    setUser(res.user);
    setRole(res.user.role);

    if (res.business) {
      setBusiness(res.business);
    } else {
      try {
        const biz = await ApiService.getCurrentBusiness();
        if (biz) setBusiness(biz);
      } catch {
        // ignore
      }
    }

    try {
      await refreshApprovals();
    } catch {
      // ignore
    }
  };

  const logout = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem('nexus_token');
    }
    setToken(null);
    setUser(null);
    setBusiness(null);
    setPendingApprovalsCount(0);
    window.location.href = '/login';
  };

  const switchRole = async (newRole: 'ADMIN' | 'MANAGER' | 'EMPLOYEE') => {
    const emails: Record<string, string> = {
      ADMIN: 'admin@nexus.ai',
      MANAGER: 'manager@nexus.ai',
      EMPLOYEE: 'employee@nexus.ai',
    };
    try {
      await login(emails[newRole], 'nexus123');
    } catch (err) {
      console.error('Failed to switch role:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        business,
        role,
        pendingApprovalsCount,
        token,
        isLoading,
        isAuthenticated: Boolean(user && token),
        login,
        register,
        logout,
        switchRole,
        refreshApprovals,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
