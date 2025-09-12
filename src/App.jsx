import React from 'react';
import { Helmet } from 'react-helmet';
import { Toaster } from '@/components/ui/toaster';
import WooCommerceDashboard from '@/components/WooCommerceDashboard';

function App() {
  return (
    <>
      <Helmet>
        <title>WooCommerce Orders Dashboard - Multi-Store Management</title>
        <meta name="description" content="Centralized dashboard for managing WooCommerce orders across multiple stores with export functionality" />
        <meta property="og:title" content="WooCommerce Orders Dashboard - Multi-Store Management" />
        <meta property="og:description" content="Centralized dashboard for managing WooCommerce orders across multiple stores with export functionality" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <WooCommerceDashboard />
        <Toaster />
      </div>
    </>
  );
}

export default App;