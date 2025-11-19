import React, { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import ForgotPassword from './ForgotPassword'
import SynterraLogo from './SynterraLogo'

export default function Login({ lang, setLang }) {
  const { loginWithCredentials } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [mode, setMode] = useState('login') // 'login' | 'forgot'

  const t = lang === 'pl' ? {
    tagline: 'System Zarządzania Produkcją',
    login: 'Zaloguj się',
    email: 'Email',
    password: 'Hasło',
    signIn: 'Zaloguj się',
    loading: 'Logowanie...',
    invalidCredentials: 'Błędny email lub hasło',
    error: 'Błąd logowania',
    forgot: 'Nie pamiętasz hasła?',
    locked:
      'Zbyt wiele nieudanych prób logowania. Konto jest tymczasowo zablokowane. Spróbuj ponownie za kilka minut lub skontaktuj się z administratorem.',
  } : {
    tagline: 'Manufacturing Management System',
    login: 'Sign In',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign In',
    loading: 'Signing in...',
    invalidCredentials: 'Invalid email or password',
    error: 'Login error',
    forgot: 'Forgot your password?',
    locked:
      'Too many failed login attempts. Your account is temporarily locked. Please try again later or contact an administrator.',
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      const { user } = await loginWithCredentials(email, password, remember)
      if (!user) setError(t.invalidCredentials)
      // security: clear password after attempt
      setPassword('')
    } catch (err) {
      console.error('Login error:', err)
      const msg = String(err?.message || '')
      if (msg.toLowerCase().includes('temporarily locked')) {
        setError(t.locked)
      } else if (
        msg.toLowerCase().includes('invalid credentials') ||
        msg.toLowerCase().includes('unauthorized')
      ) {
        setError(t.invalidCredentials)
      } else {
        setError(msg || t.error)
      }
      setPassword('')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'forgot') {
    return (
      <div className="login-root">
        <div className="login-card">
          <div className="login-header">
            <div className="login-logo-wrap">
              <SynterraLogo className="login-logo" />
            </div>
            <div className="login-tagline"><em>{t.tagline}</em></div>
          </div>
          <ForgotPassword lang={lang} onBack={() => setMode('login')} />
          <div className="login-lang">
            <button
              className={lang === 'pl' ? 'login-lang-active' : 'login-lang-btn'}
              onClick={() => setLang('pl')}
            >
              PL
            </button>
            <button
              className={lang === 'en' ? 'login-lang-active' : 'login-lang-btn'}
              onClick={() => setLang('en')}
            >
              EN
            </button>
          </div>
        </div>
        {/* styles stay shared with main mode below */}
      </div>
    )
  }

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo-wrap">
            <SynterraLogo className="login-logo" />
          </div>
          <div className="login-tagline"><em>{t.tagline}</em></div>
        </div>

        {error && (
          <div className="login-error" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form" autoComplete="off">
          <label htmlFor="email" className="login-label">
            {t.email}
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={lang === 'pl' ? 'Adres email' : 'Email address'}
            required
            disabled={loading}
            className="login-input"
            autoComplete="off"
          />

          <label htmlFor="password" className="login-label">
            {t.password}
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={lang === 'pl' ? 'Wpisz hasło' : 'Enter password'}
            required
            disabled={loading}
            className="login-input"
            autoComplete="new-password"
          />

          <div className="login-remember">
            <label>
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />{' '}
              <span>{lang === 'pl' ? 'Zapamiętaj mnie' : 'Remember me'}</span>
            </label>
          </div>

          <button
            type="submit"
            className="login-submit"
            disabled={loading || !email || !password}
          >
            {loading ? t.loading : t.signIn}
          </button>
        </form>

        <div className="login-footerRow">
          <button
            type="button"
            onClick={() => setMode('forgot')}
            className="login-forgot"
          >
            {t.forgot}
          </button>
        </div>

        <div className="login-lang">
          <button
            className={lang === 'pl' ? 'login-lang-active' : 'login-lang-btn'}
            onClick={() => setLang('pl')}
          >
            PL
          </button>
          <button
            className={lang === 'en' ? 'login-lang-active' : 'login-lang-btn'}
            onClick={() => setLang('en')}
          >
            EN
          </button>
        </div>
      </div>

      <style jsx>{`
        .login-root {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: radial-gradient(circle at top, #111827 0, #020617 55%, #000 100%);
          color: #f5f5f7;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI',
            Roboto, Helvetica, Arial, sans-serif;
          padding: 24px 16px;
        }
        .login-card {
          width: 100%;
          max-width: 420px;
          background: rgba(15, 23, 42, 0.96);
          border-radius: 18px;
          padding: 28px 26px 22px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.55);
          border: 1px solid rgba(148, 163, 184, 0.3);
          backdrop-filter: blur(26px);
        }
        .login-header {
          margin-bottom: 20px;
          text-align: center;
        }
        .login-logo-wrap {
          display: flex;
          justify-content: center;
          margin-bottom: 6px;
        }
        .login-logo {
          height: 46px;
        }
        .login-tagline {
          color: #9ca3af;
          font-size: 13px;
        }
        .login-error {
          background: #7f1d1d;
          color: #fee2e2;
          border: 1px solid #b91c1c;
          padding: 10px 12px;
          border-radius: 10px;
          margin-bottom: 12px;
          font-size: 13px;
        }
        .login-form {
          display: grid;
          gap: 10px;
        }
        .login-label {
          font-size: 12px;
          color: #d1d5db;
        }
        .login-input {
          height: 42px;
          padding: 0 12px;
          border-radius: 10px;
          border: 1px solid #374151;
          background: #020617;
          color: #f9fafb;
          transition: box-shadow 0.2s, border-color 0.2s, background 0.2s;
        }
        .login-input:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.35);
          background: #020617;
        }
        .login-input:disabled {
          background: #111827;
          color: #6b7280;
        }
        .login-remember {
          display: flex;
          justify-content: flex-start;
          align-items: center;
          margin: 4px 0 6px;
          color: #9ca3af;
          font-size: 12px;
        }
        .login-remember input[type='checkbox'] {
          accent-color: #0a84ff;
        }
        .login-submit {
          height: 44px;
          border-radius: 12px;
          border: 1px solid #0a84ff;
          background: #0a84ff;
          color: #ffffff;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.18s, transform 0.02s, box-shadow 0.18s;
          box-shadow: 0 0 0 1px rgba(15, 23, 42, 0.8);
        }
        .login-submit:hover:not(:disabled) {
          background: #2563eb;
          box-shadow: 0 18px 38px rgba(15, 23, 42, 0.7);
        }
        .login-submit:active:not(:disabled) {
          transform: translateY(1px);
        }
        .login-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .login-footerRow {
          margin-top: 10px;
          text-align: right;
          font-size: 12px;
        }
        .login-forgot {
          border: none;
          background: transparent;
          color: #38bdf8;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
        }
        .login-lang {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-top: 16px;
        }
        .login-lang-btn,
        .login-lang-active {
          padding: 6px 14px;
          border-radius: 999px;
          border: 1px solid #374151;
          background: #020617;
          color: #e5e7eb;
          font-size: 12px;
        }
        .login-lang-active {
          background: #f5f5f7;
          color: #020617;
          border-color: #f5f5f7;
        }
        @media (prefers-color-scheme: dark) {
          .login-root {
            background: radial-gradient(circle at top, #111827 0, #020617 55%, #000 100%);
          }
          .login-card {
            background: rgba(22, 22, 26, 0.98);
            border-color: #2c2c2e;
          }
          .login-input {
            background: #1c1c1e;
            border-color: #3a3a3c;
          }
          .login-submit {
            border-color: #0a84ff;
            background: #0a84ff;
          }
          .login-lang-btn {
            background: #1c1c1e;
            color: #f5f5f7;
            border-color: #3a3a3c;
          }
          .login-lang-active {
            background: #f5f5f7;
            color: #000;
            border-color: #f5f5f7;
          }
        }
      `}</style>
    </div>
  )
}
