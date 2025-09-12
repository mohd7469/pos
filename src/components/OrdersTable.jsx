import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eye, Package, Phone, ExternalLink, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import BulkActionsToolbar from '@/components/BulkActionsToolbar';
import { generateOrderPDF } from '@/lib/pdfGenerator';

const OrderRow = ({ order, index, isDuplicatePhone, isSelected, onSelectionChange }) => {
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
  
  const formatPhoneNumber = (phone) => {
    if (!phone) return null;
    const cleaned = ('' + phone).replace(/\D/g, '');
    return `https://wa.me/${cleaned}`;
  };

  const formatAddress = (address) => {
    if (!address || Object.keys(address).length === 0) return 'N/A';
    const parts = [
      `${address.first_name || ''} ${address.last_name || ''}`.trim(),
      address.company,
      address.address_1,
      address.address_2,
      `${address.city || ''}, ${address.state || ''} ${address.postcode || ''}`.trim(),
      address.country,
    ].filter(Boolean).filter(p => p.trim() !== ',');
    return (
      <div className={isDuplicatePhone && address.phone ? 'text-red-600' : ''}>
        {parts.map((part, i) => <div key={i}>{part}</div>)}
        {address.email && (
           <div className="text-xs text-gray-500">{address.email}</div>
        )}
        {address.phone && (
           <a
              href={formatPhoneNumber(address.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center gap-1 mt-1"
            >
              <Phone className="h-3 w-3" />
              {address.phone}
            </a>
        )}
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
      <td>
        <div className="font-medium text-blue-600">
          #{order.id}
        </div>
        <div className="text-xs text-gray-500 font-bold text-base">{order.store_name}</div>
      </td>
      <td>
        <div className="text-sm">
          {formatDate(order.date_created)}
        </div>
      </td>
      <td>
        <Badge className={`status-badge ${getStatusColor(order.status)}`}>
          {order.status.replace('-', ' ').toUpperCase()}
        </Badge>
      </td>
      <td className="text-xs">{formatAddress(order.billing)}</td>
      <td className="text-xs">{formatAddress(order.shipping)}</td>
      <td className="text-xs">
        <ul className="space-y-1">
          {order.line_items?.map(item => (
            <li key={item.id}>
              ({item.quantity}x)
              <a
                href={`${order.store_url}/?p=${item.product_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 text-blue-600 hover:underline inline-flex items-center gap-1"
              >
                {item.name} <ExternalLink className="h-3 w-3" />
              </a>
            </li>
          ))}
        </ul>
        {order.customer_note && (
            <div className="mt-2 p-2 bg-yellow-50 border-l-2 border-yellow-400 text-yellow-800 text-xs">
                <strong>Note:</strong> {order.customer_note}
            </div>
        )}
      </td>
      <td>
        <div className="text-sm">{order.payment_method_title}</div>
      </td>
      <td>
        <div className="font-medium">
          {formatCurrency(order.total, order.currency)}
        </div>
      </td>
      <td>
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
      </td>
    </motion.tr>
  );
};

const OrdersTable = ({ orders, loading, onUpdateOrders, isUpdatingOrders, stores }) => {
  const [selectedRows, setSelectedRows] = useState(new Set());

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
    setSelectedRows(new Set());
  }, [orders]);

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
        const allOrderKeys = new Set(orders.map(o => `${o.store_id}-${o.id}`));
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

  if (orders.length === 0) {
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
  
  const isAllSelected = selectedRows.size > 0 && selectedRows.size === orders.length;
  const isIndeterminate = selectedRows.size > 0 && selectedRows.size < orders.length;

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
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all rows"
                      data-state={isIndeterminate ? 'indeterminate' : (isAllSelected ? 'checked' : 'unchecked')}
                    />
                  </div>
                </th>
                <th>Order</th>
                <th>Date</th>
                <th>Status</th>
                <th>Billing</th>
                <th>Ship to</th>
                <th>Items & Notes</th>
                <th>Payment</th>
                <th>Total</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, index) => {
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
                />
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
};

export default OrdersTable;