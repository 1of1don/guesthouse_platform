import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { AuthContext } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<
    'loading' | 'authenticated' | 'unauthenticated' | 'error'
  >('loading');
  const [error, setError] = useState<string | null>(null);

  useEffect(
    () =>
      onAuthStateChanged(auth, async (user) => {
        setError(null);

        if (!user) {
          setStatus('unauthenticated');
          return;
        }

        try {
          const admin = await getDoc(doc(db, 'admins', user.uid));
          if (admin.exists()) {
            setStatus('authenticated');
          } else {
            await signOut(auth);
            setStatus('unauthenticated');
            setError('This account is not registered as an admin.');
          }
        } catch {
          setStatus('error');
          setError('Unable to verify admin access. Check your connection and try again.');
        }
      }),
    [],
  );

  const login = async (email: string, password: string) => {
    setError(null);
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const admin = await getDoc(doc(db, 'admins', user.uid));
      if (!admin.exists()) {
        await signOut(auth);
        throw new Error('This account is not registered as an admin.');
      }
      setStatus('authenticated');
    } catch (cause) {
      const code =
        typeof cause === 'object' && cause !== null && 'code' in cause
          ? String(cause.code)
          : '';
      const message =
        cause instanceof Error
          ? cause.message
          : 'Unable to sign in. Check your connection and try again.';
      const friendlyMessage =
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password'
          ? 'Email or password is incorrect.'
          : message;
      setError(friendlyMessage);
      setStatus('unauthenticated');
      throw new Error(friendlyMessage, { cause });
    }
  };

  const logout = async () => {
    await signOut(auth);
    setStatus('unauthenticated');
  };

  return (
    <AuthContext.Provider
      value={{
        status,
        error,
        login,
        logout,
        isAuthenticated: status === 'authenticated',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}