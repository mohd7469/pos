import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const BulkActionsToolbar = ({
  selectedCount,
  onUpdateStatus,
  onClearSelection,
  isUpdating,
}) => {
  const [selectedStatus, setSelectedStatus] = React.useState('');
  const statuses = [
    'pending',
    'processing',
    'on-hold',
    'completed',
    'cancelled',
    'refunded',
  ];

  const handleUpdateClick = () => {
    if (selectedStatus) {
      onUpdateStatus(selectedStatus);
    }
  };

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="my-4 p-3 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {selectedCount} order(s) selected
            </span>
            <div className="flex items-center gap-2">
              <Select onValueChange={setSelectedStatus} value={selectedStatus}>
                <SelectTrigger className="w-[180px] h-9 bg-white">
                  <SelectValue placeholder="Change status to..." />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                onClick={handleUpdateClick}
                disabled={!selectedStatus || isUpdating}
              >
                {isUpdating ? 'Updating...' : 'Apply'}
              </Button>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClearSelection}>
            <X className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BulkActionsToolbar;