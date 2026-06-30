import axios from 'axios';

// Resolve the API base URL dynamically based on environment configuration or hostname detection
let resolvedBase = import.meta.env.VITE_API_URL;

// Safety check: If VITE_API_URL is missing, or is not a valid http/https URL (e.g. MongoDB string was set by mistake in Render)
if (!resolvedBase || !resolvedBase.startsWith('http')) {
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    resolvedBase = 'https://realestatelisting-u2kp.onrender.com';
  } else {
    resolvedBase = 'http://localhost:5000';
  }
}

export const API_BASE_URL = resolvedBase;

// Expose globally on the window object for components to reference
if (typeof window !== 'undefined') {
  window.API_BASE_URL = resolvedBase;
}

// Global Axios request interceptor to rewrite absolute local URLs to the configured API server URL on production
axios.interceptors.request.use(
  (config) => {
    if (config.url && config.url.startsWith('http://localhost:5000')) {
      config.url = config.url.replace('http://localhost:5000', API_BASE_URL);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Helper function to resolve static asset URLs (like profile pictures and property images) dynamically
export const getAssetUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('data:image')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

// Helper function to parse localStorage items safely without crashing the React application
export const getSafeLocalStorage = (key) => {
  try {
    const val = localStorage.getItem(key);
    if (!val || val === 'undefined' || val === 'null') return null;
    return JSON.parse(val);
  } catch (e) {
    console.error(`Error parsing localStorage key "${key}":`, e);
    return null;
  }
};
