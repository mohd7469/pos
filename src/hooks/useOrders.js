import { useState, useCallback } from 'react';

const ORDERS_STORAGE_KEY = 'woocommerce_orders';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);

  const loadOrdersFromStorage = useCallback(() => {
    try {
      const savedOrders = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (savedOrders) {
        setOrders(JSON.parse(savedOrders));
      }
    } catch (error) {
      console.error("Failed to load orders from local storage", error);
    }
  }, []);

  const saveOrdersToStorage = useCallback((newOrders) => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(newOrders));
    } catch (error) {
      console.error("Failed to save orders to local storage", error);
    }
  }, []);

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

  return { orders, setOrders, loadOrdersFromStorage, saveOrdersToStorage, updateOrdersForStore };
};