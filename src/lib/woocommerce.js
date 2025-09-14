
import { toast } from '@/components/ui/use-toast';
import Papa from 'papaparse';

const CORS_PROXY_URL = 'https://app-cors.vercel.app/api/proxy?url=';

export const testStoreConnection = async (storeData) => {
  const auth = btoa(`${storeData.consumerKey}:${storeData.consumerSecret}`);
  const endpoint = `${storeData.url.replace(/\/$/, '')}/wp-json/wc/v3/system_status`;
  const proxyUrl = `${CORS_PROXY_URL}${endpoint}`;

  const response = await fetch(proxyUrl, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'An unknown error occurred.' }));
    throw new Error(errorData.message || `Request failed with status ${response.status}`);
  }

  return response.json();
};


export const syncStoreOrders = async (store, setOrders) => {
  const auth = btoa(`${store.consumerKey}:${store.consumerSecret}`);
  const endpoint = `${store.url.replace(/\/$/, '')}/wp-json/wc/v3/orders?per_page=100`;
  const proxyUrl = `${CORS_PROXY_URL}${endpoint}`;

  const response = await fetch(proxyUrl, {
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const storeOrders = await response.json();
  const processedOrders = storeOrders.map(order => ({
    ...order,
    store_name: store.name,
    store_id: store.id,
    store_url: store.url
  }));

  setOrders(prevOrders => {
    const existingOrders = prevOrders.filter(order => order.store_id !== store.id);
    const updatedOrders = [...existingOrders, ...processedOrders];
    localStorage.setItem('woocommerce_orders', JSON.stringify(updatedOrders));
    return updatedOrders;
  });
};

export const syncAllStores = async ({ storeId, stores, setOrders, updateStore, toast }) => {
  let syncedCount = 0;
  
  const storesToSync = storeId ? stores.filter(s => s.id === storeId) : stores;
  
  if (storesToSync.length === 0 && !storeId) {
    toast({
      title: "No Stores to Sync",
      description: "Please add a store first.",
      variant: "destructive"
    });
    return;
  }

  for (const store of storesToSync) {
    try {
      await syncStoreOrders(store, setOrders);
      updateStore(store.id, { connected: true, lastSync: new Date().toISOString() });
      syncedCount++;
    } catch (e) {
      updateStore(store.id, { connected: false });
      console.error(`Failed to sync store: ${store.name}`, e);
      toast({
        title: `Sync Error for ${store.name}`,
        description: "Could not retrieve orders. Please check credentials and connection.",
        variant: "destructive"
      });
    }
  }
      
  if (syncedCount > 0) {
    toast({
      title: "Orders Synced Successfully!",
      description: `Retrieved orders from ${syncedCount} store(s).`
    });
  }
};

export const updateOrderStatusBatch = async ({ ordersToUpdate, newStatus, stores, toast }) => {
    const ordersByStore = ordersToUpdate.reduce((acc, order) => {
        (acc[order.store_id] = acc[order.store_id] || []).push({ id: order.id, status: newStatus });
        return acc;
    }, {});

    let successCount = 0;
    let errorCount = 0;

    for (const storeId in ordersByStore) {
        const store = stores.find(s => s.id === storeId);
        if (!store) {
            toast({
                title: 'Update Error',
                description: `Could not find store with ID ${storeId}.`,
                variant: 'destructive',
            });
            errorCount += ordersByStore[storeId].length;
            continue;
        }

        try {
            const auth = btoa(`${store.consumerKey}:${store.consumerSecret}`);
            const endpoint = `${store.url.replace(/\/$/, '')}/wp-json/wc/v3/orders/batch`;
            const proxyUrl = `${CORS_PROXY_URL}${endpoint}`;
            
            const response = await fetch(proxyUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: JSON.stringify({ update: ordersByStore[storeId] }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Batch update request failed.');
            }
            
            successCount += ordersByStore[storeId].length;

        } catch (error) {
            console.error(`Failed to update orders for store ${store.name}:`, error);
            toast({
                title: `Update Failed for ${store.name}`,
                description: error.message || 'An unknown error occurred.',
                variant: 'destructive',
            });
            errorCount += ordersByStore[storeId].length;
        }
    }
    
    if(successCount > 0) {
        toast({
            title: 'Update Successful!',
            description: `${successCount} order(s) have been updated to "${newStatus}".`,
        });
    }

    if (errorCount > 0) {
       toast({
            title: 'Some Updates Failed',
            description: `${errorCount} order(s) could not be updated. See console for details.`,
            variant: 'destructive'
        });
    }
};

export const updateOrderDetails = async ({ storeId, orderId, data, stores, toast }) => {
    const store = stores.find(s => s.id === storeId);
    if (!store) {
        toast({
            title: 'Update Error',
            description: `Could not find store with ID ${storeId}.`,
            variant: 'destructive',
        });
        throw new Error('Store not found');
    }

    try {
        const auth = btoa(`${store.consumerKey}:${store.consumerSecret}`);
        const endpoint = `${store.url.replace(/\/$/, '')}/wp-json/wc/v3/orders/${orderId}`;
        const proxyUrl = `${CORS_PROXY_URL}${endpoint}`;
        
        const response = await fetch(proxyUrl, {
            method: 'PUT',
            headers: {
                'Authorization': `Basic ${auth}`,
                'Content-Type': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Order update request failed.');
        }

        const updatedOrder = await response.json();

        toast({
            title: 'Update Successful!',
            description: `Order #${orderId} details have been updated.`,
        });

        return {
            ...updatedOrder,
            store_name: store.name,
            store_id: store.id,
            store_url: store.url
        };

    } catch (error) {
        console.error(`Failed to update order for store ${store.name}:`, error);
        toast({
            title: `Update Failed for ${store.name}`,
            description: error.message || 'An unknown error occurred.',
            variant: 'destructive',
        });
        throw error;
    }
};

export const exportOrdersToExcel = (ordersToExport, visibleColumns, toast) => {
    if (!ordersToExport || ordersToExport.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no orders to export.",
        variant: "destructive"
      });
      return;
    }

    const dataToExport = ordersToExport.map(order => {
        const billing = order.billing || {};
        const shipping = order.shipping || {};
        const city = order.meta_data.find(item => item.key === 'billing_area')?.value || 'N/A';
        
        const row = {};
      
        row['Ref'] = `${order.store_name.toUpperCase().slice(0, 3)}${order.id}`;
        
        if (visibleColumns.order) {
            row['Order ID'] = order.id;
            row['Store'] = order.store_name;
        }
        if (visibleColumns.date) row['Date'] = new Date(order.date_created).toISOString();
        if (visibleColumns.status) row['Status'] = order.status;
        if (visibleColumns.billing) {
            row['Billing First Name'] = billing.first_name;
            row['Billing Last Name'] = billing.last_name;
            row['Billing Company'] = billing.company || city;
            row['Billing Address 1'] = billing.address_1;
            row['Billing Address 2'] = billing.address_2;
            row['Billing City'] = billing.city;
            row['Billing Postcode'] = billing.postcode;
            row['Billing State'] = billing.state;
            row['Billing Country'] = billing.country;
            row['Billing Email'] = billing.email;
            row['Billing Phone'] = billing.phone;
        }
        if (visibleColumns.shipping) {
            row['Shipping First Name'] = shipping.first_name;
            row['Shipping Last Name'] = shipping.last_name;
            row['Shipping Company'] = shipping.company || city;
            row['Shipping Address 1'] = shipping.address_1;
            row['Shipping Address 2'] = shipping.address_2;
            row['Shipping City'] = shipping.city;
            row['Shipping Postcode'] = shipping.postcode;
            row['Shipping State'] = shipping.state;
            row['Shipping Country'] = shipping.country;
        }
        if (visibleColumns.total) {
            row['Total'] = order.total;
            row['Currency'] = order.currency;
        }
        if (visibleColumns.payment) row['Payment Method'] = order.payment_method_title || order.payment_method;
        if (visibleColumns.items) {
             row['Customer Note'] = order.customer_note;
             row['Items Count'] = order.line_items?.length || 0;
             row['Items'] = order.line_items?.map(item => `(Qty: ${item.quantity})-${item.name}`).join('\n') || '';
        }
        
        return row;
    });

    const csv = Papa.unparse(dataToExport);
    
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `woocommerce-orders-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful!",
      description: `Exported ${ordersToExport.length} orders to CSV file.`
    });
  };