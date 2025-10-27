import { initializeApp, getApps } from "firebase/app";
import { 
  getAuth, 
  initializeAuth,
  getReactNativePersistence,
  signInAnonymously as firebaseSignInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  User,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

let app;
let auth;
let isConfigured = false;

function isFirebaseConfigured(): boolean {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
}

export function initializeFirebase() {
  if (!isFirebaseConfigured()) {
    console.warn(
      "⚠️  Firebase is not configured. Authentication will be disabled.\n" +
      "To enable authentication, add Firebase configuration to your .env file.\n" +
      "See AUTHENTICATION_SETUP.md for instructions."
    );
    isConfigured = false;
    return { app: null, auth: null };
  }

  if (getApps().length === 0) {
    app = initializeApp(firebaseConfig);
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } else {
    app = getApps()[0];
    auth = getAuth(app);
  }
  isConfigured = true;
  return { app, auth };
}

export function getFirebaseAuth() {
  if (!auth && !isConfigured) {
    initializeFirebase();
  }
  return auth ?? null;
}

export function isAuthEnabled(): boolean {
  return isConfigured;
}

export async function signInAnonymously(): Promise<User | null> {
  const auth = getFirebaseAuth();
  if (!auth) {
    console.warn("Firebase not configured, skipping sign-in");
    return null;
  }
  const result = await firebaseSignInAnonymously(auth);
  return result.user;
}

export async function signOut(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await firebaseSignOut(auth);
}

export function onAuthStateChanged(callback: (user: User | null) => void) {
  const auth = getFirebaseAuth();
  if (!auth) {
    // If Firebase isn't configured, immediately call callback with null
    callback(null);
    return () => {}; // Return empty unsubscribe function
  }
  return firebaseOnAuthStateChanged(auth, callback);
}

export async function getCurrentUserToken(): Promise<string | null> {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  
  const user = auth.currentUser;
  if (!user) {
    return null;
  }
  return user.getIdToken();
}


