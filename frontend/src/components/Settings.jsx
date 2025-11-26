import {useState, useEffect, useRef} from 'react';
import { useI18n } from '../i18n'
import { changePassword } from '../services/api'
import { useToast } from '../lib/toastContext'
import styles from './Settings.module.css'

export default function Settings({ profile, onClose, onOpenAdmin }) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState('weak')
  const toast = useToast()
  const { t } = useI18n()
  const modalRef = useRef(null)
  const closeButtonRef = useRef(null)

  // Focus trap and Escape key handler
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    // Focus close button on mount
    closeButtonRef.current?.focus()

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Password strength calculator
  const calculatePasswordStrength = (pwd) => {
    if (!pwd || pwd.length < 8) return 'weak'

    let score = 0
    if (pwd.length >= 12) score++
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
    if (/\d/.test(pwd)) score++
    if (/[@$!%*#?&]/.test(pwd)) score++

    if (score <= 1) return 'weak'
    if (score <= 3) return 'medium'
    return 'strong'
  }

  // Update strength when password changes
  useEffect(() => {
    setPasswordStrength(calculatePasswordStrength(newPassword))
  }, [newPassword])

  // Keep validation simple and aligned with backend: min 8 chars
  const isStrongPassword = (pwd) => typeof pwd === 'string' && pwd.length >= 8

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return

    // podstawowa walidacja po stronie frontu
    if (!oldPassword || !newPassword) {
      toast.show(t('password_both_required'), 'error')
      return
    }

    if (oldPassword === newPassword) {
      toast.show(t('password_same_error'), 'error')
      return
    }

    if (!isStrongPassword(newPassword)) {
      // ten sam komunikat, co w title / hint
      toast.show(t('password_requirements'), 'error')
      return
    }

    setLoading(true)
    try {
      await changePassword(oldPassword, newPassword)
      toast.show(t('password_changed'), 'success')
      setOldPassword('')
      setNewPassword('')
      onClose()
    } catch (err) {
      console.error(err)
      // nie pokazujemy raw błędu z backendu
      toast.show(t('password_change_failed'), 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button type="button" className={styles.overlay} aria-label={t('close')} onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className={styles.modal}
        ref={modalRef}
      >
        {/* Header */}
        <div className={styles.header}>
          <h2 id="settings-title" className={styles.title}>
            {t('settings')}
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label={t('close') || 'Close'}
          >
            ×
          </button>
        </div>

        <div className={styles.content}>
          {/* Profile Info Section */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              {t('profile')}
            </h3>
            <div className={styles.infoGrid}>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>{t('email')}</div>
                <div className={styles.infoValue}>{profile?.email || '-'}</div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>{t('company')}</div>
                <div className={styles.infoValue}>{profile?.company_id || '-'}</div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>{t('subscription')}</div>
                <div className={styles.infoValue}>
                  <span className={profile?.subscription_plan === 'premium' ? styles.badgePremium : styles.badgeFree}>
                    {profile?.subscription_plan || 'free'}
                  </span>
                </div>
              </div>
              <div className={styles.infoItem}>
                <div className={styles.infoLabel}>{t('role')}</div>
                <div className={styles.infoValue}>
                  <span className={profile?.is_admin ? styles.badgeAdmin : styles.badgeUser}>
                    {profile?.is_admin ? '👑 ' + t('admin') : '👤 ' + t('user')}
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* Change Password Section */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              {t('change_password')}
            </h3>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.fieldGroup}>
                <label htmlFor="old-password" className={styles.label}>
                  {t('current_password')} <span>*</span>
                </label>
                <input
                  id="old-password"
                  type="password"
                  className={styles.input}
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  disabled={loading}
                  autoComplete="current-password"
                  aria-required="true"
                />
              </div>

              <div className={styles.fieldGroup}>
                <label htmlFor="new-password" className={styles.label}>
                  {t('new_password')} <span>*</span>
                </label>
                <input
                  id="new-password"
                  type="password"
                  className={styles.input}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={8}
                  disabled={loading}
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={newPassword && !isStrongPassword(newPassword) ? 'true' : 'false'}
                  aria-describedby="password-help password-strength"
                />
                <div id="password-help" className={styles.helpText}>
                  {t('password_hint')}
                </div>
                {newPassword && (
                  <div
                    id="password-strength"
                    className={styles.passwordStrength}
                    role="progressbar"
                    aria-label="Password strength"
                    aria-valuenow={passwordStrength === 'weak' ? 33 : passwordStrength === 'medium' ? 66 : 100}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    <div className={`${styles.passwordStrengthBar} ${styles[`strength${passwordStrength.charAt(0).toUpperCase() + passwordStrength.slice(1)}`]}`} />
                  </div>
                )}
              </div>

              <div className={styles.formActions}>
                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled={loading || !oldPassword || !newPassword || !isStrongPassword(newPassword)}
                  aria-busy={loading}
                >
                  {loading && <span className={styles.spinner} aria-hidden="true" />}
                  <span>{loading ? t('changing') : t('change_password')}</span>
                </button>
              </div>
            </form>
          </section>

          {/* Admin Section */}
          {profile?.is_admin && (
            <section className={`${styles.section} ${styles.adminSection}`}>
              <h3 className={styles.sectionTitle}>
                {t('admin_tools')}
              </h3>
              <div className={styles.adminActions}>
                <button
                  type="button"
                  className={styles.adminBtn}
                  onClick={onOpenAdmin}
                >
                  <span aria-hidden="true">⚙️</span>
                  <span>{t('admin_panel')}</span>
                </button>
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  )
}
