// LOGIN STATE (shared by every screen): who is logged in, their saved guesthouses,
// whether an admin has suspended them, and the log in / sign up / log out / save actions.
// Screens read it with:  const { customer, toggleFavourite } = useAuth();
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as authService from '../services/auth';
import * as data from '../services/guesthouses';
import { DEFAULT_THEME, THEMES } from '../theme';
import { Customer } from '../types';
import { useTheme } from './ThemeContext';
import { useToast } from './ToastContext';

type Ctx = {
  customer: Customer | null;
  // True until Firebase has restored (or ruled out) a saved session on launch.
  loading: boolean;
  favouriteIds: string[];
  // True when an admin has suspended this customer. They can browse, but not save, rate or review.
  isSuspended: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, username: string, email: string, password: string) => Promise<void>;
  updatePhoto: (dataUri: string) => Promise<void>;
  logout: () => void;
  // Returns false when logged out so the caller can send the user to log in.
  toggleFavourite: (guesthouseId: string) => Promise<boolean>;
};
const AuthContext = createContext<Ctx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [favouriteIds, setFavouriteIds] = useState<string[]>([]);
  const [suspended, setSuspended] = useState(false);

  const start = useCallback(async (c: Customer) => {
    setCustomer(c);
    setFavouriteIds(await data.getFavouriteIds(c.id).catch(() => []));
  }, []);

  // Restores a saved session on launch and follows log in / log out.
  useEffect(
    () =>
      authService.onCustomerChanged((c) => {
        if (c) start(c);
        else { setCustomer(null); setFavouriteIds([]); }
        setLoading(false);
      }),
    [start],
  );

  // Locked themes are for logged-in customers only, so guests go back to the default.
  const { themeKey, setTheme } = useTheme();
  const { showToast } = useToast();
  useEffect(() => {
    if (!loading && !customer && !THEMES[themeKey].free) setTheme(DEFAULT_THEME);
  }, [loading, customer, themeKey, setTheme]);

  // Listens to the customer's own document, so a suspension from the admin
  // portal takes effect straight away, without logging out and in again.
  const customerId = customer?.id;
  useEffect(() => {
    if (!customerId) return;
    return data.watchSuspension(customerId, setSuspended);
  }, [customerId]);

  const isSuspended = !!customer && suspended;

  const value = useMemo<Ctx>(() => ({
    customer, loading, favouriteIds, isSuspended,
    login: async (e, p) => start(await authService.login(e, p)),
    register: async (n, u, e, p) => start(await authService.register(n, u, e, p)),
    updatePhoto: async (dataUri) => {
      const url = await authService.updateProfilePhoto(dataUri);
      setCustomer((c) => (c ? { ...c, photoUrl: url } : c));
    },
    logout: () => { authService.logout(); setCustomer(null); setFavouriteIds([]); },
    toggleFavourite: async (id) => {
      if (!customer) return false;
      // Suspended customers may remove old saves, but not add new ones (same rule as firestore.rules).
      if (isSuspended && !favouriteIds.includes(id)) {
        showToast("Your account is suspended, so you can't save guesthouses.");
        return true;
      }
      try {
        const nowFav = await data.toggleFavourite(customer.id, id);
        setFavouriteIds((prev) => (nowFav ? [...prev, id] : prev.filter((x) => x !== id)));
        showToast(nowFav ? 'Saved to favourites' : 'Removed from saved');
      } catch {
        showToast('Could not save. Check your connection and try again.');
      }
      return true;
    },
  }), [customer, loading, favouriteIds, isSuspended, start, showToast]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const c = useContext(AuthContext);
  if (!c) throw new Error('useAuth must be used inside AuthProvider');
  return c;
};