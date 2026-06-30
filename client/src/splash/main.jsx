import React from 'react';
import ReactDOM from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.jsx';
import '../index.css';
import '../api.js';

let CLERK_PUB_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
if (!CLERK_PUB_KEY || CLERK_PUB_KEY === 'undefined' || !CLERK_PUB_KEY.startsWith('pk_')) {
  CLERK_PUB_KEY = 'pk_test_bGl2ZS1ncm91c2UtNTkuY2xlcmsuYWNjb3VudHMuZGV2JA';
}

import ErrorBoundary from '../components/ErrorBoundary';

const isClerkAvailable = typeof window !== 'undefined' && 
  (window.location.hostname.includes('localhost') || 
   window.location.hostname.includes('127.0.0.1') || 
   !CLERK_PUB_KEY.startsWith('pk_test_'));

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      {isClerkAvailable ? (
        <ClerkProvider publishableKey={CLERK_PUB_KEY}>
          <App />
        </ClerkProvider>
      ) : (
        <App />
      )}
    </ErrorBoundary>
  </React.StrictMode>,
)
