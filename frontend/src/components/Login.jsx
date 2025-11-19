import React, { useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import ForgotPassword from './ForgotPassword'
import SynterraLogo from './SynterraLogo'
import styles from './Login.module.css'

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
      <div className={styles.root}>
        <div className={styles.card}>
          <div className={styles.header}>
            <div className={styles.logoWrap}>
              <SynterraLogo className={styles.logo} />
            </div>
            <div className={styles.tagline}><em>{t.tagline}</em></div>
          </div>
          <ForgotPassword lang={lang} onBack={() => setMode('login')} />
          <div className={styles.lang}>
            <button
              className={lang === 'pl' ? styles.langActive : styles.langBtn}
              onClick={() => setLang('pl')}
            >
              PL
            </button>
            <button
              className={lang === 'en' ? styles.langActive : styles.langBtn}
              onClick={() => setLang('en')}
            >
              EN
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logoWrap}>
            <SynterraLogo className={styles.logo} />
          </div>
          <div className={styles.tagline}><em>{t.tagline}</em></div>
        </div>

        {error && (
          <div className={styles.error} role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form} autoComplete="off">
          <label htmlFor="email" className={styles.label}>
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
            className={styles.input}
            autoComplete="off"
          />

          <label htmlFor="password" className={styles.label}>
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
            className={styles.input}
            autoComplete="new-password"
          />

          <div className={styles.remember}>
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
            className={styles.submit}
            disabled={loading || !email || !password}
          >
            {loading ? t.loading : t.signIn}
          </button>
        </form>

        <div className={styles.footerRow}>
          <button
            type="button"
            onClick={() => setMode('forgot')}
            className={styles.forgot}
          >
            {t.forgot}
          </button>
        </div>

        <div className={styles.lang}>
          <button
            className={lang === 'pl' ? styles.langActive : styles.langBtn}
            onClick={() => setLang('pl')}
          >
            PL
          </button>
          <button
            className={lang === 'en' ? styles.langActive : styles.langBtn}
            onClick={() => setLang('en')}
          >
            EN
          </button>
        </div>
      </div>
    </div>
  )
}
