import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props){
    super(props)
    this.state = { error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error){
    return { error }
  }

  componentDidCatch(error, errorInfo){
    // eslint-disable-next-line no-console
    console.error('Frontend runtime error:', error, errorInfo)
    this.setState({ errorInfo })

    // Send to error tracking service (e.g., Sentry) in production
    if (process.env.NODE_ENV === 'production' && window.Sentry) {
      window.Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
    }
  }

  handleReload = () => {
    this.setState({ error: null, errorInfo: null })
    window.location.reload()
  }

  handleGoHome = () => {
    this.setState({ error: null, errorInfo: null })
    window.location.href = '/'
  }

  render(){
    if(this.state.error){
      const isDev = process.env.NODE_ENV === 'development'

      return (
        <div style={{
          padding: '40px',
          maxWidth: '800px',
          margin: '0 auto',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
        }}>
          <div style={{
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            padding: '24px',
            marginBottom: '20px'
          }}>
            <h2 style={{ color: '#856404', margin: '0 0 16px 0', fontSize: '24px' }}>
              ⚠️ Coś poszło nie tak
            </h2>
            <p style={{ color: '#856404', margin: '0 0 20px 0', lineHeight: '1.6' }}>
              Przepraszamy, wystąpił nieoczekiwany błąd. Proszę odświeżyć stronę lub wrócić na stronę główną.
            </p>

            {isDev && (
              <details style={{ marginTop: '20px', fontSize: '14px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px' }}>
                  Szczegóły techniczne (tylko tryb deweloperski)
                </summary>
                <pre style={{
                  background: '#f8f9fa',
                  border: '1px solid #dee2e6',
                  borderRadius: '4px',
                  padding: '12px',
                  overflow: 'auto',
                  fontSize: '12px',
                  color: '#212529',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word'
                }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>

          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={this.handleReload}
              style={{
                background: '#0d6efd',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 24px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              🔄 Odśwież stronę
            </button>
            <button
              onClick={this.handleGoHome}
              style={{
                background: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '12px 24px',
                fontSize: '16px',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              🏠 Strona główna
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

