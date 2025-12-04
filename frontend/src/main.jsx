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

// Ensure the root element exists
// ... existing code

// Force light theme (remove dark theme completely)
(function forceLightTheme() {
  try {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } catch (err) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Unable to enforce light theme:', err)
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
  </StrictMode>
);
