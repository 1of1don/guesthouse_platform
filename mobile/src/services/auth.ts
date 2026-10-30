// Firebase Authentication for customers. Same exports as the old mock.
import {
  createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword,
  signOut, updateProfile, User,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Customer } from '../types';

let registering = false; // pauses the listener so the new user's name is set first

const toCustomer = (u: User): Customer => ({
  id: u.uid,
  name: u.displayName ?? u.email?.split('@')[0] ?? 'Guest',
  email: u.email ?? '',
});

function friendly(e: unknown): Error {
  const code = (e as { code?: string })?.code ?? '';
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/wrong-password': 'Email or password is incorrect.',
    'auth/user-not-found': 'Email or password is incorrect.',
    'auth/invalid-email': 'That email address does not look right.',
    'auth/email-already-in-use': 'An account with this email already exists. Log in instead.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/network-request-failed': 'No connection. Check your internet and try again.',
    'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
  };
  return new Error(messages[code] ?? 'Something went wrong. Try again.');
}

export async function register(name: string, email: string, password: string): Promise<Customer> {
  if (!name.trim()) throw new Error('Enter your full name.');
  registering = true;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName: name.trim() });
    await setDoc(doc(db, 'customers', cred.user.uid), {
      name: name.trim(), email: email.trim(), createdAt: serverTimestamp(),
    });
    return { id: cred.user.uid, name: name.trim(), email: email.trim() };
  } catch (e) {
    throw friendly(e);
  } finally {
    registering = false;
  }
}

export async function login(email: string, password: string): Promise<Customer> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return toCustomer(cred.user);
  } catch (e) {
    throw friendly(e);
  }
}

export const logout = () => signOut(auth);

// Restores the session on app start and reacts to log in / log out.
export function onCustomerChanged(cb: (c: Customer | null) => void) {
  return onAuthStateChanged(auth, (u) => {
    if (registering) return;
    cb(u ? toCustomer(u) : null);
  });
}
