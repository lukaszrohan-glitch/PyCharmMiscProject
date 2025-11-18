import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Use a relative base so the app works on GitHub Pages project sites
// (e.g., https://user.github.io/repo) without broken asset paths.
export default defineConfig({
  plugins: [react()],
  // Use absolute base for backend-served SPA so assets resolve from root
  base: '/',
});
