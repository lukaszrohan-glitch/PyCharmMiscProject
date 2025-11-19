import React, { useState } from 'react'

// Minimal, safe placeholder: no backend endpoint exists yet
export default function ForgotPassword({ lang = 'pl', onBack }) {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const t = lang === 'pl' ? {
    title: 'Reset hasła',
    desc: 'Obecnie reset hasła jest zarządzany przez administratora. Wpisz swój e‑mail, a wyświetlimy instrukcje kontaktu.',
    email: 'E‑mail',
    submit: 'Wyślij prośbę',
    back: 'Powrót',
    sent: 'Prośba została zapisana lokalnie. Skontaktuj się z administratorem w celu resetu hasła.'
  } : {
    title: 'Password reset',
    desc: 'Password resets are currently handled by an administrator. Enter your email and we will show you contact instructions.',
    email: 'Email',
    submit: 'Submit request',
    back: 'Back',
    sent: 'Request noted locally. Please contact your administrator to reset your password.'
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (!email) return
    try { sessionStorage.setItem('forgot_pw_last_email', email) } catch {}
    setSubmitted(true)
  }

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 16 }}>
      <h2 style={{ marginTop: 0 }}>{t.title}</h2>
      <p style={{ color: '#6b7280' }}>{t.desc}</p>
      {!submitted ? (
        <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
          <label htmlFor="email">{t.email}</label>
          <input id="email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit">{t.submit}</button>
            {onBack && <button type="button" onClick={onBack}>{t.back}</button>}
          </div>
        </form>
      ) : (
        <>
          <div style={{ background:'#e5f6ff', border:'1px solid #bae6fd', color:'#0c4a6e', padding:12, borderRadius:8 }}>{t.sent}</div>
          {onBack && <div style={{ marginTop:12 }}><button onClick={onBack}>{t.back}</button></div>}
        </>
      )}
    </div>
  )
}
