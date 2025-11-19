import React, { useState } from 'react'
import { adminCreateUser } from '../services/api'

// Lightweight helper to invite a user (admin only). If JWT/admin key not present, shows a note.
export default function InviteUser({ lang = 'pl' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const t = lang === 'pl' ? {
    title: 'Zaproś użytkownika',
    email: 'E‑mail',
    password: 'Hasło (min. 8 znaków)',
    admin: 'Administrator',
    invite: 'Zaproś',
    note: 'Wymagane uprawnienia administratora (JWT lub klucz admina).',
    ok: 'Użytkownik dodany.'
  } : {
    title: 'Invite user',
    email: 'Email',
    password: 'Password (min 8 chars)',
    admin: 'Admin',
    invite: 'Invite',
    note: 'Admin privileges required (JWT or admin key).',
    ok: 'User created.'
  }

  const submit = async (e) => {
    e.preventDefault()
    if (loading) return
    setError(''); setMessage('')
    try {
      setLoading(true)
      if (!email || !password || password.length < 8) throw new Error('Invalid input')
      await adminCreateUser({ email, password, is_admin: !!isAdmin })
      setMessage(t.ok)
      setEmail(''); setPassword(''); setIsAdmin(false)
    } catch (err) {
      setError(err?.message || 'Error')
    } finally { setLoading(false) }
  }

  return (
    <div style={{ maxWidth: 520, margin: '20px auto', padding: 12 }}>
      <h3 style={{ marginTop: 0 }}>{t.title}</h3>
      <p style={{ color: '#6b7280', marginTop: 0 }}>{t.note}</p>
      {message && <div style={{ background:'#ecfdf5', border:'1px solid #a7f3d0', color:'#065f46', padding:10, borderRadius:8 }}>{message}</div>}
      {error && <div style={{ background:'#fee2e2', border:'1px solid #fecaca', color:'#991b1b', padding:10, borderRadius:8 }}>{error}</div>}
      <form onSubmit={submit} style={{ display: 'grid', gap: 8 }}>
        <label>{t.email}</label>
        <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        <label>{t.password}</label>
        <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={8} />
        <label style={{ display:'flex', alignItems:'center', gap:8 }}>
          <input type="checkbox" checked={isAdmin} onChange={e=>setIsAdmin(e.target.checked)} /> {t.admin}
        </label>
        <div>
          <button type="submit" disabled={loading || !email || !password || password.length < 8}>{t.invite}</button>
        </div>
      </form>
    </div>
  )
}
