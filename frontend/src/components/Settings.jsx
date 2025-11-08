import React, { useState } from 'react'
import { changePassword } from '../services/api'
import { useToast } from './Toast'

export default function Settings({ profile, onClose, lang }) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const toast = useToast()

  const t = lang === 'pl' ? {
    settings: 'Ustawienia',
    profile: 'Profil',
    email: 'Email',
    subscription: 'Subskrypcja',
    admin: 'Administrator',
    yes: 'Tak',
    no: 'Nie',
    changePassword: 'Zmień hasło',
    oldPassword: 'Stare hasło',
    newPassword: 'Nowe hasło',
    confirmPassword: 'Potwierdź hasło',
    updatePassword: 'Aktualizuj hasło',
    close: 'Zamknij',
    passwordMismatch: 'Hasła nie pasują',
    passwordChanged: 'Hasło zmienione pomyślnie',
    passwordError: 'Błąd zmiany hasła'
  } : {
    settings: 'Settings',
    profile: 'Profile',
    email: 'Email',
    subscription: 'Subscription',
    admin: 'Administrator',
    yes: 'Yes',
    no: 'No',
    changePassword: 'Change Password',
    oldPassword: 'Old Password',
    newPassword: 'New Password',
    confirmPassword: 'Confirm Password',
    updatePassword: 'Update Password',
    close: 'Close',
    passwordMismatch: 'Passwords do not match',
    passwordChanged: 'Password changed successfully',
    passwordError: 'Error changing password'
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (newPassword !== confirmPassword) {
      setError(t.passwordMismatch)
      return
    }

    try {
      await changePassword(oldPassword, newPassword)
      setSuccess(t.passwordChanged)
      toast.show(t.passwordChanged)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      setError(t.passwordError + ': ' + err.message)
      toast.show(t.passwordError, 'error')
    }
  }

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>{t.settings}</h2>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="settings-content">
          <section className="settings-section">
            <h3>{t.profile}</h3>
            <div className="profile-info">
              <div className="info-row">
                <label>{t.email}:</label>
                <span>{profile?.email || '—'}</span>
              </div>
              <div className="info-row">
                <label>{t.subscription}:</label>
                <span className="badge-subscription">{profile?.subscription_plan || 'free'}</span>
              </div>
              <div className="info-row">
                <label>{t.admin}:</label>
                <span>{profile?.is_admin ? t.yes : t.no}</span>
              </div>
            </div>
          </section>

          <section className="settings-section">
            <h3>{t.changePassword}</h3>
            {error && <div className="error-msg">{error}</div>}
            {success && <div className="success-msg">{success}</div>}
            <form onSubmit={handlePasswordChange} className="password-form">
              <input
                type="password"
                placeholder={t.oldPassword}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder={t.newPassword}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
              />
              <input
                type="password"
                placeholder={t.confirmPassword}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
              />
              <button type="submit">{t.updatePassword}</button>
            </form>
          </section>
        </div>

        <div className="settings-footer">
          <button onClick={onClose}>{t.close}</button>
        </div>
      </div>
    </div>
  )
}

