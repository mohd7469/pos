import React, {useMemo} from 'react';
import { motion } from 'framer-motion';
import { Plus, Download, RefreshCw, Store, ExternalLink } from 'lucide-react';
import { Coins } from 'lucide-react';
import { Button } from '@/components/ui/button';

import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";

const DashboardHeader = ({ openCSR, openWhatsapp, onAddStore, onSync, onExport, loading, storesCount, ordersCount, filteredOrders, stores, setStoreFilter }) => {
  const storeOptions = useMemo(() => [
    { value: 'all', name: 'All Stores' },
    ...stores
  ], [stores]);
  
  console.log(storeOptions);
  
  const totalRevenue = filteredOrders.reduce((sum, order) => sum + parseFloat(order.total || 0), 0);
  const currencies = [...new Set(filteredOrders.map(o => o.currency))];
  const revenueString = currencies.length === 1 && currencies[0]
    ? totalRevenue.toLocaleString('en-US', { style: 'currency', currency: currencies[0], minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : `${totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 💸`;
  
  // console.log('revenueString', revenueString);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Store className="h-8 w-8 text-blue-600" />
            G-BOX Admin Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Manage orders from all your WooCommerce stores in one place
          </p>
        </div>
        <div className="flex gap-3">
          <Popover>
            {/* Trigger Button */}
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <Coins className="h-4 w-4 mr-2" /> Total Revenue
              </Button>
            </PopoverTrigger>
            
            {/* Popover Content */}
            <PopoverContent className="w-full">
              <div className="space-y-2">
                <p className="flex items-center font-bold text-green-800">
                  {revenueString}
                </p>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button
            onClick={openWhatsapp}
            variant="outline"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Whatsapp Parser
          </Button>
          
          <Button
            onClick={openCSR}
            variant="outline"
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            CSR
          </Button>
          
          <Button
            onClick={onAddStore}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Store
          </Button>
          
          <div className="inline-flex">
            {/* Main action */}
            <Button
              onClick={async () => await onSync("")}
              disabled={loading || storesCount === 0}
              variant="outline"
              className="rounded-r-none"
            >
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Sync Orders
            </Button>
            
            {/* Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="rounded-l-none px-2 focus-visible:ring-0 focus-visible:outline-none"
                  disabled={loading || storesCount === 0}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {storeOptions.map((store, idx) => (
                  <DropdownMenuItem
                    key={idx}
                    onClick={() => onSync(store.id)}
                  >
                    Sync {store.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <Button
            onClick={onExport}
            disabled={ordersCount === 0}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardHeader;