
import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Package, ExternalLink, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import BulkActionsToolbar from '@/components/BulkActionsToolbar';
import EditableField from '@/components/EditableField';
import Pagination from '@/components/Pagination';
import { generateOrderPDF } from '@/lib/pdfGenerator';

const OrderRow = ({ order, index, isDuplicatePhone, isSelected, onSelectionChange, onUpdateOrderDetails, visibleColumns }) => {
  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'processing': 'bg-blue-100 text-blue-800',
      'on-hold': 'bg-gray-100 text-gray-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800',
      'refunded': 'bg-purple-100 text-purple-800',
      'failed': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD'
    }).format(amount);
  };

  const handleFieldSave = (orderId, data) => {
    return onUpdateOrderDetails(order.store_id, orderId, data);
  };

  const BillingAddress = ({ address, meta_data }) => {
    if (!address) return 'N/A';
    
    const city = meta_data.find(item => item.key === 'billing_area')?.value || 'N/A';
    
    return (
      <div className="">
        <div className="flex gap-1">
            {address.first_name && <EditableField className={"p-0"} initialValue={address.first_name} onSave={handleFieldSave} fieldName="first_name" orderId={order.id} />}
            {address.last_name && <EditableField className={"p-0"} initialValue={address.last_name} onSave={handleFieldSave} fieldName="last_name" orderId={order.id} />}
        </div>
        {address.company && <EditableField initialValue={address.company} onSave={handleFieldSave} fieldName="company" orderId={order.id} />}
        <EditableField className={"p-0"} initialValue={address.address_1} onSave={handleFieldSave} fieldName="address_1" orderId={order.id} />
        <EditableField className={"p-0"} initialValue={address.address_2} onSave={handleFieldSave} fieldName="address_2" orderId={order.id} />
        <div className="flex gap-1">
            <EditableField className={"p-0"} initialValue={address.city || city} onSave={handleFieldSave} fieldName="city" orderId={order.id} />
            {address.state && <EditableField className={"p-0"} initialValue={address.state} onSave={handleFieldSave} fieldName="state" orderId={order.id} />}
        </div>
        <div className="flex gap-1">
            {address.postcode && <EditableField className={"p-0"} initialValue={address.postcode} onSave={handleFieldSave} fieldName="postcode" orderId={order.id} />}
            {/*<EditableField className={"p-0"} initialValue={address.country} onSave={handleFieldSave} fieldName="country" orderId={order.id} />*/}
        </div>
        <EditableField className={"p-0"} initialValue={address.email} onSave={handleFieldSave} fieldName="email" orderId={order.id} />
        <EditableField className={"p-0"} initialValue={address.phone} onSave={handleFieldSave} fieldName="phone" orderId={order.id} isDuplicatePhone={isDuplicatePhone} />
        <EditableField className={"p-0"} initialValue={city} />
      </div>
    );
  };

   const ShippingAddress = ({ address, meta_data, billing, customer_note = 'N/A' }) => {
    if (!address || Object.keys(address).length === 0) return 'N/A';
    
    const city = meta_data.find(item => item.key === 'billing_area')?.value || 'N/A';
    const phone = billing?.phone || 'N/A';
    
    const parts = [
      `${address.first_name || ''} ${address.last_name || ''}`.trim(),
      address.address_1,
      address.address_2,
      `${address.city || ''}, ${address.state || ''} ${address.postcode || ''}`.trim(),
      phone,
      city,
      customer_note
    ].filter(Boolean).filter(p => p.trim() !== ',');
    return (
      <div>
        {parts.map((part, i) => <div key={i}>{part}</div>)}
      </div>
    );
  };
  
  const uniqueKey = `${order.store_id}-${order.id}`;

  return (
    <motion.tr
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={`align-top transition-colors ${isDuplicatePhone ? 'bg-red-50' : ''} ${isSelected ? 'bg-blue-50' : ''}`}
    >
      <td className="w-10">
        <div className="flex justify-center items-center h-full">
            <Checkbox
              id={`select-${uniqueKey}`}
              checked={isSelected}
              onCheckedChange={() => onSelectionChange(uniqueKey)}
            />
        </div>
      </td>
      {visibleColumns.order && <td>
        <div className="font-medium text-blue-600">
          #{order.id}
        </div>
        <div className="text-xs text-gray-500 font-bold text-base">{order.store_name}</div>
      </td>}
      {visibleColumns.date && <td>
        <div className="text-sm">
          {formatDate(order.date_created)}
        </div>
      </td>}
      {visibleColumns.status && <td>
        <Badge className={`status-badge ${getStatusColor(order.status)}`}>
          {order.status.replace('-', ' ').toUpperCase()}
        </Badge>
      </td>}
      {visibleColumns.billing && <td className="text-xs">
          <BillingAddress address={order.billing} meta_data={order.meta_data} />
      </td>}
      {visibleColumns.shipping && <td className="text-xs"><ShippingAddress address={order.shipping} meta_data={order.meta_data} billing={order.billing} customer_note={order.customer_note} /></td>}
      {visibleColumns.items && <td className="text-xs">
        <ul className="space-y-1">
          {order.line_items?.map(item => (
            <li key={item.id}>
              {order.store_name.toLowerCase() === "wtsp" ? (
                // ✅ Show last_name
                <span>{order.billing.last_name}</span>
              ) : (
                // ✅ Show quantity + link
                <>
                  {item.quantity}x
                  <a
                    href={`${order.store_url}/?p=${item.product_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-1 text-blue-600 hover:underline inline-flex items-center gap-1"
                  >
                    {item.name} <ExternalLink className="h-3 w-3" />
                  </a>
                </>
              )}
            </li>
          ))}
        </ul>
        {order.customer_note && (
            <div className="mt-2 p-2 bg-yellow-50 border-l-2 border-yellow-400 text-yellow-800 text-xs">
                <strong>Note:</strong> {order.customer_note}
            </div>
        )}
      </td>}
      {visibleColumns.payment && <td>
        <div className="text-sm">{order.payment_method_title}</div>
      </td>}
      {visibleColumns.total && <td>
        <div className="font-medium">
          {formatCurrency(order.total, order.currency)}
        </div>
      </td>}
      {visibleColumns.actions && <td>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(`${order.store_url}/wp-admin/post.php?post=${order.id}&action=edit`, '_blank')}
            title="View in WP Admin"
          >
            <Eye className="h-3 w-3" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => generateOrderPDF(order)}
            title="Download PDF Invoice"
          >
            <FileText className="h-3 w-3" />
          </Button>
        </div>
      </td>}
    </motion.tr>
  );
};

const OrdersTable = ({ orders, loading, onUpdateOrders, isUpdatingOrders, onUpdateOrderDetails, stores, screenOptions, selectedRows, setSelectedRows }) => {
  const [currentPage, setCurrentPage] = useState(1);

  const phoneNumbersCount = useMemo(() => {
    const counts = {};
    orders.forEach(order => {
        const phone = order.billing?.phone?.replace(/\D/g, '');
        if (phone) {
            counts[phone] = (counts[phone] || 0) + 1;
        }
    });
    return counts;
  }, [orders]);
  
  useEffect(() => {
    setCurrentPage(1);
  }, [orders, screenOptions.itemsPerPage]);

  const totalPages = Math.ceil(orders.length / screenOptions.itemsPerPage);
  const paginatedOrders = useMemo(() => {
      const startIndex = (currentPage - 1) * screenOptions.itemsPerPage;
      return orders.slice(startIndex, startIndex + screenOptions.itemsPerPage);
  }, [orders, currentPage, screenOptions.itemsPerPage]);

  const handleSelectionChange = (orderKey) => {
    setSelectedRows(prev => {
        const newSelection = new Set(prev);
        if (newSelection.has(orderKey)) {
            newSelection.delete(orderKey);
        } else {
            newSelection.add(orderKey);
        }
        return newSelection;
    });
  };
  
  const handleSelectAll = (checked) => {
    if (checked) {
        const allOrderKeys = new Set(paginatedOrders.map(o => `${o.store_id}-${o.id}`));
        setSelectedRows(allOrderKeys);
    } else {
        setSelectedRows(new Set());
    }
  };

  const handleUpdateStatus = (status) => {
    const ordersToUpdate = orders.filter(o => selectedRows.has(`${o.store_id}-${o.id}`));
    onUpdateOrders(ordersToUpdate, status);
  };
  
  if (loading) {
    return (
      <Card className="p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading orders...</p>
      </Card>
    );
  }

  if (orders.length === 0 && !loading) {
    return (
      <Card className="p-8 text-center">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
        <p className="text-gray-600">
          No orders match your current filters. Try adjusting your search criteria or sync your stores.
        </p>
      </Card>
    );
  }
  
  const currentSelectionOnPage = paginatedOrders.filter(o => selectedRows.has(`${o.store_id}-${o.id}`));
  const isAllOnPageSelected = currentSelectionOnPage.length > 0 && currentSelectionOnPage.length === paginatedOrders.length;
  const isIndeterminate = currentSelectionOnPage.length > 0 && currentSelectionOnPage.length < paginatedOrders.length;

  return (
    <>
      <BulkActionsToolbar
        selectedCount={selectedRows.size}
        onUpdateStatus={handleUpdateStatus}
        onClearSelection={() => setSelectedRows(new Set())}
        isUpdating={isUpdatingOrders}
      />
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="woo-table">
            <thead>
              <tr>
                <th className="w-10">
                  <div className="flex justify-center items-center h-full">
                    <Checkbox
                      id="select-all"
                      checked={isAllOnPageSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all rows on this page"
                      data-state={isIndeterminate ? 'indeterminate' : (isAllOnPageSelected ? 'checked' : 'unchecked')}
                    />
                  </div>
                </th>
                {screenOptions.visibleColumns.order && <th>Order</th>}
                {screenOptions.visibleColumns.date && <th>Date</th>}
                {screenOptions.visibleColumns.status && <th>Status</th>}
                {screenOptions.visibleColumns.billing && <th>Billing</th>}
                {screenOptions.visibleColumns.shipping && <th>Ship to</th>}
                {screenOptions.visibleColumns.items && <th>Items & Notes</th>}
                {screenOptions.visibleColumns.payment && <th>Payment</th>}
                {screenOptions.visibleColumns.total && <th>Total</th>}
                {screenOptions.visibleColumns.actions && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order, index) => {
                const uniqueKey = `${order.store_id}-${order.id}`;
                const phone = order.billing?.phone?.replace(/\D/g, '');
                const isDuplicate = phone && phoneNumbersCount[phone] > 1;
                return <OrderRow 
                    key={uniqueKey} 
                    order={order} 
                    index={index} 
                    isDuplicatePhone={isDuplicate}
                    isSelected={selectedRows.has(uniqueKey)}
                    onSelectionChange={handleSelectionChange}
                    onUpdateOrderDetails={onUpdateOrderDetails}
                    visibleColumns={screenOptions.visibleColumns}
                />
              })}
            </tbody>
          </table>
        </div>
        <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            itemsPerPage={screenOptions.itemsPerPage}
            totalItems={orders.length}
        />
      </Card>
    </>
  );
};

export default OrdersTable;