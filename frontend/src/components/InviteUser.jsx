import React, { useState } from 'react'
import { adminCreateUser } from '../services/api'

// Admin-only helper to invite a user. Uses the same card / button styling
// as the rest of the app so it visually matches the dashboard.
export default function InviteUser({ lang = 'pl' }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const t = lang === 'pl' ? {
    title: 'Dodaj użytkownika',
    subtitle: 'Twórz konta użytkowników i przydzielaj im uprawnienia administratora.',
    email: 'E‑mail',
    password: 'Hasło (min. 8 znaków)',
    admin: 'Administrator',
    invite: 'Utwórz',
    note: 'Operacja wymaga uprawnień administratora (JWT lub klucz admina).',
    ok: 'Użytkownik został dodany.'
  } : {
    title: 'Add user',
    subtitle: 'Create user accounts and assign administrator privileges.',
    email: 'Email',
    password: 'Password (min 8 chars)',
    admin: 'Administrator',
    invite: 'Create',
    note: 'Requires administrator privileges (JWT or admin key).',
    ok: 'User has been created.'
  }

  const submit = async (e) => {
    e.preventDefault()
    if (loading) return
    setError('')
    setMessage('')

    try {
      if (!email || !password || password.length < 8) {
        throw new Error(lang === 'pl' ? 'Uzupełnij poprawnie wszystkie pola.' : 'Please fill in all fields correctly.')
      }

      setLoading(true)
      await adminCreateUser({ email, password, is_admin: !!isAdmin })
      setMessage(t.ok)
      setEmail('')
      setPassword('')
      setIsAdmin(false)
    } catch (err) {
      setError(err?.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="card admin-invite-card">
      <header className="card-header">
        <div className="card-title-row">
          <span className="card-icon" aria-hidden="true">➕</span>
          <div>
            <h2 className="card-title">{t.title}</h2>
            <p className="card-subtitle">{t.subtitle}</p>
          </div>
        </div>
      </header>

      <p className="card-hint">{t.note}</p>

      {message && (
        <div className="alert alert-success" role="status">
          {message}
        </div>
      )}
      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      <form onSubmit={submit} className="form-grid">
        <label className="field">
          <span className="field-label">{t.email}</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="field-input"
          />
        </label>

        <label className="field">
          <span className="field-label">{t.password}</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="field-input"
          />
        </label>

        <label className="field field-inline">
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
          />
          <span className="field-label">{t.admin}</span>
        </label>

        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={
              loading ||
              !email ||
              !password ||
              password.length < 8
            }
          >
            {loading ? '…' : t.invite}
          </button>
        </div>
      </form>
    </section>
  )
}
