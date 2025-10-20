import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const AuthContext = createContext({ user: null, role: null, profile: null, loading: true });

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u || null);
      if (u) {
        try {
          const userRef = doc(db, 'users', u.uid);
          const snap = await getDoc(userRef);
          if (snap.exists()) {
            const data = snap.data();
            setProfile(data);
            setRole(data.role || 'user');
          } else {
            const defaultProfile = { role: 'user', email: u.email ?? null, displayName: u.displayName ?? null };
            await setDoc(userRef, defaultProfile, { merge: true });
            setProfile(defaultProfile);
            setRole('user');
          }
        } catch (e) {
          console.warn('AuthContext role fetch error', e);
          setRole('user');
        }
      } else {
        setProfile(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const value = { user, role, profile, loading };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);