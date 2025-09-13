import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Store, Key, Globe, HelpCircle, Save, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { testStoreConnection } from '@/lib/woocommerce';

const StoreConnectionModal = ({ isOpen, onClose, onSaveStore, store }) => {
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    consumerKey: '',
    consumerSecret: ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const isEditing = !!store;

  useEffect(() => {
    if (isEditing) {
      setFormData({
        name: store.name || '',
        url: store.url || '',
        consumerKey: store.consumerKey || '',
        consumerSecret: store.consumerSecret || ''
      });
    } else {
       setFormData({ name: '', url: '', consumerKey: '', consumerSecret: '' });
    }
  }, [store, isEditing, isOpen]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.url || !formData.consumerKey || !formData.consumerSecret) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      await testStoreConnection(formData);
      onSaveStore(formData);
      toast({
        title: isEditing ? "Store Updated!" : "Connection Successful!",
        description: isEditing ? `${formData.name} has been updated.` : `${formData.name} has been added.`
      });
    } catch (error) {
      toast({
        title: "Connection Failed",
        description: error.message || "Please check credentials and URL.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl"
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Store className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-semibold">{isEditing ? 'Edit Store' : 'Add Store'}</h2>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-blue-900 mb-2">How to get your API credentials:</h3>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Go to your WooCommerce admin → WooCommerce → Settings → Advanced → REST API</li>
                      <li>Click "Add Key", give a description, and set permissions to "Read"</li>
                      <li>Copy the generated Consumer Key and Consumer Secret</li>
                      <li>Make sure your store URL starts with https://</li>
                    </ol>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="storeName" className="flex items-center gap-2">
                    <Store className="h-4 w-4" />
                    Store Name *
                  </Label>
                  <Input
                    id="storeName"
                    placeholder="My Awesome Store"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="storeUrl" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Store URL *
                  </Label>
                  <Input
                    id="storeUrl"
                    placeholder="https://yourstore.com"
                    value={formData.url}
                    onChange={(e) => handleInputChange('url', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="consumerKey" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Consumer Key *
                  </Label>
                  <Input
                    id="consumerKey"
                    placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={formData.consumerKey}
                    onChange={(e) => handleInputChange('consumerKey', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="consumerSecret" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Consumer Secret *
                  </Label>
                  <Input
                    id="consumerSecret"
                    type="password"
                    placeholder="cs_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={formData.consumerSecret}
                    onChange={(e) => handleInputChange('consumerSecret', e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    {loading ? 'Testing...' : (isEditing ? 'Save Changes' : 'Add & Verify Store')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StoreConnectionModal;