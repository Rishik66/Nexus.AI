import React, { createContext, useContext, useState, useEffect } from 'react';
import { ApiService, User, Business } from '../services/api.js';

interface AuthContextType {
  user: User | null;
  business: Business | null;
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
  pendingApprovalsCount: number;
  token: string | null;
  login: (email: string, pass: string) => Promise<void>;
  switchRole: (newRole: 'ADMIN' | 'MANAGER' | 'EMPLOYEE') => Promise<void>;
  refreshApprovals: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>({
    id: 'demo-admin-id',
    email: 'admin@nexus.ai',
    full_name: 'Alexandra Vance (Lead Architect)',
    role: 'ADMIN',
  });
  const [business, setBusiness] = useState<Business | null>({
    id: 'demo-biz-id',
    name: 'Apex Retail & Distribution Co.',
    type: 'DISTRIBUTOR',
    currency: 'USD',
    is_demo: true,
  });
  const [role, setRole] = useState<'ADMIN' | 'MANAGER' | 'EMPLOYEE'>('ADMIN');
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [token, setToken] = useState<string | null>(
    typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem('nexus_token') : null
  );

  // Initialize session
  useEffect(() => {
    const init = async () => {
      try {
        // Automatically login as admin if no token in demo mode
        if (!token) {
          const res = await ApiService.login('admin@nexus.ai', 'nexus123');
          localStorage.setItem('nexus_token', res.token);
          setToken(res.token);
          setUser(res.user);
          setRole(res.user.role);
        } else {
          const res = await ApiService.getMe();
          if (res?.user) {
            setUser(res.user);
            setRole(res.user.role);
          }
        }

        const biz = await ApiService.getCurrentBusiness();
        if (biz) setBusiness(biz);

        await refreshApprovals();
      } catch (err) {
        console.warn('Auth session initial fallback:', err);
      }
    };
    init();
  }, []);

  const refreshApprovals = async () => {
    try {
      const data = await ApiService.getApprovals();
      setPendingApprovalsCount(data.pendingCount);
    } catch (err) {
      // ignore
    }
  };

  const login = async (email: string, pass: string) => {
    const res = await ApiService.login(email, pass);
    localStorage.setItem('nexus_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setRole(res.user.role);
    await refreshApprovals();
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
        login,
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
