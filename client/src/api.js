import axios from 'axios';

// Resolve the API base URL dynamically based on environment configuration or hostname detection
let resolvedBase = import.meta.env.VITE_API_URL;

if (!resolvedBase) {
  if (typeof window !== 'undefined' && window.location.hostname.includes('onrender.com')) {
    resolvedBase = 'https://realestatelisting-u2kp.onrender.com';
  } else {
    resolvedBase = (import.meta.env.VITE_API_URL || 'https://realestatelisting-u2kp.onrender.com') + '';
  }
}

export const API_BASE_URL = resolvedBase;

// Global Axios request interceptor to rewrite absolute local URLs to the configured API server URL on production
axios.interceptors.request.use(
  (config) => {
    if (config.url && config.url.startsWith((import.meta.env.VITE_API_URL || 'https://realestatelisting-u2kp.onrender.com') + '')) {
      config.url = config.url.replace((import.meta.env.VITE_API_URL || 'https://realestatelisting-u2kp.onrender.com') + '', API_BASE_URL);
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
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};
