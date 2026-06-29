import axios from 'axios';

// Resolve the API base URL dynamically based on environment configuration
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};
