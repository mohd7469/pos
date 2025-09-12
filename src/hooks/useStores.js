import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';

const STORES_STORAGE_KEY = 'woocommerce_stores';

export const useStores = () => {
  const [stores, setStores] = useState([]);
  const { toast } = useToast();

  const loadStoresFromStorage = useCallback(() => {
    try {
      const savedStores = localStorage.getItem(STORES_STORAGE_KEY);
      if (savedStores) {
        setStores(JSON.parse(savedStores));
      }
    } catch (error) {
      console.error("Failed to load stores from local storage", error);
    }
  }, []);

  const saveStoresToStorage = useCallback((newStores) => {
    try {
      localStorage.setItem(STORES_STORAGE_KEY, JSON.stringify(newStores));
    } catch (error) {
      console.error("Failed to save stores to local storage", error);
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
    toast({
      title: "Store Added!",
      description: `${storeData.name} has been successfully added.`
    });
  }, [saveStoresToStorage, toast]);

  const updateStore = useCallback((storeId, updates) => {
    setStores(prevStores => {
      const storeExists = prevStores.some(s => s.id === storeId);
      if (!storeExists) return prevStores;
      
      const updatedStores = prevStores.map(s => 
        s.id === storeId ? { ...s, ...updates } : s
      );
      saveStoresToStorage(updatedStores);
      toast({
        title: "Store Updated!",
        description: `Your store details have been saved.`
      });
      return updatedStores;
    });
  }, [saveStoresToStorage, toast]);

  const deleteStore = useCallback((storeId) => {
    setStores(prevStores => {
        const storeToDelete = prevStores.find(s => s.id === storeId);
        if (!storeToDelete) return prevStores;

        const updatedStores = prevStores.filter(s => s.id !== storeId);
        saveStoresToStorage(updatedStores);
        toast({
            title: "Store Deleted",
            description: `${storeToDelete.name} has been removed.`,
            variant: "destructive"
        });
        return updatedStores;
    });
  }, [saveStoresToStorage, toast]);

  return { stores, setStores, loadStoresFromStorage, saveStoresToStorage, addStore, updateStore, deleteStore };
};