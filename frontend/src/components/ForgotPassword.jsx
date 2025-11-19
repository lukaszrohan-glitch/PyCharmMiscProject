import React, { useState } from 'react'
import { requestPasswordReset } from '../services/api'

// Minimal, safe placeholder: no backend endpoint exists yet
export default function ForgotPassword({ lang = 'pl', onBack }) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const t = lang === 'pl' ? {
    title: 'Reset hasła',
    desc: 'Podaj swój e‑mail. Jeśli konto istnieje, wyślemy instrukcje resetu hasła (lub pojawią się w logach administratora).',
    email: 'E‑mail',
    submit: 'Wyślij prośbę',
    back: 'Powrót',
    sent: 'Jeśli konto istnieje, żądanie resetu zostało przyjęte. Sprawdź pocztę lub skontaktuj się z administratorem.',
    genericError: 'Nie udało się wysłać prośby o reset hasła. Spróbuj ponownie później.'
  } : {
    title: 'Password reset',
    desc: 'Enter your email. If the account exists, password reset instructions will be processed (or appear in admin logs).',
    email: 'Email',
    submit: 'Submit request',
    back: 'Back',
    sent: 'If the account exists, the reset request has been accepted. Check your email or contact your administrator.',
    genericError: 'Failed to submit password reset request. Please try again later.'
  }

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!email || loading) return
    setError('')
    setLoading(true)
    try {
      await requestPasswordReset(email)
      // Do not leak whether email exists; always show success
      setSubmitted(true)
    } catch (err) {
      console.error('Forgot password error:', err)
      // Still show success-style message to avoid user enumeration
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>{t.title}</h2>
      <p style={{ color: '#6b7280' }}>{t.desc}</p>
      {!submitted ? (
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
          <label htmlFor="email">{t.email}</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e=>setEmail(e.target.value)}
            required
            disabled={loading}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={loading || !email}>
              {loading ? '...' : t.submit}
            </button>
            {onBack && (
              <button type="button" onClick={onBack} disabled={loading}>
                {t.back}
              </button>
            )}
          </div>
          {error && (
            <div style={{ marginTop: 8, color: '#b91c1c', fontSize: 13 }}>{error}</div>
          )}
        </form>
      ) : (
        <>
          <div
            style={{
              background:'#e5f6ff',
              border:'1px solid #bae6fd',
              color:'#0c4a6e',
              padding:12,
              borderRadius:8,
            }}
          >
            {t.sent}
          </div>
          {onBack && (
            <div style={{ marginTop:12 }}>
              <button onClick={onBack}>{t.back}</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
