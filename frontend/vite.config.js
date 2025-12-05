import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use a relative base so the app works on GitHub Pages project sites
// (e.g., https://user.github.io/repo) without broken asset paths.
export default defineConfig({
  plugins: [react()],
  // Use absolute base for backend-served SPA so assets resolve from root
  base: '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'query-vendor': ['@tanstack/react-query'],
          'motion-vendor': ['framer-motion'],
        },
      },
    },
    // Increase limit slightly since we're splitting
    chunkSizeWarningLimit: 300,
  },
});
