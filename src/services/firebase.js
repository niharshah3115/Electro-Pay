import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  writeBatch 
} from 'firebase/firestore';
import { 
  getAuth, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

// Check if actual production Firebase credentials are provided in .env
export const isFirebaseConfigured = () => {
  const key = firebaseConfig.apiKey || '';
  const proj = firebaseConfig.projectId || '';
  return !!(
    key &&
    !key.toLowerCase().includes('dummy') &&
    !key.toLowerCase().includes('your_firebase') &&
    !proj.toLowerCase().includes('demo') &&
    !proj.toLowerCase().includes('electrotrack-app') &&
    key.length > 25
  );
};

// Safe Firebase App initialization
let appInstance = null;
let authInstance = null;
let dbInstance = null;

if (isFirebaseConfigured()) {
  try {
    appInstance = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    authInstance = getAuth(appInstance);
    dbInstance = getFirestore(appInstance);
  } catch (err) {
    console.warn('Firebase init fallback:', err.message);
  }
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;

export {
  // Auth exports
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,

  // Firestore exports
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch
};
