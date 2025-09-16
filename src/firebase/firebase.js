'use client';

import { useState, useEffect } from 'react';
import { database } from './config';
import { ref, set, onValue, update, remove } from 'firebase/database';

// Define the constant database path at the top level
const FIREBASE_DB_REF = 'user/profile';

/**
 * Saves/overwrites any JSON-compatible data to the predefined path in the Firebase Realtime Database.
 * @param {any} data - The data to save.
 * @returns {Promise<void>} A promise that resolves when the save is complete.
 */
export async function saveFirebaseData(data) {
  const dbRef = ref(database, FIREBASE_DB_REF);
  return set(dbRef, data);
}

/**
 * Updates data at the predefined path in the Firebase Realtime Database.
 * This performs a shallow update and does not overwrite the entire object.
 * @param {object} updates - An object containing the fields to update.
 * @returns {Promise<void>} A promise that resolves when the update is complete.
 */
export async function updateFirebaseData(updates) {
  const dbRef = ref(database, FIREBASE_DB_REF);
  return update(dbRef, updates);
}

/**
 * Deletes data from the Firebase Realtime Database.
 * If no path is provided, it deletes data at the default FIREBASE_DB_REF path.
 * @param {string} [path] - The optional path to delete data from.
 * @returns {Promise<void>} A promise that resolves when the deletion is complete.
 */
export async function deleteFirebaseData(path) {
  const finalPath = path || FIREBASE_DB_REF;
  const dbRef = ref(database, finalPath);
  return remove(dbRef);
}

/**
 * A React hook to subscribe to data at the predefined path in the Firebase Realtime Database.
 * @returns {{data: any, loading: boolean}} An object containing the data and a loading state.
 */
export function getFirebaseData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const dbRef = ref(database, FIREBASE_DB_REF);
    
    // onValue returns a function that can be called to unsubscribe
    const unsubscribe = onValue(dbRef, (snapshot) => {
      setData(snapshot.val());
      setLoading(false);
    }, (error) => {
      console.error("Firebase subscription error:", error);
      setLoading(false);
    });
    
    // Cleanup function to detach the listener when the component unmounts
    return () => {
      unsubscribe();
    };
  }, []); // Effect runs once on mount
  
  return { data, loading };
}
