import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/variables.css';
import './styles/global.css';

// Ensure the root element exists
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found! Add <div id="root"></div> to index.html');
}

const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

