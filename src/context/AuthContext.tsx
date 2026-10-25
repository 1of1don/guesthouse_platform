// ==============================================================================
// AUTHENTICATION CONTEXT (LOG IN, LOG OUT & ADMIN SESSIONS)
// ==============================================================================
// This file manages who is currently logged in to the admin portal.
// It provides:
// 1. A global 'user' state (name, email, role like 'Owner' or 'Admin')
// 2. 'login': signs in with email/password via Firebase Auth
// 4. 'logout': clears the session and returns to the login screen
// ==============================================================================

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  type User,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../firebase';
import { AuthContext, type AuthUser } from './auth-context';
import type { AdminRole } from '../types';

const DEMO_SESSION_KEY = 'micasa_auth_session';
const FIREBASE_REQUEST_TIMEOUT_MS = 15000;

async function withFirebaseTimeout<T>(request: Promise<T>): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      request,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error('Firebase is taking too long to respond. Check your connection and try again.')),
          FIREBASE_REQUEST_TIMEOUT_MS,
        );
      }),
    ]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}

function getAuthErrorMessage(error: unknown): string {
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String(error.code)
      : '';

  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Incorrect email or password.';
    case 'auth/invalid-email':
      return 'Enter a valid email address.';
    case 'auth/too-many-requests':
      return 'Too many sign-in attempts. Try again later.';
    case 'auth/network-request-failed':
      return 'Unable to connect to Firebase. Check your internet connection.';
    default:
      return error instanceof Error ? error.message : 'Unable to sign in.';
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<
    'loading' | 'authenticated' | 'unauthenticated' | 'error'
  >('loading');
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const adminLookups = useRef(new Map<string, Promise<AuthUser>>());

  useEffect(() => {
    // Remove any session created by the former demo-only authentication flow.
    localStorage.removeItem(DEMO_SESSION_KEY);

    if (!isFirebaseConfigured || !auth) {
      setError('Firebase Authentication is not configured. Check the VITE_FIREBASE_* settings.');
      setStatus('unauthenticated');
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setStatus('unauthenticated');
        return;
      }

      try {
        if (!db) {
          throw new Error('Firebase Firestore is not configured, so admin access cannot be verified.');
        }

        const admin = await getAuthorizedAdmin(fbUser);
        setUser(admin);
        setError(null);
        setStatus('authenticated');
      } catch (cause) {
        try {
          await signOut(auth);
        } catch (signOutCause) {
          console.error('Unable to sign out unauthorized Firebase user:', signOutCause);
        }
        setUser(null);
        setError(
          cause instanceof Error
            ? cause.message
            : 'Unable to verify administrative access.',
        );
        setStatus('unauthenticated');
      }
    });

    return () => unsubscribe();
  }, []);

  const getAuthorizedAdmin = async (firebaseUser: User): Promise<AuthUser> => {
    if (!db) {
      throw new Error('Firebase Firestore is not configured, so admin access cannot be verified.');
    }

    const existingLookup = adminLookups.current.get(firebaseUser.uid);
    if (existingLookup) return existingLookup;

    const lookup = (async (): Promise<AuthUser> => {
      const adminDoc = await withFirebaseTimeout(
        getDoc(doc(db, 'admins', firebaseUser.uid)),
      );
      if (!adminDoc.exists()) {
        throw new Error('This account is not registered as an authorized guesthouse admin.');
      }

      const data = adminDoc.data();
      const roleValue = typeof data.role === 'string' ? data.role.trim().toLowerCase() : '';
      const role: AdminRole | null =
        roleValue === 'owner' ? 'Owner' : roleValue === 'admin' ? 'Admin' : null;
      if (!role) {
        throw new Error('This admin account role must be "Owner" or "Admin". Update the role field in Firestore.');
      }

      return {
        uid: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: data.name || firebaseUser.displayName || 'Admin Member',
        role,
      };
    })();

    adminLookups.current.set(firebaseUser.uid, lookup);
    try {
      return await lookup;
    } finally {
      if (adminLookups.current.get(firebaseUser.uid) === lookup) {
        adminLookups.current.delete(firebaseUser.uid);
      }
    }
  };

  const login = async (email: string, pass: string) => {
    setError(null);
    if (!isFirebaseConfigured || !auth) {
      throw new Error('Firebase Authentication is not configured. Check the VITE_FIREBASE_* settings.');
    }

    let firebaseUser: User;
    try {
      const credential = await withFirebaseTimeout(
        signInWithEmailAndPassword(auth, email, pass),
      );
      firebaseUser = credential.user;
    } catch (cause) {
      const message = getAuthErrorMessage(cause);
      setError(message);
      throw new Error(message);
    }

    try {
      const admin = await getAuthorizedAdmin(firebaseUser);
      setUser(admin);
      setError(null);
      setStatus('authenticated');
    } catch (cause) {
      try {
        await signOut(auth);
      } catch (signOutCause) {
        console.error('Unable to sign out unauthorized Firebase user:', signOutCause);
      }
      const message =
        cause instanceof Error
          ? cause.message
          : 'Unable to verify administrative access.';
      setUser(null);
      setError(message);
      setStatus('unauthenticated');
      throw new Error(message);
    }
  };

  const logout = async () => {
    localStorage.removeItem(DEMO_SESSION_KEY);
    setError(null);
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
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
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
