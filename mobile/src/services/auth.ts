// Firebase Authentication for customers. Same exports as the old mock,
// plus username + profile picture (stored in the customers/{uid} document).
import {
  createUserWithEmailAndPassword, onAuthStateChanged, sendPasswordResetEmail,
  signInWithEmailAndPassword, signOut, updateProfile, User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Customer } from '../types';

let registering = false; // pauses the listener so the new user's name is set first

const toCustomer = (u: User): Customer => ({
  id: u.uid,
  name: u.displayName ?? u.email?.split('@')[0] ?? 'Guest',
  email: u.email ?? '',
});

// Adds the username and picture, which live in Firestore rather than in Firebase Auth.
async function withProfile(u: User): Promise<Customer> {
  const base = toCustomer(u);
  try {
    const snap = await getDoc(doc(db, 'customers', u.uid));
    const d = snap.exists() ? snap.data() : {};
    return { ...base, username: d.username, photoUrl: d.photoUrl };
  } catch {
    return base; // offline: still log the person in, just without the extras
  }
}

function friendly(e: unknown): Error {
  const code = (e as { code?: string })?.code ?? '';
  const messages: Record<string, string> = {
    'auth/invalid-credential': 'Email or password is incorrect.',
    'auth/wrong-password': 'Email or password is incorrect.',
    'auth/user-not-found': 'Email or password is incorrect.',
    'auth/invalid-email': 'That email address does not look right.',
    'auth/missing-email': 'Enter your email address first.',
    'auth/email-already-in-use': 'An account with this email already exists. Log in instead.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/network-request-failed': 'No connection. Check your internet and try again.',
    'auth/too-many-requests': 'Too many attempts. Wait a moment and try again.',
    'permission-denied': 'You are not allowed to do that. Log in again and retry.',
    'unavailable': 'No connection. Check your internet and try again.',
    'invalid-argument': 'That picture is too large. Try a different one.',
  };
  return new Error(messages[code] ?? 'Something went wrong. Try again.');
}

export async function register(
  name: string, username: string, email: string, password: string,
): Promise<Customer> {
  if (!name.trim()) throw new Error('Enter your full name.');
  const uname = username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,20}$/.test(uname)) {
    throw new Error('Username must be 3–20 characters: letters, numbers or underscores.');
  }
  registering = true;
  try {
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName: name.trim() });
    await setDoc(doc(db, 'customers', cred.user.uid), {
      name: name.trim(), username: uname, email: email.trim(), createdAt: serverTimestamp(),
    });
    return { id: cred.user.uid, name: name.trim(), username: uname, email: email.trim() };
  } catch (e) {
    throw friendly(e);
  } finally {
    registering = false;
  }
}

export async function login(email: string, password: string): Promise<Customer> {
  try {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    return await withProfile(cred.user);
  } catch (e) {
    throw friendly(e);
  }
}

export const logout = () => signOut(auth);

// Restores the session on app start and reacts to log in / log out.
export function onCustomerChanged(cb: (c: Customer | null) => void) {
  return onAuthStateChanged(auth, async (u) => {
    if (registering) return;
    cb(u ? await withProfile(u) : null);
  });
}

// Saves a small (already resized) picture as a data URI on the customer's own
// document. No Firebase Storage needed, so it works on the free plan.
export async function updateProfilePhoto(dataUri: string): Promise<string> {
  const user = auth.currentUser;
  if (!user) throw new Error('Log in first.');
  try {
    await setDoc(doc(db, 'customers', user.uid), { photoUrl: dataUri }, { merge: true });
    return dataUri;
  } catch (e) {
    throw friendly(e);
  }
}

// Emails a reset link. Firebase answers the same way whether or not the address
// has an account, so this never reveals who is registered.
export async function resetPassword(email: string): Promise<void> {
  if (!email.trim()) throw new Error('Enter your email address first.');
  try {
    await sendPasswordResetEmail(auth, email.trim());
  } catch (e) {
    throw friendly(e);
  }
}