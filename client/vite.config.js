import { resolve } from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const mpaFallback = () => {
  return {
    name: 'mpa-fallback',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url.startsWith('/buyer')) {
          req.url = '/buyer/index.html';
        } else if (req.url.startsWith('/seller')) {
          req.url = '/seller/index.html';
        } else if (req.url.startsWith('/admin')) {
          req.url = '/admin/index.html';
        }
        next();
      });
    }
  };
};

export default defineConfig({
  plugins: [react(), mpaFallback()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        buyer: resolve(__dirname, 'buyer/index.html'),
        seller: resolve(__dirname, 'seller/index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
    },
  },
});
