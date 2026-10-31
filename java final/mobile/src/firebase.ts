// Connects the app to our Firebase project. The keys live in the .env file,
// so nothing secret is written in the code.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, initializeAuth } from 'firebase/auth';
// @ts-ignore (this function exists on phones but the type file leaves it out)
import { getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const config = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

// Fail early with a clear message if the .env file is missing.
if (!config.apiKey || !config.projectId) {
  throw new Error('Firebase keys are missing. Create the .env file, then run: npx expo start -c');
}

const app = getApps().length ? getApp() : initializeApp(config);

// The AsyncStorage part keeps people logged in after they close the app.
let auth: Auth;
try {
  auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
} catch {
  // Happens on a hot reload, when auth was already set up. Just reuse it.
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
