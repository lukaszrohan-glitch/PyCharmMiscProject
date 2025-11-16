import React, { useState } from 'react'
import { useI18n } from '../i18n'
import { changePassword } from '../services/api'
import { useToast } from './Toast'

export default function Settings({ profile, onClose, onOpenAdmin, onLogout, lang }) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const { t } = useI18n()

  const isStrongPassword = (pwd) =>
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/.test(pwd)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (loading) return

    if (!oldPassword || !newPassword) {
      toast.show(t('password_both_required'), 'error')
      return
    }

    if (oldPassword === newPassword) {
      toast.show(t('password_same_error'), 'error')
      return
    }

    if (!isStrongPassword(newPassword)) {
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
      toast.show(t('password_change_failed'), 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleLogoutClick = () => {
    if (loading) return
    onClose()
    onLogout()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('settings')}</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="user-info">
          <h3>{t('profile')}</h3>
          <div className="info-grid">
            <div>
              <label>{t('email')}:</label>
              <div>{profile?.email}</div>
            </div>
            <div>
              <label>{t('company')}:</label>
              <div>{profile?.company_id || '-'}</div>
            </div>
            <div>
              <label>{t('subscription')}:</label>
              <div>{profile?.subscription_plan || 'free'}</div>
            </div>
            <div>
              <label>{t('role')}:</label>
              <div>{profile?.is_admin ? t('admin') : t('user')}</div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="change-password">
          <h3>{t('change_password')}</h3>
          <div className="form-group">
            <label htmlFor="old-password">{t('current_password')}</label>
            <input
              id="old-password"
              type="password"
              value={oldPassword}
              onChange={e => setOldPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="current-password"
            />
          </div>
          <div className="form-group">
            <label htmlFor="new-password">{t('new_password')}</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              required
              minLength={8}
              pattern="^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$"
              title={t('password_requirements')}
              autoComplete="new-password"
            />
            <small className="help-text">{t('password_hint')}</small>
          </div>
          <div className="form-actions">
            <button
              type="submit"
              disabled={loading || !oldPassword || !newPassword}
            >
              {loading ? t('changing') : t('change_password')}
            </button>
          </div>
        </form>

        <div className="account-actions">
          <button
            type="button"
            className="logout-btn"
            onClick={handleLogoutClick}
            disabled={loading}
          >
            {t('logout')}
          </button>
        </div>

        {profile?.is_admin && (
          <div className="admin-section">
            <h3>{t('admin_tools')}</h3>
            <div className="admin-actions">
              <button onClick={onOpenAdmin}>{t('admin_panel')}</button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .modal-content {
          background: var(--background);
          border-radius: 0.5rem;
          padding: 1.5rem;
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 25px -5px var(--shadow);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 0.5rem;
          margin: -0.5rem;
        }

        .user-info h3 {
          margin-top: 0;
        }

        .info-grid {
          display: grid;
          gap: 1rem;
          margin: 1rem 0 2rem;
        }

        .info-grid label {
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-group label {
          display: block;
          margin-bottom: 0.5rem;
          color: var(--text);
        }

        .help-text {
          display: block;
          margin-top: 0.25rem;
          color: var(--text-secondary);
          font-size: 0.875rem;
        }

        .form-actions {
          margin-top: 2rem;
        }

        .account-actions {
          margin-top: 1.5rem;
          border-top: 1px solid var(--border);
          padding-top: 1rem;
          display: flex;
          justify-content: flex-end;
        }

        .logout-btn {
          background: #b91c1c;
          color: #fff;
          border: none;
          border-radius: 0.375rem;
          padding: 0.5rem 1rem;
          cursor: pointer;
        }

        .logout-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .admin-section {
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border);
        }

        .admin-actions {
          display: grid;
          gap: 0.5rem;
          margin-top: 1rem;
        }

        @media (max-width: 640px) {
          .modal-content {
            margin: 1rem;
            max-height: calc(100vh - 2rem);
          }
        }
      `}</style>
    </div>
  )
}
