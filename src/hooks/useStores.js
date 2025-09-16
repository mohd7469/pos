import { useState, useCallback, useEffect } from 'react';
import { saveFirebaseData, getFirebaseData } from '../firebase/firebase';
import { notifySuccess, notifyError } from '../utils/toast';

const STORES_PATH = 'woocommerce_stores';

export const useStores = () => {
  const [stores, setStores] = useState([]);
  
  // Load stores from Firebase
  const { data } = getFirebaseData(STORES_PATH);
  
  useEffect(() => {
    if (data) {
      setStores(data); // ✅ saving as array directly
    }
  }, [data]);
  
  // Save stores to Firebase
  const saveStoresToStorage = useCallback((newStores) => {
    try {
      saveFirebaseData(newStores, STORES_PATH);
    } catch (error) {
      console.error("Failed to save stores to Firebase", error);
      notifyError("Failed to save stores");
    }
  }, []);

  const addStore = useCallback((storeData) => {
    const newStore = {
      id: Date.now().toString(),
      ...storeData,
      connected: true,
      lastSync: null
    };
    setStores(prevStores => {
      const updatedStores = [...prevStores, newStore];
      saveStoresToStorage(updatedStores);
      return updatedStores;
    });
    notifySuccess(`${storeData.name} has been successfully added.`);
  }, [saveStoresToStorage]);

  const updateStore = useCallback((storeId, updates) => {
    setStores(prevStores => {
      const storeExists = prevStores.some(s => s.id === storeId);
      if (!storeExists) return prevStores;
      
      const updatedStores = prevStores.map(s =>
        s.id === storeId ? { ...s, ...updates } : s
      );
      saveStoresToStorage(updatedStores);
      notifySuccess("Store details updated.");
      return updatedStores;
    });
  }, [saveStoresToStorage]);

  const deleteStore = useCallback((storeId) => {
    setStores(prevStores => {
      const storeToDelete = prevStores.find(s => s.id === storeId);
      if (!storeToDelete) return prevStores;

      const updatedStores = prevStores.filter(s => s.id !== storeId);
      saveStoresToStorage(updatedStores);
      notifyError(`${storeToDelete.name} has been removed.`);
      return updatedStores;
    });
  }, [saveStoresToStorage]);

  return { stores, setStores, saveStoresToStorage, addStore, updateStore, deleteStore };
};