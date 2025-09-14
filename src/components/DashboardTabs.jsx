import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import OrdersTable from '@/components/OrdersTable';
import StoresList from '@/components/StoresList';

const DashboardTabs = ({ stores, orders, loading, onSync, onAddStore, onEditStore, onDeleteStore, onUpdateOrders, isUpdatingOrders, onUpdateOrderDetails, isUpdatingDetails, screenOptions, selectedRows, setSelectedRows }) => {
  return (
    <Tabs defaultValue="orders" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2 max-w-md">
        <TabsTrigger value="orders">Orders</TabsTrigger>
        {/*<TabsTrigger value="stores">Stores ({stores.length})</TabsTrigger>*/}
      </TabsList>

      <TabsContent value="orders">
        <OrdersTable 
            orders={orders} 
            loading={loading}
            onUpdateOrders={onUpdateOrders}
            isUpdatingOrders={isUpdatingOrders}
            stores={stores}
            onUpdateOrderDetails={onUpdateOrderDetails}
            isUpdatingDetails={isUpdatingDetails}
            screenOptions={screenOptions}
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
        />
      </TabsContent>

      {/*<TabsContent value="stores">
        <StoresList
          stores={stores}
          loading={loading}
          onSync={onSync}
          onAddStore={onAddStore}
          onEditStore={onEditStore}
          onDeleteStore={onDeleteStore}
        />
      </TabsContent>*/}
    </Tabs>
  );
};

export default DashboardTabs;