'use client';

import { useState, useEffect } from 'react';
import { database } from './config';
import { ref, set, onValue, update, remove } from 'firebase/database';

const FIREBASE_ADMIN_REF = 'gbox-admin';
const FIREBASE_LOCALHOST_REF = 'syncedStorage';

/**
 * Constructs the final database path, safely handling an empty root path.
 * @param {string} [subPath] - The optional sub-path.
 * @returns {string} The final, valid database path.
 */
const getFinalPath = (subPath) => {
  const isLocalhost = typeof window !== 'undefined' && window.location.hostname === 'localhost';
  const basePath = isLocalhost ? FIREBASE_LOCALHOST_REF : FIREBASE_ADMIN_REF;
  
  let finalPath = '';
  if (basePath && subPath) {
    finalPath = `${basePath}/${subPath}`;
  } else {
    finalPath = subPath || basePath;
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
  // console.log('firebase payload:', typeof data, data)
  return set(dbRef, JSON.stringify(data));
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
  return update(dbRef, JSON.stringify(updates));
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
  
  const readPath = path ? `${FIREBASE_ADMIN_REF}/${path}` : FIREBASE_ADMIN_REF;
  
  useEffect(() => {
    // Only proceed if the path is non-empty
    if (readPath) {
      const dbRef = ref(database, readPath);
      
      const unsubscribe = onValue(dbRef, (snapshot) => {
        const res = JSON.parse(snapshot.val());
        console.info(`Syncing.. ${readPath}`);
        // console.info(typeof res);
        console.info('\n');
        setData(res);
        setLoading(false);
      }, (error) => {
        console.error(`Firebase subscription error at path: ${readPath}`, error);
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
  }, [readPath]); // re-runs if the Path changes
  
  return { data, loading, setLoading };
}
