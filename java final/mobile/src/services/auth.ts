// Sign up, log in and log out for customers, using Firebase Authentication.
import {
  createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword,
  signOut, updateProfile, User,
} from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Customer } from '../types';

// Firebase error codes are ugly, so these are the plain-English versions.
const MESSAGES: Record<string, string> = {
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/invalid-email': 'That email address does not look right.',
  'auth/email-already-in-use': 'An account with this email already exists. Log in instead.',
  'auth/weak-password': 'Password must be at least 6 characters.',
  'auth/network-request-failed': 'No connection. Check your internet and try again.',
  'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
};

function friendly(e: unknown): Error {
  const code = (e as { code?: string })?.code ?? '';
  return new Error(MESSAGES[code] ?? 'Something went wrong. Try again.');
}

function toCustomer(user: User): Customer {
  return {
    id: user.uid,
    name: user.displayName ?? user.email?.split('@')[0] ?? 'Guest',
    email: user.email ?? '',
  };
}

// While signing up, the listener below would fire before we've saved the name.
// This flag tells it to wait.
let signingUp = false;

export async function register(name: string, email: string, password: string): Promise<Customer> {
  if (!name.trim()) throw new Error('Enter your full name.');

  signingUp = true;
  try {
    const result = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(result.user, { displayName: name.trim() });
    // Also keep a copy in Firestore so the customer shows up there.
    await setDoc(doc(db, 'customers', result.user.uid), {
      name: name.trim(),
      email: email.trim(),
      createdAt: serverTimestamp(),
    });
    return { id: result.user.uid, name: name.trim(), email: email.trim() };
  } catch (e) {
    throw friendly(e);
  } finally {
    signingUp = false;
  }
}

export async function login(email: string, password: string): Promise<Customer> {
  try {
    const result = await signInWithEmailAndPassword(auth, email.trim(), password);
    return toCustomer(result.user);
  } catch (e) {
    throw friendly(e);
  }
}

export function logout() {
  return signOut(auth);
}

// Calls back on app start (if someone is still logged in), and on every login or logout.
export function onCustomerChanged(callback: (customer: Customer | null) => void) {
  return onAuthStateChanged(auth, (user) => {
    if (signingUp) return;
    callback(user ? toCustomer(user) : null);
  });
}
