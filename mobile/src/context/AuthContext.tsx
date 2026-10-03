import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/auth';
import * as data from '../services/guesthouses';
import { Customer } from '../types';

type Ctx = {
  customer: Customer | null;
  favouriteIds: string[];
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  // Returns false when logged out so the caller can send the user to log in.
  toggleFavourite: (guesthouseId: string) => Promise<boolean>;
};
const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [favouriteIds, setFavouriteIds] = useState<string[]>([]);

  const start = useCallback(async (c: Customer) => {
    setCustomer(c);
    setFavouriteIds(await data.getFavouriteIds(c.id).catch(() => []));
  }, []);

  // Restores a saved session on launch and follows log in / log out.
  useEffect(
    () => authService.onCustomerChanged((c) => (c ? start(c) : (setCustomer(null), setFavouriteIds([])))),
    [start],
  );

  const value = useMemo<Ctx>(() => ({
    customer, favouriteIds,
    login: async (e, p) => start(await authService.login(e, p)),
    register: async (n, e, p) => start(await authService.register(n, e, p)),
    logout: () => { authService.logout(); setCustomer(null); setFavouriteIds([]); },
    toggleFavourite: async (id) => {
      if (!customer) return false;
      const nowFav = await data.toggleFavourite(customer.id, id);
      setFavouriteIds((prev) => (nowFav ? [...prev, id] : prev.filter((x) => x !== id)));
      return true;
    },
  }), [customer, favouriteIds, start]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth must be used inside AuthProvider');
  return c;
};
