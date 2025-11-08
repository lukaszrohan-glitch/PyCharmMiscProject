import React, { useState } from 'react'
import { login, setToken } from '../services/api'

export default function Login({ onLogin, lang }) {
  const [email, setEmail] = useState('admin@example.com')
  const [password, setPassword] = useState('admin')
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
    try { const data = await login(email, password); setToken(data.token); onLogin(data) } catch(ex){ setErr(ex.message) } finally { setLoading(false) }
  }

  return (
    <div className="login-card">
      <h2>{t.title}</h2>
      {err && <div className="error">{t.err}: {err}</div>}
      <form onSubmit={submit}>
        <input placeholder={t.email} value={email} onChange={e=>setEmail(e.target.value)} />
        <input type="password" placeholder={t.password} value={password} onChange={e=>setPassword(e.target.value)} />
        <button type="submit" disabled={loading}>{loading? '...' : t.btn}</button>
      </form>
    </div>
  )
}
