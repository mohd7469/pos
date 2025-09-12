import { toast } from '@/components/ui/use-toast';
import Papa from 'papaparse';

const CORS_PROXY_URL = 'https://cors-anywhere.herokuapp.com/';

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


export const exportOrdersToExcel = (filteredOrders, toast) => {
    if (filteredOrders.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no orders to export.",
        variant: "destructive"
      });
      return;
    }

    const dataToExport = filteredOrders.map(order => {
        const billing = order.billing || {};
        const shipping = order.shipping || {};
        return {
            'Order ID': order.id,
            'Store': order.store_name,
            'Date': new Date(order.date_created).toISOString(),
            'Status': order.status,
            'Billing First Name': billing.first_name,
            'Billing Last Name': billing.last_name,
            'Billing Company': billing.company,
            'Billing Address 1': billing.address_1,
            'Billing Address 2': billing.address_2,
            'Billing City': billing.city,
            'Billing Postcode': billing.postcode,
            'Billing State': billing.state,
            'Billing Country': billing.country,
            'Billing Email': billing.email,
            'Billing Phone': billing.phone,
            'Shipping First Name': shipping.first_name,
            'Shipping Last Name': shipping.last_name,
            'Shipping Company': shipping.company,
            'Shipping Address 1': shipping.address_1,
            'Shipping Address 2': shipping.address_2,
            'Shipping City': shipping.city,
            'Shipping Postcode': shipping.postcode,
            'Shipping State': shipping.state,
            'Shipping Country': shipping.country,
            'Total': order.total,
            'Currency': order.currency,
            'Payment Method': order.payment_method_title || order.payment_method,
            'Customer Note': order.customer_note,
            'Items Count': order.line_items?.length || 0,
            'Items': order.line_items?.map(item => `${item.name} (Qty: ${item.quantity}, SKU: ${item.sku || 'N/A'})`).join('; ') || ''
        };
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
      description: `Exported ${filteredOrders.length} orders to CSV file.`
    });
  };