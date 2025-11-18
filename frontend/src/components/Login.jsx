import React, { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'

export default function Login({ lang, setLang }) {
  const { loginWithCredentials } = useAuth()
  const [email, setEmail] = useState('admin@arkuszowniasmb.pl')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const t = lang === 'pl' ? {
    appName: 'Synterra',
    tagline: 'System Zarzadzania Produkcja',
    login: 'Zaloguj się',
    email: 'Email',
    password: 'Hasło',
    signIn: 'Zaloguj się',
    loading: 'Logowanie...',
    invalidCredentials: 'Błędny email lub hasło',
    error: 'Błąd logowania'
  } : {
    appName: 'Synterra',
    tagline: 'Manufacturing Management System',
    login: 'Sign In',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign In',
    loading: 'Signing in...',
    invalidCredentials: 'Invalid email or password',
    error: 'Login error'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return

    setError('')
    setLoading(true)

    try {
      const { user } = await loginWithCredentials(email, password)
      if (!user) setError(t.invalidCredentials)
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || t.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="logo-section">
          <h1>{t.appName}</h1>
          <p>{t.tagline}</p>
        </div>

        <form onSubmit={handleSubmit}>
          <h2>{t.login}</h2>

          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label htmlFor="email">{t.email}</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="admin@arkuszowniasmb.pl"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t.password}</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder={t.password}
              required
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading || !email || !password}>
            {loading ? t.loading : t.signIn}
          </button>
        </form>

        <div className="lang-switch">
          <button
            className={lang === 'pl' ? 'lang-active' : 'lang-btn'}
            onClick={() => setLang('pl')}
          >
            PL
          </button>
          <button
            className={lang === 'en' ? 'lang-active' : 'lang-btn'}
            onClick={() => setLang('en')}
          >
            EN
          </button>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
        }

        .login-box {
          background: white;
          border-radius: 8px;
          padding: 2rem;
          width: 100%;
          max-width: 400px;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }

        .logo-section {
          text-align: center;
          margin-bottom: 2rem;
        }

        .logo-section h1 {
          margin: 0;
          color: #333;
          font-size: 1.5rem;
        }

        .logo-section p {
          margin: 0.5rem 0 0;
          color: #666;
          font-size: 0.875rem;
        }

        form {
          margin-bottom: 1.5rem;
        }

        form h2 {
          margin: 0 0 1.5rem;
          color: #333;
          font-size: 1.25rem;
        }

        .error-message {
          background: #fee;
          color: #c33;
          padding: 0.75rem;
          border-radius: 4px;
          margin-bottom: 1rem;
          font-size: 0.875rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: #333;
          font-size: 0.875rem;
          font-weight: 500;
        }

        .form-group input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 1rem;
          box-sizing: border-box;
          transition: border-color 0.3s;
        }

        .form-group input:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .form-group input:disabled {
          background: #f5f5f5;
          cursor: not-allowed;
        }

        button[type="submit"] {
          width: 100%;
          padding: 0.75rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 4px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.3s;
        }

        button[type="submit"]:hover:not(:disabled) {
          opacity: 0.9;
        }

        button[type="submit"]:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .lang-switch {
          display: flex;
          gap: 0.5rem;
          justify-content: center;
        }

        .lang-btn, .lang-active {
          padding: 0.5rem 1rem;
          border: 1px solid #ddd;
          background: white;
          border-radius: 4px;
          cursor: pointer;
          font-size: 0.875rem;
          transition: all 0.3s;
        }

        .lang-btn:hover {
          border-color: #667eea;
          color: #667eea;
        }

        .lang-active {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }

        @media (max-width: 640px) {
          .login-box {
            margin: 1rem;
          }
        }
      `}</style>
    </div>
  )
}
