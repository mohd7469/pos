
    import React, { useState, useEffect, useMemo } from 'react';
    import { Search, Store, Calendar, Activity } from 'lucide-react';
    import { Input } from '@/components/ui/input';
    import { Card } from '@/components/ui/card';
    import {
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
    } from "@/components/ui/select";

    const FilterControls = ({ orders, stores, onFilterChange, filteredCount }) => {
      const [searchTerm, setSearchTerm] = useState('');
      const [statusFilter, setStatusFilter] = useState('all');
      const [storeFilter, setStoreFilter] = useState('all');
      const [dateFilter, setDateFilter] = useState('all');

      const orderStatuses = useMemo(() => [
        { value: 'all', label: 'All Statuses' },
        { value: 'pending', label: 'Pending' },
        { value: 'processing', label: 'Processing' },
        { value: 'on-hold', label: 'On Hold' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
        { value: 'refunded', label: 'Refunded' },
        { value: 'failed', label: 'Failed' },
      ], []);

      const dateFilters = useMemo(() => [
        { value: 'all', label: 'All Time' },
        { value: 'today', label: 'Today' },
        { value: 'week', label: 'Last 7 Days' },
        { value: 'month', label: 'Last 30 Days' },
      ], []);
      
      const storeOptions = useMemo(() => [
          { value: 'all', name: 'All Stores' },
          ...stores
      ], [stores]);

      useEffect(() => {
        let filtered = [...orders];

        if (searchTerm) {
          const lowercasedTerm = searchTerm.toLowerCase().replace(/\D/g, ''); // For phone number search
          filtered = filtered.filter(order => {
            const billing = order.billing || {};
            const shipping = order.shipping || {};
            const lineItems = order.line_items || [];

            return (
              order.id.toString().includes(searchTerm.toLowerCase()) ||
              `${billing.first_name || ''} ${billing.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
              (billing.email && billing.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (billing.phone && billing.phone.replace(/\D/g, '').includes(lowercasedTerm)) ||
              `${shipping.first_name || ''} ${shipping.last_name || ''}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
              lineItems.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
            );
          });
        }

        if (statusFilter !== 'all') {
          filtered = filtered.filter(order => order.status === statusFilter);
        }

        if (storeFilter !== 'all') {
          filtered = filtered.filter(order => order.store_id === storeFilter);
        }

        if (dateFilter !== 'all') {
          const now = new Date();
          let filterDate = new Date();
          if (dateFilter === 'today') {
            filterDate.setHours(0, 0, 0, 0);
          } else if (dateFilter === 'week') {
            filterDate.setDate(now.getDate() - 7);
          } else if (dateFilter === 'month') {
            filterDate.setDate(now.getDate() - 30);
          }
          
          if (dateFilter !== 'all') {
            filtered = filtered.filter(order => new Date(order.date_created) >= filterDate);
          }
        }

        onFilterChange(filtered);
      }, [orders, searchTerm, statusFilter, storeFilter, dateFilter, onFilterChange]);

      return (
        <Card className="p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-grow">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by ID, name, email, phone, product..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 lg:flex-grow-0 lg:w-auto lg:grid-cols-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full">
                  <Activity className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {orderStatuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={storeFilter} onValueChange={setStoreFilter}>
                <SelectTrigger className="w-full">
                   <Store className="h-4 w-4 mr-2 text-gray-400" />
                   <SelectValue placeholder="Store" />
                </SelectTrigger>
                <SelectContent>
                  {storeOptions.map(store => (
                    <SelectItem key={store.id || store.value} value={store.id || store.value}>
                      {store.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-full">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <SelectValue placeholder="Date" />
                </SelectTrigger>
                <SelectContent>
                  {dateFilters.map(date => (
                    <SelectItem key={date.value} value={date.value}>
                      {date.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          { (orders.length > 0 || filteredCount > 0) && (
            <div className="text-sm text-gray-600 mt-4 text-right">
              Showing {filteredCount} of {orders.length} orders
            </div>
          )}
        </Card>
      );
    };

    export default FilterControls;
  