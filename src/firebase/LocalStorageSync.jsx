'use client';

import { useEffect, useRef, useState } from 'react';
import { database } from '@/lib/firebase';
import { ref, onValue, set, get } from 'firebase/database';

const FIREBASE_DB_REF = 'syncedStorage';
const SYNC_PREFIX = 'app-';

export function LocalStorageSync() {
  const [isAdmin, setIsAdmin] = useState(false);
  const isHandlingFirebaseUpdate = useRef(false);
  
  useEffect(() => {
    // This code now runs only on the client, so window is available.
    const adminHosts = ['pos.pharmilow.com', 'localhost'];
    const adminCheck = adminHosts.includes(window.location.hostname);
    // use window.location.host to exact determine localhost and not just sync all localhost
    const local = ['localhost:5173'];
    const localCheck = local.includes(window.location.host);
    const isAllowed = localCheck || adminCheck;
    setIsAdmin(isAllowed);
  }, []);
  
  // Combined Sync Logic: Only runs for Admins
  useEffect(() => {
    if (!isAdmin) return;
    
    // --- Sync from Firebase to Local Storage (for Admins) ---
    const dbRef = ref(database, FIREBASE_DB_REF);
    
    const handleFirebaseSnapshot = (snapshot) => {
      const remoteData = snapshot.val() || {};
      isHandlingFirebaseUpdate.current = true;
      try {
        Object.keys(remoteData).forEach(prefixedKey => {
          if (prefixedKey.startsWith(SYNC_PREFIX)) {
            const unprefixedKey = prefixedKey.substring(SYNC_PREFIX.length);
            const remoteValue = remoteData[prefixedKey];
            const localValue = localStorage.getItem(unprefixedKey);
            
            if (localValue !== remoteValue) {
              if (remoteValue === null) {
                localStorage.removeItem(unprefixedKey);
              } else {
                localStorage.setItem(unprefixedKey, remoteValue);
              }
              window.dispatchEvent(new StorageEvent('storage', {
                key: unprefixedKey,
                newValue: remoteValue,
                storageArea: localStorage,
              }));
            }
          }
        });
      } finally {
        setTimeout(() => {
          isHandlingFirebaseUpdate.current = false;
        }, 0);
      }
    };
    
    get(dbRef).then(handleFirebaseSnapshot); // Initial sync from Firebase
    const firebaseListener = onValue(dbRef, handleFirebaseSnapshot);
    
    
    // --- Sync from Local Storage to Firebase (for Admins) ---
    const handleStorageChange = (event) => {
      if (isHandlingFirebaseUpdate.current) {
        return;
      }
      
      // Filter out internal Firebase keys and ensure a key exists
      if (event.key && !event.key.startsWith('firebase:')) {
        const prefixedKey = SYNC_PREFIX + event.key;
        const keyRef = ref(database, `${FIREBASE_DB_REF}/${prefixedKey}`);
        set(keyRef, event.newValue);
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Initial sync on becoming admin: Push all relevant LS values to Firebase.
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Only sync keys that are not internal to Firebase.
      if (key && !key.startsWith('firebase:')) {
        const value = localStorage.getItem(key);
        const prefixedKey = SYNC_PREFIX + key;
        const keyRef = ref(database, `${FIREBASE_DB_REF}/${prefixedKey}`);
        set(keyRef, value);
      }
    }
    
    // Cleanup function
    return () => {
      firebaseListener(); // Detach Firebase listener
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isAdmin]); // This entire block depends on the isAdmin state
  
  return null;
}
