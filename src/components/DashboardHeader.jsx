import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Download, RefreshCw, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';

const DashboardHeader = ({ onAddStore, onSync, onExport, loading, storesCount, ordersCount }) => {
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
            CSR WooSync Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Manage orders from all your WooCommerce stores in one place
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={onAddStore}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Store
          </Button>
          <Button
            onClick={() => onSync()}
            disabled={loading || storesCount === 0}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Sync Orders
          </Button>
          {/*<Button
            onClick={onExport}
            disabled={ordersCount === 0}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>*/}
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardHeader;