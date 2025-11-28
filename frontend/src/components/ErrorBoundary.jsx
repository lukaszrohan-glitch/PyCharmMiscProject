import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, errorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Frontend runtime error:', error, errorInfo);
    }
    this.setState({ errorInfo });

    if (process.env.NODE_ENV === 'production' && window.Sentry) {
      window.Sentry.captureException(error, {
        contexts: { react: { componentStack: errorInfo.componentStack } },
      });
    }
  }

  handleReload = () => {
    this.setState({ error: null, errorInfo: null });
    window.location.reload();
  };

  handleGoHome = () => {
    this.setState({ error: null, errorInfo: null });
    window.location.href = '/';
  };

  render() {
    if (this.state.error) {
      // Only show technical details in development
      const showDetails = process.env.NODE_ENV === 'development';

      return (
        <div
          style={{
            padding: '40px',
            maxWidth: '800px',
            margin: '0 auto',
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f7fafc',
          }}
        >
          <div
            style={{
              background: '#fff3cd',
              border: '1px solid #ffc107',
              borderRadius: '12px',
              padding: '32px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              width: '100%',
            }}
          >
            <h2
              style={{
                color: '#856404',
                margin: '0 0 16px 0',
                fontSize: '24px',
                fontWeight: '600',
              }}
            >
              ⚠️ Coś poszło nie tak
            </h2>
            <p
              style={{
                color: '#856404',
                margin: '0 0 24px 0',
                lineHeight: '1.6',
              }}
            >
              Przepraszamy, wystąpił nieoczekiwany błąd. Proszę odświeżyć stronę
              lub wrócić na stronę główną.
            </p>

            {showDetails && (
              <details
                open
                style={{ marginTop: '20px', fontSize: '14px' }}
              >
                <summary
                  style={{
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    marginBottom: '10px',
                    color: '#856404',
                  }}
                >
                  Szczegóły błędu / Error Details
                </summary>
                <pre
                  style={{
                    background: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    borderRadius: '4px',
                    padding: '12px',
                    overflow: 'auto',
                    fontSize: '12px',
                    color: '#212529',
                    whiteSpace: 'pre-wrap',
                    wordWrap: 'break-word',
                  }}
                >
                  <strong>Error:</strong> {this.state.error.toString()}
                  {'\n\n'}
                  <strong>Component Stack:</strong>
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button
                onClick={this.handleReload}
                style={{
                  background: '#0d6efd',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => (e.target.style.background = '#0b5ed7')}
                onMouseOut={(e) => (e.target.style.background = '#0d6efd')}
              >
                🔄 Odśwież stronę
              </button>
              <button
                onClick={this.handleGoHome}
                style={{
                  background: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '12px 24px',
                  fontSize: '16px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'background 0.2s',
                }}
                onMouseOver={(e) => (e.target.style.background = '#5a6268')}
                onMouseOut={(e) => (e.target.style.background = '#6c757d')}
              >
                🏠 Strona główna
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
