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
    locked: 'Zbyt wiele nieudanych prób logowania. Konto jest tymczasowo zablokowane. Spróbuj ponownie za kilka minut lub skontaktuj się z administratorem.'
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
    locked: 'Too many failed login attempts. Your account is temporarily locked. Please try again later or contact an administrator.'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setLoading(true)
    try {
      const { user } = await loginWithCredentials(email, password, remember)
      if (!user) setError(t.invalidCredentials)
    } catch (err) {
      console.error('Login error:', err)
      const msg = String(err?.message || '')
      // Map rate-limit / lockout style messages to a clearer text
      if (msg.toLowerCase().includes('temporarily locked')) {
        setError(t.locked)
      } else if (msg.toLowerCase().includes('invalid credentials') || msg.toLowerCase().includes('unauthorized')) {
        setError(t.invalidCredentials)
      } else {
        setError(msg || t.error)
      }
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
          <ForgotPassword
            lang={lang}
            onBack={() => setMode('login')}
          />
          <div className="login-lang">
            <button
              className={lang==='pl' ? 'login-lang-active' : 'login-lang-btn'}
              onClick={()=>setLang('pl')}
            >
              PL
            </button>
            <button
              className={lang==='en' ? 'login-lang-active' : 'login-lang-btn'}
              onClick={()=>setLang('en')}
            >
              EN
            </button>
          </div>
        </div>
        <style jsx>{`
          .login-root { min-height: 100vh; display: grid; place-items: center; background:#0b0b0f; color:#f5f5f7; font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
          .login-card { width:100%; max-width:420px; background:#111827; border:1px solid #1f2937; border-radius:14px; padding:28px; box-shadow:0 20px 60px rgba(0,0,0,.5); }
          .login-header{ margin-bottom:20px; text-align:center; }
          .login-logo-wrap{ display:flex; justify-content:center; margin-bottom:6px; }
          .login-logo{ height:46px; }
          .login-tagline{ color:#9ca3af; font-size:13px; }
          .login-error{ background:#7f1d1d; color:#fee2e2; border:1px solid #b91c1c; padding:10px 12px; border-radius:8px; margin-bottom:12px; }
          .login-form{ display:grid; gap:10px; }
          .login-remember{ display:flex; justify-content:flex-start; align-items:center; margin: 2px 0 8px; color:#6e6e73; font-size:12px; }
          .login-label{ font-size:12px; color:#d1d5db; }
          .login-input{ height:42px; padding:0 12px; border-radius:10px; border:1px solid #374151; background:#1f2937; color:#f9fafb; transition:box-shadow .2s,border-color .2s; }
          .login-input:focus{ outline:none; border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.3); }
          .login-input:disabled{ background:#111827; color:#6b7280; }
          .login-submit{ height:44px; border-radius:12px; border:1px solid #3b82f6; background:#3b82f6; color:#fff; font-weight:600; cursor:pointer; transition:background .2s, transform .02s; }
          .login-submit:hover:not(:disabled){ background:#2563eb; }
          .login-submit:active:not(:disabled){ transform: translateY(1px); }
          .login-submit:disabled{ opacity:.6; cursor:not-allowed; }
          .login-lang{ display:flex; gap:8px; justify-content:center; margin-top:16px; }
          .login-lang-btn,.login-lang-active{ padding:6px 12px; border-radius:10px; border:1px solid #374151; background:#111827; color:#e5e7eb; font-size:12px; }
          .login-lang-active{ background:#e5e7eb; color:#111827; border-color:#e5e7eb; }
          @media (prefers-color-scheme: dark){ .login-root{ background:#000; color:#f5f5f7; } .login-card{ background:#1c1c1e; border-color:#2c2c2e; } .login-label{ color:#9e9ea2; } .login-input{ background:#2c2c2e; border-color:#3a3a3c; color:#f5f5f7; } .login-input:disabled{ background:#242426; color:#9e9ea2; } .login-submit{ border-color:#0a84ff; background:#0a84ff; } .login-lang-btn{ background:#2c2c2e; color:#f5f5f7; border-color:#3a3a3c; } .login-lang-active{ background:#f5f5f7; color:#000; border-color:#f5f5f7; } }
        `}</style>
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

        {error && <div className="login-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="email" className="login-label">{t.email}</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            placeholder="admin@arkuszowniasmb.pl"
            required
            disabled={loading}
            className="login-input"
          />

          <label htmlFor="password" className="login-label">{t.password}</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e=>setPassword(e.target.value)}
            placeholder={t.password}
            required
            disabled={loading}
            className="login-input"
          />

          <div className="login-remember">
            <label>
              <input
                type="checkbox"
                checked={remember}
                onChange={e=>setRemember(e.target.checked)}
              />{' '}
              Remember me
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

        <div style={{ marginTop: 8, textAlign: 'right', fontSize: 12 }}>
          <button
            type="button"
            onClick={() => setMode('forgot')}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#2563eb',
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'underline'
            }}
          >
            {t.forgot}
          </button>
        </div>

        <div className="login-lang">
          <button
            className={lang==='pl' ? 'login-lang-active' : 'login-lang-btn'}
            onClick={()=>setLang('pl')}
          >
            PL
          </button>
          <button
            className={lang==='en' ? 'login-lang-active' : 'login-lang-btn'}
            onClick={()=>setLang('en')}
          >
            EN
          </button>
        </div>
      </div>

      <style jsx>{`
        .login-root { min-height: 100vh; display: grid; place-items: center; background:#0b0b0f; color:#f5f5f7; font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
        .login-card { width:100%; max-width:420px; background:#111827; border:1px solid #1f2937; border-radius:14px; padding:28px; box-shadow:0 20px 60px rgba(0,0,0,.5); }
        .login-header{ margin-bottom:20px; text-align:center; }
        .login-logo-wrap{ display:flex; justify-content:center; margin-bottom:6px; }
        .login-logo{ height:46px; }
        .login-tagline{ color:#9ca3af; font-size:13px; }
        .login-error{ background:#7f1d1d; color:#fee2e2; border:1px solid #b91c1c; padding:10px 12px; border-radius:8px; margin-bottom:12px; }
        .login-form{ display:grid; gap:10px; }
        .login-remember{ display:flex; justify-content:flex-start; align-items:center; margin: 2px 0 8px; color:#6e6e73; font-size:12px; }
        .login-label{ font-size:12px; color:#d1d5db; }
        .login-input{ height:42px; padding:0 12px; border-radius:10px; border:1px solid #374151; background:#1f2937; color:#f9fafb; transition:box-shadow .2s,border-color .2s; }
        .login-input:focus{ outline:none; border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.3); }
        .login-input:disabled{ background:#111827; color:#6b7280; }
        .login-submit{ height:44px; border-radius:12px; border:1px solid #3b82f6; background:#3b82f6; color:#fff; font-weight:600; cursor:pointer; transition:background .2s, transform .02s; }
        .login-submit:hover:not(:disabled){ background:#2563eb; }
        .login-submit:active:not(:disabled){ transform: translateY(1px); }
        .login-submit:disabled{ opacity:.6; cursor:not-allowed; }
        .login-lang{ display:flex; gap:8px; justify-content:center; margin-top:16px; }
        .login-lang-btn,.login-lang-active{ padding:6px 12px; border-radius:10px; border:1px solid #374151; background:#111827; color:#e5e7eb; font-size:12px; }
        .login-lang-active{ background:#e5e7eb; color:#111827; border-color:#e5e7eb; }
        @media (prefers-color-scheme: dark){ .login-root{ background:#000; color:#f5f5f7; } .login-card{ background:#1c1c1e; border-color:#2c2c2e; } .login-label{ color:#9e9ea2; } .login-input{ background:#2c2c2e; border-color:#3a3a3c; color:#f5f5f7; } .login-input:disabled{ background:#242426; color:#9e9ea2; } .login-submit{ border-color:#0a84ff; background:#0a84ff; } .login-lang-btn{ background:#2c2c2e; color:#f5f5f7; border-color:#3a3a3c; } .login-lang-active{ background:#f5f5f7; color:#000; border-color:#f5f5f7; } }
      `}</style>
    </div>
  )
}
