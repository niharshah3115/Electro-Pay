import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  db,
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  isFirebaseConfigured,
} from '../services/firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => {
    // Check saved local session
    const saved = localStorage.getItem('electrotrack_session_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  const isCloud = isFirebaseConfigured() && !!auth;

  useEffect(() => {
    if (isCloud) {
      try {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            let businessName = user.displayName || user.email.split('@')[0];
            try {
              if (db) {
                const profileDoc = await getDoc(doc(db, 'distributors', user.uid));
                if (profileDoc.exists()) {
                  businessName = profileDoc.data().businessName || businessName;
                }
              }
            } catch (e) {
              console.warn(e);
            }

            const sessionUser = {
              uid: user.uid,
              email: user.email,
              displayName: businessName,
            };
            localStorage.setItem('electrotrack_session_user', JSON.stringify(sessionUser));
            setCurrentUser(sessionUser);
          } else {
            localStorage.removeItem('electrotrack_session_user');
            setCurrentUser(null);
          }
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        console.warn('onAuthStateChanged error fallback:', err);
        setLoading(false);
      }
    } else {
      const saved = localStorage.getItem('electrotrack_session_user');
      if (saved) {
        try {
          setCurrentUser(JSON.parse(saved));
        } catch (e) {
          setCurrentUser(null);
        }
      }
      setLoading(false);
    }
  }, [isCloud]);

  // Login
  const login = async (email, password) => {
    const cleanEmail = email.trim().toLowerCase();

    if (isCloud) {
      try {
        const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
        return cred.user;
      } catch (err) {
        // If Firebase API key not valid on live cloud, fallback to local auth
        if (err.code === 'auth/api-key-not-valid' || err.code === 'auth/invalid-api-key') {
          return localLogin(cleanEmail, password);
        }
        throw err;
      }
    } else {
      return localLogin(cleanEmail, password);
    }
  };

  const localLogin = (cleanEmail, password) => {
    const accounts = JSON.parse(localStorage.getItem('electrotrack_accounts') || '[]');
    let found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

    if (!found) {
      found = {
        uid: 'dist_' + Math.random().toString(36).substring(2, 9),
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0],
        passwordHash: btoa(password),
      };
      accounts.push(found);
      localStorage.setItem('electrotrack_accounts', JSON.stringify(accounts));
    } else if (found.passwordHash && found.passwordHash !== btoa(password)) {
      throw new Error('Incorrect password. Please try again.');
    }

    const sessionUser = { uid: found.uid, email: found.email, displayName: found.displayName };
    localStorage.setItem('electrotrack_session_user', JSON.stringify(sessionUser));
    setCurrentUser(sessionUser);
    return sessionUser;
  };

  // Sign up
  const signup = async (email, password, businessName = '') => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = businessName.trim() || cleanEmail.split('@')[0];

    if (isCloud) {
      try {
        const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
        const user = cred.user;

        try {
          await updateProfile(user, { displayName: cleanName });
        } catch (e) {
          console.warn(e);
        }

        try {
          if (db) {
            await setDoc(doc(db, 'distributors', user.uid), {
              businessName: cleanName,
              email: user.email,
              defaultCreditDays: 39,
              createdAt: serverTimestamp(),
            });
          }
        } catch (e) {
          console.warn(e);
        }

        return user;
      } catch (err) {
        if (err.code === 'auth/api-key-not-valid' || err.code === 'auth/invalid-api-key') {
          return localSignup(cleanEmail, password, cleanName);
        }
        throw err;
      }
    } else {
      return localSignup(cleanEmail, password, cleanName);
    }
  };

  const localSignup = (cleanEmail, password, cleanName) => {
    const accounts = JSON.parse(localStorage.getItem('electrotrack_accounts') || '[]');
    const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

    if (existing) {
      // Auto-log in if account exists
      const sessionUser = { uid: existing.uid, email: existing.email, displayName: existing.displayName || cleanName };
      localStorage.setItem('electrotrack_session_user', JSON.stringify(sessionUser));
      setCurrentUser(sessionUser);
      return sessionUser;
    }

    const newAccount = {
      uid: 'dist_' + Math.random().toString(36).substring(2, 9),
      email: cleanEmail,
      displayName: cleanName,
      passwordHash: btoa(password),
    };

    accounts.push(newAccount);
    localStorage.setItem('electrotrack_accounts', JSON.stringify(accounts));

    const sessionUser = { uid: newAccount.uid, email: newAccount.email, displayName: newAccount.displayName };
    localStorage.setItem('electrotrack_session_user', JSON.stringify(sessionUser));
    setCurrentUser(sessionUser);
    return sessionUser;
  };

  // Logout
  const logout = async () => {
    if (isCloud) {
      try {
        await firebaseSignOut(auth);
      } catch (e) {
        console.warn(e);
      }
    }
    localStorage.removeItem('electrotrack_session_user');
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    isAuthenticated: !!currentUser,
    isCloudConnected: isCloud,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
