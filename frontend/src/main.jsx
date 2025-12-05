// Railway rebuild trigger: 2025-11-26T10:50:00Z - Force fresh build
import ReactDOM from 'react-dom/client';
import { StrictMode } from 'react';
import './styles/theme.css';
import App from './App';
import './styles.css';
import './style-fixes.css';
import ErrorBoundary from './components/ErrorBoundary';
import { AuthProvider } from './auth/AuthProvider';
import ToastProvider from './components/ToastProvider';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from './AppContext';
import { queryClient, QueryClientProvider } from './lib/queryClient';

// Ensure the root element exists
// ... existing code

// Initialize theme from localStorage or system preference
(function initTheme() {
  try {
    const saved = localStorage.getItem('theme');
    if (saved) {
      document.documentElement.setAttribute('data-theme', saved);
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Unable to initialize theme:', err)
    }
  }
})();

// Bootstrap React app
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppProvider>
            <ToastProvider>
              <ErrorBoundary>
                <App />
              </ErrorBoundary>
            </ToastProvider>
          </AppProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);

// Register service worker for PWA
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(() => {
        // SW registered successfully
      })
      .catch((error) => {
        console.warn('SW registration failed:', error);
      });
  });
}

