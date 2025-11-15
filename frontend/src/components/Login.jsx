import React, { useState } from 'react'
import { login, setToken } from '../services/api.js'

export default function Login({ onLogin, lang }) {
  const [email, setEmail] = useState('admin@arkuszowniasmb.pl')
  const [password, setPassword] = useState('SMB#Admin2025!')
  const [err, setErr] = useState(null)
  const [loading, setLoading] = useState(false)

  const t = lang === 'pl' ? {
    title: 'Logowanie',
    email: 'E-mail', password: 'Hasło', btn: 'Zaloguj', err: 'Błąd logowania'
  } : {
    title: 'Login', email: 'Email', password: 'Password', btn: 'Sign in', err: 'Login error'
  }

  async function submit(e){
    e.preventDefault(); setErr(null); setLoading(true)
    try {
      const data = await login(email, password);
      if (data && data.tokens && data.tokens.access_token) {
        setToken(data.tokens.access_token);
        onLogin({ user: data.user, token: data.tokens.access_token });
      } else if (data && data.token) {
        setToken(data.token);
        onLogin(data);
      } else {
        throw new Error('Unexpected login response');
      }
    } catch(ex){ setErr(ex.message) } finally { setLoading(false) }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <h2 className="login-title">{t.title}</h2>
        {err && <div className="error">{t.err}: {err}</div>}
        <form onSubmit={submit} className="login-form">
          <label className="login-label">{t.email}</label>
          <input className="login-input" placeholder={t.email} value={email} onChange={e=>setEmail(e.target.value)} />
          <label className="login-label" style={{marginTop:8}}>{t.password}</label>
          <input className="login-input" type="password" placeholder={t.password} value={password} onChange={e=>setPassword(e.target.value)} />
          <button className="login-btn" type="submit" disabled={loading}>{loading? '…' : t.btn}</button>
        </form>
        <div className="login-help">{lang==='pl' ? 'Użyj danych administratora otrzymanych od zespołu.' : 'Use the admin credentials provided to you.'}</div>
      </div>

      <style jsx>{`
        .login-screen{ min-height:100vh; display:flex; align-items:center; justify-content:center; background:linear-gradient(180deg,#0f172a,#111827); color:#e5e7eb; padding:16px }
        .login-card{ width:100%; max-width:420px; background:#0b1220; border:1px solid #1f2937; border-radius:12px; padding:24px; box-shadow:0 20px 40px rgba(0,0,0,.4) }
        .login-title{ margin:0 0 12px 0; font-size:1.5rem }
        .login-form{ display:flex; flex-direction:column; gap:6px }
        .login-label{ font-size:.9rem; color:#9ca3af }
        .login-input{ background:#0a1020; border:1px solid #334155; color:#e5e7eb; padding:10px 12px; border-radius:8px }
        .login-input:focus{ outline:none; border-color:#60a5fa; box-shadow:0 0 0 3px rgba(59,130,246,.2) }
        .login-btn{ margin-top:14px; padding:10px 14px; background:#2563eb; color:white; border:none; border-radius:8px; cursor:pointer }
        .login-btn[disabled]{ opacity:.7; cursor:not-allowed }
        .error{ background:#7f1d1d; border:1px solid #fecaca; color:#fee2e2; padding:8px 10px; border-radius:8px; margin-bottom:8px }
        .login-help{ margin-top:10px; font-size:.85rem; color:#9ca3af }
      `}</style>
    </div>
  )
}
