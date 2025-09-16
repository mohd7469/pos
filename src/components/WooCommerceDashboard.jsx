
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useStores } from '@/hooks/useStores';
import { useOrders } from '@/hooks/useOrders';
import { syncAllStores, exportOrdersToExcel, updateOrderStatusBatch, updateOrderDetails } from '@/lib/woocommerce';
import DashboardHeader from '@/components/DashboardHeader';
import OrderStats from '@/components/OrderStats';
import FilterControls from '@/components/FilterControls';
import DashboardTabs from '@/components/DashboardTabs';
import StoreConnectionModal from '@/components/StoreConnectionModal';
import { saveFirebaseData, getFirebaseData } from '../firebase/firebase.js';

const defaultScreenOptions = {
    itemsPerPage: 20,
    visibleColumns: {
        order: true,
        date: true,
        status: true,
        billing: true,
        shipping: true,
        items: true,
        payment: true,
        total: true,
        actions: true,
    }
};

const SCREEN_OPTIONS_PATH = 'screenOptions';

const WooCommerceDashboard = () => {
  const { stores, addStore, updateStore, deleteStore } = useStores();
  const { orders, setOrders, saveOrdersToStorage } = useOrders();
  
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [isUpdatingOrders, setIsUpdatingOrders] = useState(false);
  const [isUpdatingDetails, setIsUpdatingDetails] = useState(false);
  const [showStoreModal, setShowStoreModal] = useState(false);
  const [editingStore, setEditingStore] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const { data, loading, setLoading } = getFirebaseData(SCREEN_OPTIONS_PATH);
  const [screenOptions, setScreenOptions] = useState(() => {
    return data || defaultScreenOptions;
  });
  
  useEffect(() => {
    if (data) {
      setScreenOptions(data);
    }
  }, [data]);
  
  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => new Date(b.date_created) - new Date(a.date_created));
  }, [orders]);

  useEffect(() => {
    setFilteredOrders(sortedOrders);
    setSelectedRows(new Set());
  }, [sortedOrders]);

  const handleScreenOptionsChange = (key, value) => {
    const newOptions = { ...screenOptions, [key]: value };
    setScreenOptions(newOptions);
    saveFirebaseData(newOptions, SCREEN_OPTIONS_PATH);
  };

  const handleOpenStoreModal = (store = null) => {
    setEditingStore(store);
    setShowStoreModal(true);
  };
  
  const handleOpenCSR = () => {
    window.open("https://csr.pharmilow.com", "_blank");
  };
  
  const handleOpenWhatsapp = () => {
    window.open("https://wa.pharmilow.com", "_blank");
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
    });
    setLoading(false);
  };

  const handleExport = () => {
    let ordersToExport;
    if (selectedRows.size > 0) {
      const selectedOrderKeys = Array.from(selectedRows);
      ordersToExport = sortedOrders.filter(order => selectedOrderKeys.includes(`${order.store_id}-${order.id}`));
    } else {
      ordersToExport = filteredOrders;
    }
    
    exportOrdersToExcel(ordersToExport, screenOptions.visibleColumns);
  };

  const handleUpdateOrders = async (ordersToUpdate, newStatus) => {
    setIsUpdatingOrders(true);
    await updateOrderStatusBatch({
        ordersToUpdate,
        newStatus,
        stores,
    });

    const updatedOrderIds = new Set(ordersToUpdate.map(o => o.id));
    const newOrders = orders.map(order => {
        if (updatedOrderIds.has(order.id)) {
            return { ...order, status: newStatus };
        }
        return order;
    });

    setOrders(newOrders);
    saveOrdersToStorage(newOrders);
    setSelectedRows(new Set());
    setIsUpdatingOrders(false);
  };

  const handleUpdateOrderDetails = async (storeId, orderId, data) => {
    setIsUpdatingDetails(true);
    try {
        const updatedOrder = await updateOrderDetails({
            storeId,
            orderId,
            data,
            stores,
        });

        const newOrders = orders.map(order => {
            if (order.id === orderId) {
                // Merge existing order data with updated data
                return { ...order, ...updatedOrder };
            }
            return order;
        });

        setOrders(newOrders);
        saveOrdersToStorage(newOrders);
    } catch(error) {
        // Error is already toasted in the lib function
        console.error("Update failed from dashboard:", error);
        throw error; // Re-throw to inform the EditableField of failure
    } finally {
        setIsUpdatingDetails(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardHeader
          openCSR={() => handleOpenCSR()}
          openWhatsapp={() => handleOpenWhatsapp()}
          onAddStore={() => handleOpenStoreModal()}
          onSync={handleSync}
          onExport={handleExport}
          loading={loading}
          stores={stores}
          storesCount={stores.length}
          ordersCount={filteredOrders.length}
          filteredOrders={filteredOrders}
        />

        <OrderStats orders={filteredOrders} setStatusFilter={setStatusFilter} />

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
            screenOptions={screenOptions}
            onScreenOptionsChange={handleScreenOptionsChange}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
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
            onUpdateOrderDetails={handleUpdateOrderDetails}
            isUpdatingDetails={isUpdatingDetails}
            screenOptions={screenOptions}
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
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