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

// Force light theme (remove dark theme completely)
(function forceLightTheme() {
  try {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  } catch (_) {}
})();

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
