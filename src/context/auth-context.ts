import { createContext } from 'react';
import type { AdminRole } from '../types';

export interface AuthUser {
  uid: string;
  email: string;
  displayName: string;
  role: AdminRole;
}

export interface AuthContextType {
  status: 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  isAuthenticated: boolean;
  user: AuthUser | null;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginAsDemoAdmin: (role?: AdminRole) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
