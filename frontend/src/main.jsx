import { createRoot } from 'react-dom/client'
import App from './App'
import './styles.css'
import { ToastProvider } from './components/Toast'
import ErrorBoundary from './ErrorBoundary'
import { I18nProvider } from './i18n.jsx'


createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <I18nProvider defaultLang="pl">
      <ToastProvider>
        <App />
      </ToastProvider>
    </I18nProvider>
  </ErrorBoundary>
)
