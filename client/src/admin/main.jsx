import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.jsx';
import '../components/CustomModal.jsx';
import '../index.css';
import '../api.js';

const CLERK_PUB_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_bGl2ZS1ncm91c2UtNTkuY2xlcmsuYWNjb3VudHMuZGV2JA';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={CLERK_PUB_KEY}>
      <App />
    </ClerkProvider>
  </React.StrictMode>,
)
