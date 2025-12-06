import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use a relative base so the app works on GitHub Pages project sites
// (e.g., https://user.github.io/repo) without broken asset paths and still
// works when served from backend at domain root.
export default defineConfig({
  plugins: [react()],
  // Relative base ensures CSS/JS assets resolve correctly on static hosts
  // like GitHub Pages (project subpaths) and on root deployments.
  base: './',
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
