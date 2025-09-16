import { useState, useCallback, useEffect } from 'react';
import { saveFirebaseData, getFirebaseData } from '../firebase/firebase.js';

const ORDERS_PATH = 'woocommerce_orders';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  
  // Load orders from Firebase (gbox-admin/woocommerce_orders)
  const { data } = getFirebaseData(ORDERS_PATH);
  
  useEffect(() => {
    if (data) {
      setOrders(data); // ✅ since you said "save as it is", data = orders array
    }
  }, [data]);
  
  // Save orders to Firebase
  const saveOrdersToStorage = useCallback((newOrders) => {
    try {
      saveFirebaseData(newOrders, ORDERS_PATH);
    } catch (error) {
      console.error("Failed to save orders to Firebase", error);
    }
  }, []);

  // Update orders per store
  const updateOrdersForStore = useCallback((storeId, storeOrders, storeData) => {
    const processedOrders = storeOrders.map(order => ({
      ...order,
      store_name: storeData.name,
      store_id: storeData.id,
      store_url: storeData.url
    }));

    setOrders(prevOrders => {
      const otherStoresOrders = prevOrders.filter(o => o.store_id !== storeId);
      const updatedOrders = [...otherStoresOrders, ...processedOrders];
      saveOrdersToStorage(updatedOrders);
      return updatedOrders;
    });
  }, [saveOrdersToStorage]);

  return { orders, setOrders, saveOrdersToStorage, updateOrdersForStore };
};