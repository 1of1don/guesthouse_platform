// Holds "who is logged in" and their favourites, so any screen can read them.
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import * as authService from '../services/auth';
import * as data from '../services/guesthouses';
import { Customer } from '../types';

type AuthContextType = {
  customer: Customer | null;
  favouriteIds: string[];
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  // Returns false if nobody is logged in, so the screen can send them to log in.
  toggleFavourite: (guesthouseId: string) => Promise<boolean>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [favouriteIds, setFavouriteIds] = useState<string[]>([]);

  // Remember who they are and fetch their favourites.
  async function signedIn(c: Customer) {
    setCustomer(c);
    try {
      setFavouriteIds(await data.getFavouriteIds(c.id));
    } catch {
      setFavouriteIds([]); // favourites failing shouldn't block logging in
    }
  }

  // Runs on app start (picks up a saved login) and whenever someone logs in or out.
  useEffect(() => {
    return authService.onCustomerChanged((c) => {
      if (c) {
        signedIn(c);
      } else {
        setCustomer(null);
        setFavouriteIds([]);
      }
    });
  }, []);

  async function login(email: string, password: string) {
    signedIn(await authService.login(email, password));
  }

  async function register(name: string, email: string, password: string) {
    signedIn(await authService.register(name, email, password));
  }

  function logout() {
    authService.logout();
    setCustomer(null);
    setFavouriteIds([]);
  }

  async function toggleFavourite(guesthouseId: string) {
    if (!customer) return false;
    const isNowFavourite = await data.toggleFavourite(customer.id, guesthouseId);
    // Update the list on screen straight away instead of re-fetching.
    setFavouriteIds((current) =>
      isNowFavourite ? [...current, guesthouseId] : current.filter((id) => id !== guesthouseId),
    );
    return true;
  }

  return (
    <AuthContext.Provider value={{ customer, favouriteIds, login, register, logout, toggleFavourite }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth has to be used inside AuthProvider');
  return context;
}
