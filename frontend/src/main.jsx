import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/theme.css';
import App from './App';
import './styles.css';
import './style-fixes.css';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './auth/AuthProvider';

// Ensure the root element exists
// ... existing code

// Theme bootstrap: set `.dark` class based on saved or OS preference
(function initTheme() {
  try {
    const saved = localStorage.getItem('theme'); // 'dark' | 'light' | null
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const mode = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', mode === 'dark');
  } catch (_) {
    // no-op (SSR or storage disabled)
  }
})();

export function setTheme(mode) {
  const isDark = mode === 'dark';
  document.documentElement.classList.toggle('dark', isDark);
  try { localStorage.setItem('theme', mode); } catch (_) {}
}

// Also expose on window for easy access from UI components without imports
try { window.setTheme = setTheme; } catch (_) {}

// Bootstrap React app
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </AuthProvider>
  </React.StrictMode>
);
