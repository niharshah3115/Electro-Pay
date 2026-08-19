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

// Firebase configuration from environment variables with production fallbacks
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyD2_ZQ4RzjfiLAFdwSln3p0iAveVwRQoFA',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'electro-pay-bc98c.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'electro-pay-bc98c',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'electro-pay-bc98c.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '622092908847',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:622092908847:web:9820780204ee809c01c9da'
};

// Check if actual production Firebase credentials are provided
export const isFirebaseConfigured = () => {
  const key = firebaseConfig.apiKey || '';
  return !!(
    key &&
    !key.toLowerCase().includes('dummy') &&
    !key.toLowerCase().includes('your_firebase') &&
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
