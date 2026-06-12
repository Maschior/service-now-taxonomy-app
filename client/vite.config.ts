import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const backendTarget = process.env.VITE_API_URL || 'http://localhost:5000';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 4173,
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
    
    proxy: {
      '/api': {
        target: backendTarget,
        changeOrigin: true
      }
    }
  }
});
