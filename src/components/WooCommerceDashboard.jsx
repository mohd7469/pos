import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { useStores } from '@/hooks/useStores';
import { useOrders } from '@/hooks/useOrders';
import { syncAllStores, exportOrdersToExcel, updateOrderStatusBatch } from '@/lib/woocommerce';
import DashboardHeader from '@/components/DashboardHeader';
import OrderStats from '@/components/OrderStats';
import FilterControls from '@/components/FilterControls';
import DashboardTabs from '@/components/DashboardTabs';
import StoreConnectionModal from '@/components/StoreConnectionModal';

const WooCommerceDashboard = () => {
  const { stores, addStore, updateStore, deleteStore, loadStoresFromStorage } = useStores();
  const { orders, setOrders, loadOrdersFromStorage, saveOrdersToStorage } = useOrders();
  
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUpdatingOrders, setIsUpdatingOrders] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  
  const { toast } = useToast();

  useEffect(() => {
    loadStoresFromStorage();
    loadOrdersFromStorage();
  }, [loadStoresFromStorage, loadOrdersFromStorage]);
  
  const sortedOrders = useMemo(() => {
      return [...orders].sort((a, b) => new Date(b.date_created) - new Date(a.date_created));
  }, [orders]);

  useEffect(() => {
    setFilteredOrders(sortedOrders);
  }, [sortedOrders]);

  const handleOpenStoreModal = (store = null) => {
    setEditingStore(store);
    setShowStoreModal(true);
  };
  
  const handleCloseStoreModal = () => {
    setEditingStore(null);
    setShowStoreModal(false);
  };

  const handleSaveStore = (storeData) => {
    if (editingStore) {
      updateStore(editingStore.id, storeData);
    } else {
      addStore(storeData);
    }
    handleCloseStoreModal();
  };
  
  const handleSync = async (storeId = null) => {
    setLoading(true);
    await syncAllStores({
      storeId,
      stores,
      setOrders,
      updateStore,
      toast,
    });
    setLoading(false);
  };

  const handleExport = () => {
    exportOrdersToExcel(filteredOrders, toast);
  };

  const handleUpdateOrders = async (ordersToUpdate, newStatus) => {
    setIsUpdatingOrders(true);
    await updateOrderStatusBatch({
        ordersToUpdate,
        newStatus,
        stores,
        toast,
    });

    // Optimistically update local state
    const updatedOrderIds = new Set(ordersToUpdate.map(o => o.id));
    const newOrders = orders.map(order => {
        if (updatedOrderIds.has(order.id)) {
            return { ...order, status: newStatus };
        }
        return order;
    });

    setOrders(newOrders);
    saveOrdersToStorage(newOrders);

    setIsUpdatingOrders(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardHeader
          onAddStore={() => handleOpenStoreModal()}
          onSync={handleSync}
          onExport={handleExport}
          loading={loading}
          storesCount={stores.length}
          ordersCount={filteredOrders.length}
        />

        <OrderStats orders={filteredOrders} />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <FilterControls
            orders={sortedOrders}
            stores={stores}
            onFilterChange={setFilteredOrders}
            filteredCount={filteredOrders.length}
          />

          <DashboardTabs
            stores={stores}
            orders={filteredOrders}
            loading={loading}
            onSync={handleSync}
            onAddStore={() => handleOpenStoreModal()}
            onEditStore={handleOpenStoreModal}
            onDeleteStore={deleteStore}
            onUpdateOrders={handleUpdateOrders}
            isUpdatingOrders={isUpdatingOrders}
          />

        </motion.div>
      </div>

      <StoreConnectionModal
        isOpen={showStoreModal}
        onClose={handleCloseStoreModal}
        onSaveStore={handleSaveStore}
        store={editingStore}
      />
    </div>
  );
};

export default WooCommerceDashboard;