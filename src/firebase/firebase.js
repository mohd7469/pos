'use client';

import { useState, useEffect } from 'react';
import { database } from './config';
import { ref, set, onValue, update, remove } from 'firebase/database';

// Define the constant database path at the top level
const FIREBASE_DB_REF = 'gbox-admin';

/**
 * Constructs the final database path, safely handling an empty root path.
 * @param {string} [subPath] - The optional sub-path.
 * @returns {string} The final, valid database path.
 */
const getFinalPath = (subPath) => {
  let finalPath = '';
  if (FIREBASE_DB_REF && subPath) {
    finalPath = `${FIREBASE_DB_REF}/${subPath}`;
  } else {
    finalPath = subPath || FIREBASE_DB_REF;
  }
  // Ensure the path is never an empty string, default to root '/'
  return finalPath === '' ? '/' : finalPath;
};


/**
 * Saves/overwrites any JSON-compatible data to a specific path in the Firebase Realtime Database.
 * If no path is provided, it saves to the default FIREBASE_DB_REF path.
 * If a path is provided, it is appended to the default path (e.g., 'g-box-admin/new-path').
 * @param {any} data - The data to save.
 * @param {string} [path] - The optional sub-path to save data to.
 * @returns {Promise<void>} A promise that resolves when the save is complete.
 */
export async function saveFirebaseData(data, path) {
  const finalPath = getFinalPath(path);
  const dbRef = ref(database, finalPath);
  return set(dbRef, data);
}

/**
 * Updates data at a specific path in the Firebase Realtime Database.
 * If no path is provided, it updates at the default FIREBASE_DB_REF path.
 * If a path is provided, it is appended to the default path (e.g., 'g-box-admin/new-path').
 * @param {object} updates - An object containing the fields to update.
 * @param {string} [path] - The optional sub-path to update data at.
 * @returns {Promise<void>} A promise that resolves when the update is complete.
 */
export async function updateFirebaseData(updates, path) {
  const finalPath = getFinalPath(path);
  const dbRef = ref(database, finalPath);
  return update(dbRef, updates);
}

/**
 * Deletes data from the Firebase Realtime Database.
 * If no path is provided, it deletes data at the default FIREBASE_DB_REF path.
 * If a path is provided, it is appended to the default path (e.g., 'g-box-admin/new-path').
 * @param {string} [path] - The optional sub-path to delete data from.
 * @returns {Promise<void>} A promise that resolves when the deletion is complete.
 */
export async function deleteFirebaseData(path) {
  const finalPath = getFinalPath(path);
  const dbRef = ref(database, finalPath);
  return remove(dbRef);
}

/**
 * A React hook to subscribe to data in the Firebase Realtime Database.
 * If no path is provided, it subscribes to the default FIREBASE_DB_REF path.
 * If a path is provided, it is appended to the default path (e.g., 'g-box-admin/new-path').
 * @param {string} [path] - The optional sub-path to subscribe to.
 * @returns {{data: any, loading: boolean}} An object containing the data and a loading state.
 */
export function getFirebaseData(path) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const finalPath = getFinalPath(path);
  
  useEffect(() => {
    // Only proceed if finalPath is a non-empty string
    if (finalPath) {
      const dbRef = ref(database, finalPath);
      
      const unsubscribe = onValue(dbRef, (snapshot) => {
        setData(snapshot.val());
        setLoading(false);
      }, (error) => {
        console.error(`Firebase subscription error at path: ${finalPath}`, error);
        setLoading(false);
      });
      
      // Cleanup function to detach the listener
      return () => {
        unsubscribe();
      };
    } else {
      // If the path is invalid, don't attempt a subscription
      console.error("Firebase error: An invalid path was provided.");
      setLoading(false);
      setData(null);
    }
  }, [finalPath]); // Effect re-runs if the finalPath changes
  
  return { data, loading };
}
