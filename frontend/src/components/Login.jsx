import React, { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'

export default function Login({ lang, setLang }) {
  const { loginWithCredentials } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')

  const t = lang === 'pl' ? {
    tagline: 'System Zarządzania Produkcją',
    login: 'Zaloguj się',
    email: 'Email',
    password: 'Hasło',
    signIn: 'Zaloguj się',
    loading: 'Logowanie...',
    invalidCredentials: 'Błędny email lub hasło',
    error: 'Błąd logowania'
  } : {
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
      const { user } = await loginWithCredentials(email, password, remember)
      if (!user) setError(t.invalidCredentials)
    } catch (err) {
      console.error('Login error:', err)
      setError(err.message || t.error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-root">
      <div className="login-card">
        <div className="login-header">
          <div className="login-brand">Synterra</div>
          <div className="login-tagline">{t.tagline}</div>
        </div>

        {error && <div className="login-error" role="alert">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <label htmlFor="email" className="login-label">{t.email}</label>
          <input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="admin@arkuszowniasmb.pl" required disabled={loading} className="login-input" />

          <label htmlFor="password" className="login-label">{t.password}</label>
          <input id="password" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder={t.password} required disabled={loading} className="login-input" />

          <div className="login-remember">
            <label>
              <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} /> Remember me
            </label>
          </div>
          <button type="submit" className="login-submit" disabled={loading || !email || !password}>{loading ? t.loading : t.signIn}</button>
        </form>

        <div className="login-lang">
          <button className={lang==='pl' ? 'login-lang-active' : 'login-lang-btn'} onClick={()=>setLang('pl')}>PL</button>
          <button className={lang==='en' ? 'login-lang-active' : 'login-lang-btn'} onClick={()=>setLang('en')}>EN</button>
        </div>
      </div>

      <style jsx>{`
        .login-root { min-height: 100vh; display: grid; place-items: center; background:#f5f5f7; color:#1d1d1f; font-family:-apple-system,BlinkMacSystemFont,'SF Pro Text','Segoe UI',Roboto,Helvetica,Arial,sans-serif; }
        .login-card { width:100%; max-width:420px; background:#fff; border:1px solid #d2d2d7; border-radius:14px; padding:28px; box-shadow:0 10px 30px rgba(0,0,0,.06); }
        .login-header{ margin-bottom:20px; text-align:center; }
        .login-brand{ font-size:28px; font-weight:700; letter-spacing:-.02em; }
        .login-tagline{ margin-top:6px; color:#6e6e73; font-size:13px; }
        .login-error{ background:#fde7e7; color:#b62324; border:1px solid #e0b3b2; padding:10px 12px; border-radius:8px; margin-bottom:12px; }
        .login-form{ display:grid; gap:10px; }
        .login-remember{ display:flex; justify-content:flex-start; align-items:center; margin: 2px 0 8px; color:#6e6e73; font-size:12px; }
        .login-label{ font-size:12px; color:#3a3a3c; }
        .login-input{ height:42px; padding:0 12px; border-radius:10px; border:1px solid #d2d2d7; background:#fff; color:#1d1d1f; transition:box-shadow .2s,border-color .2s; }
        .login-input:focus{ outline:none; border-color:#3b82f6; box-shadow:0 0 0 3px rgba(59,130,246,.2); }
        .login-input:disabled{ background:#f5f5f7; color:#6e6e73; }
        .login-submit{ height:44px; border-radius:12px; border:1px solid #0071e3; background:#0071e3; color:#fff; font-weight:600; cursor:pointer; transition:background .2s, transform .02s; }
        .login-submit:hover:not(:disabled){ background:#0077ed; }
        .login-submit:active:not(:disabled){ transform: translateY(1px); }
        .login-submit:disabled{ opacity:.6; cursor:not-allowed; }
        .login-lang{ display:flex; gap:8px; justify-content:center; margin-top:16px; }
        .login-lang-btn,.login-lang-active{ padding:6px 12px; border-radius:10px; border:1px solid #d2d2d7; background:#fff; color:#1d1d1f; font-size:12px; }
        .login-lang-active{ background:#1d1d1f; color:#fff; border-color:#1d1d1f; }
        @media (prefers-color-scheme: dark){ .login-root{ background:#000; color:#f5f5f7; } .login-card{ background:#1c1c1e; border-color:#2c2c2e; } .login-label{ color:#9e9ea2; } .login-input{ background:#2c2c2e; border-color:#3a3a3c; color:#f5f5f7; } .login-input:disabled{ background:#242426; color:#9e9ea2; } .login-submit{ border-color:#0a84ff; background:#0a84ff; } .login-lang-btn{ background:#2c2c2e; color:#f5f5f7; border-color:#3a3a3c; } .login-lang-active{ background:#f5f5f7; color:#000; border-color:#f5f5f7; } }
      `}</style>
    </div>
  )
}
