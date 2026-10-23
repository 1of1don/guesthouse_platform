// ==============================================================================
// AUTHENTICATION CONTEXT (LOG IN, LOG OUT & ADMIN SESSIONS)
// ==============================================================================
// This file manages who is currently logged in to the admin portal.
// It provides:
// 1. A global 'user' state (name, email, role like 'Owner' or 'Admin')
// 2. 'login': signs in with email/password via Firebase Auth or Demo Mode
// 3. 'loginAsDemoAdmin': 1-click sign in for "Ontiretse Bagwasi" during presentations
// 4. 'logout': clears the session and returns to the login screen
// ==============================================================================

import { useEffect, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase';
import { AuthContext, type AuthUser } from './auth-context';
import type { AdminRole } from '../types';

// Key used to keep the user logged in across page reloads in the browser
const DEMO_SESSION_KEY = 'micasa_auth_session';

export function AuthProvider({ children }: { children: ReactNode }) {
  // Current login status: 'loading' while checking, 'authenticated' if logged in
  const [status, setStatus] = useState<
    'loading' | 'authenticated' | 'unauthenticated' | 'error'
  >('loading');
  
  // Stores the active user profile (name, email, role)
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ----------------------------------------------------------------------------
  // Check on app load if the user is already logged in
  // ----------------------------------------------------------------------------
  useEffect(() => {
    // 1. First, check browser local storage for an active session
    const saved = localStorage.getItem(DEMO_SESSION_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
        setStatus('authenticated');
        return;
      } catch {
        localStorage.removeItem(DEMO_SESSION_KEY);
      }
    }

    // 2. If no live Firebase is set up, start as unauthenticated (shows login page)
    if (!isFirebaseConfigured || !auth) {
      setStatus('unauthenticated');
      return;
    }

    // 3. If Firebase is active, listen for real authentication events
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      setError(null);
      if (!fbUser) {
        setUser(null);
        setStatus('unauthenticated');
        return;
      }

      try {
        // Verify user exists in the Firestore 'admins' collection
        if (db) {
          const adminDoc = await getDoc(doc(db, 'admins', fbUser.uid));
          if (adminDoc.exists()) {
            const data = adminDoc.data();
            const authUserData: AuthUser = {
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: data.name || fbUser.displayName || 'Admin Member',
              role: (data.role as AdminRole) || 'Admin',
            };
            setUser(authUserData);
            setStatus('authenticated');
          } else {
            await signOut(auth);
            setUser(null);
            setStatus('unauthenticated');
            setError('This account is not registered as an authorized guesthouse admin.');
          }
        } else {
          setUser({
            uid: fbUser.uid,
            email: fbUser.email || '',
            displayName: fbUser.displayName || 'Admin Member',
            role: 'Admin',
          });
          setStatus('authenticated');
        }
      } catch (cause) {
        console.warn('Admin check error:', cause);
        setUser({
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: 'Admin Member',
          role: 'Admin',
        });
        setStatus('authenticated');
      }
    });

    return () => unsubscribe();
  }, []);

  // ----------------------------------------------------------------------------
  // Standard Login Function (Email & Password)
  // ----------------------------------------------------------------------------
  const login = async (email: string, pass: string) => {
    setError(null);
    if (isFirebaseConfigured && auth) {
      try {
        await signInWithEmailAndPassword(auth, email, pass);
        return;
      } catch (err: any) {
        console.warn('Firebase login failed:', err);
        throw new Error(err.message || 'Unable to sign in with provided credentials.');
      }
    } else {
      // Demo authentication: logs in as Ontiretse Bagwasi
      const demoUser: AuthUser = {
        uid: 'admin-ontiretse',
        email: email || 'onty@micasa.com',
        displayName: 'Ontiretse Bagwasi',
        role: 'Owner',
      };
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoUser));
      setUser(demoUser);
      setStatus('authenticated');
    }
  };

  // ----------------------------------------------------------------------------
  // 1-Click Demo Login Function (Used for quick presentations)
  // ----------------------------------------------------------------------------
  const loginAsDemoAdmin = async (role: AdminRole = 'Owner') => {
    setError(null);
    const demoUser: AuthUser = {
      uid: 'admin-ontiretse',
      email: 'onty@micasa.com',
      displayName: 'Ontiretse Bagwasi',
      role,
    };
    localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(demoUser));
    setUser(demoUser);
    setStatus('authenticated');
  };

  // ----------------------------------------------------------------------------
  // Logout Function
  // ----------------------------------------------------------------------------
  const logout = async () => {
    localStorage.removeItem(DEMO_SESSION_KEY);
    if (isFirebaseConfigured && auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('SignOut error:', err);
      }
    }
    setUser(null);
    setStatus('unauthenticated');
  };

  const clearError = () => setError(null);

  // Return the provider wrapping the entire app
  return (
    <AuthContext.Provider
      value={{
        status,
        isAuthenticated: status === 'authenticated',
        user,
        error,
        login,
        loginAsDemoAdmin,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
