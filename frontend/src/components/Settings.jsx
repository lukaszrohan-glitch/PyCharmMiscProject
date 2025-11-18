import React, { useState } from 'react'
import { useI18n } from '../i18n'
import { changePassword } from '../services/api'
import { useToast } from './Toast'

export default function Settings({ profile, onClose, onOpenAdmin }) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const toast = useToast()
  const { t } = useI18n()

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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">{t('settings')}</div>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="user-info">
          <h3 className="section-title">{t('profile')}</h3>
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
          <h3 className="section-title">{t('change_password')}</h3>
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
            <button type="submit" className="primary" disabled={loading || !oldPassword || !newPassword}>
              {loading ? t('changing') : t('change_password')}
            </button>
          </div>
        </form>

        {profile?.is_admin && (
          <div className="admin-section">
            <h3 className="section-title">{t('admin_tools')}</h3>
            <div className="admin-actions">
              <button className="secondary" onClick={onOpenAdmin}>{t('admin_panel')}</button>
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

        .modal-content { background: var(--background); border-radius: 16px; padding: 22px; width:100%; max-width:560px; max-height:90vh; overflow:auto; box-shadow: 0 24px 60px rgba(0,0,0,.2); border:1px solid var(--border); }

        .modal-header { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom: 10px; }
        .modal-title { font-size: 20px; font-weight: 700; letter-spacing:-.02em; }

        .close-btn { background: transparent; border:1px solid var(--border); width:28px; height:28px; display:grid; place-items:center; border-radius:8px; color: var(--text-secondary); cursor:pointer; }
        .close-btn:hover { background: var(--surface-hover); }

        .section-title { font-size:14px; color: var(--text-secondary); font-weight:700; margin: 14px 0 8px; text-transform: uppercase; letter-spacing:.06em; }
        .info-grid { display:grid; gap:12px; margin: 8px 0 18px; }

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

        .form-actions { margin-top: 16px; display:flex; justify-content:flex-end; }
        .primary { background:#0071e3; color:#fff; border:1px solid #0071e3; padding:10px 16px; border-radius:12px; font-weight:600; }
        .primary:hover { background:#0077ed; }
        .secondary { background:#fff; color:#1d1d1f; border:1px solid var(--border); padding:10px 16px; border-radius:12px; font-weight:600; }
        .secondary:hover { background: var(--surface-hover); }

        .admin-section {
          margin-top: 2rem;
          padding-top: 1rem;
          border-top: 1px solid var(--border);
        }

        .admin-actions { display:flex; gap:8px; margin-top: 8px; }

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
