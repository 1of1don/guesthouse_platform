import { createContext } from 'react';

export interface AuthContextValue {
  status: 'loading' | 'authenticated' | 'unauthenticated' | 'error';
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
