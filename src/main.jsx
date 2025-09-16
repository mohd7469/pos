import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App';
import '@/index.css';
import { HelmetProvider } from 'react-helmet-async';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'; // Correctly imported CSS

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
      <ToastContainer /> {/* Correct placement */}
    </HelmetProvider>
  </React.StrictMode>
);