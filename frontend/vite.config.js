import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['@babel/plugin-transform-react-jsx', { runtime: 'automatic' }]
        ]
      }
    })
  ],

  base: '/',

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@styles': path.resolve(__dirname, './src/styles')
    }
  },

  css: {
    modules: {
      localsConvention: 'camelCase',
      scopeBehaviour: 'local',
      generateScopedName: '[name]__[local]___[hash:base64:5]'
    },
    preprocessorOptions: {
      less: {
        javascriptEnabled: true
      }
    }
  },

  server: {
    host: true,
    port: 5173,
    strictPort: true,
    cors: true,
    watch: {
      usePolling: true
    },
    allowedHosts: [
      'localhost',
      'arkuszowniasmb.pl',
      '*.arkuszowniasmb.pl'
    ],
    proxy: {
      '/api': {
        target: 'http://backend:8000',
        changeOrigin: true,
        secure: false
      }
    }
  },

  preview: {
    port: 5173,
    strictPort: true,
    host: true,
    allowedHosts: [
      'localhost',
      'arkuszowniasmb.pl',
      '*.arkuszowniasmb.pl'
    ]
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    manifest: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      },
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          style: ['./src/styles/global.css', './src/styles/variables.css']
        }
      }
    }
  },

  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  },

  // Error handling and debugging
  clearScreen: false,
  logLevel: 'info'
});
