import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { adminListUsers, adminCreateUser, setAdminKey, getToken } from '../services/api';
import { useAuth } from '../auth/useAuth';
import styles from './Admin.module.css';
import classNames from 'classnames';

export default function Admin({ lang }) {
  const { profile } = useAuth();
  const setLastAdminErrorSafe = (message) => {
    try {
      window.lastAdminError = message;
    } catch {
      // ignore if window unavailable
    }
  };
  const [users, setUsers] = useState([]);
  const [adminKey, setAdminKeyInput] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const emailInputRef = useRef(null);

  const translations = useMemo(() => ({
      admin_panel: { pl: 'Panel Administratora', en: 'Admin Panel' },
      admin_key: { pl: 'Klucz Admin', en: 'Admin Key' },
      authenticate: { pl: 'Uwierzytelnij', en: 'Authenticate' },
      users: { pl: 'Użytkownicy', en: 'Users' },
      add_user: { pl: 'Dodaj użytkownika', en: 'Add User' },
      email: { pl: 'E-mail', en: 'Email' },
      password: { pl: 'Hasło', en: 'Password' },
      is_admin: { pl: 'Administrator', en: 'Admin' },
      create: { pl: 'Utwórz', en: 'Create' },
      delete: { pl: 'Usuń', en: 'Delete' },
      created_at: { pl: 'Data utworzenia', en: 'Created At' },
      user_added: { pl: 'Użytkownik dodany!', en: 'User added!' },
      user_deleted: { pl: 'Użytkownik usunięty!', en: 'User deleted!' },
      confirm_delete: {
        pl: 'Czy na pewno chcesz usunąć tego użytkownika?',
        en: 'Are you sure you want to delete this user?'
      },
      enter_admin_key: {
        pl: 'Wprowadź klucz administratora aby zarządzać użytkownikami',
        en: 'Enter admin key to manage users'
      },
      password_requirements: {
        pl: 'Hasło musi mieć co najmniej 8 znaków, zawierać litery, cyfry i znaki specjalne',
        en: 'Password must have at least 8 characters with letters, numbers and special characters'
      },
      no_users: { pl: 'Brak użytkowników', en: 'No users' },
      error_generic: {
        pl: 'Coś poszło nie tak. Spróbuj ponownie.',
        en: 'Something went wrong. Please try again.'
      },
      error_auth_failed: {
        pl: 'Uwierzytelnianie nie powiodło się. Sprawdź klucz admina.',
        en: 'Authentication failed. Check the admin key.'
      },
      error_required: {
        pl: 'E-mail i hasło są wymagane.',
        en: 'Email and password are required.'
      },
      error_password_weak: {
        pl: 'Hasło nie spełnia wymagań złożoności.',
        en: 'Password does not meet complexity requirements.'
      },
      yes: { pl: 'Tak', en: 'Yes' },
      no: { pl: 'Nie', en: 'No' },
      actions: { pl: 'Akcje', en: 'Actions' }
    }), [])

  const t = useCallback((key) => translations[key]?.[lang] || key, [lang, translations])

  const authenticate = useCallback(async () => {
    // If logged-in user is an admin, prefer JWT and skip admin key
    if (profile?.is_admin) {
      setError('');
      setSuccess('');
      setLoading(true);
      try {
        const result = await adminListUsers();
        setUsers(result || []);
        setIsAuthed(true);
        setSuccess('✅ ' + t('authenticate'));
        // Focus email input after successful auth
        setTimeout(() => emailInputRef.current?.focus(), 100);
      } catch (err) {
        console.error(err);
        const errorMsg = err?.message || String(err);
        setLastAdminErrorSafe(errorMsg);
        setIsAuthed(false);
        setError('❌ ' + t('error_generic') + ' - ' + errorMsg);
      } finally {
        setLoading(false);
      }
      return;
    }
    const trimmedKey = adminKey.trim();
    if (!trimmedKey) {
      setError('❌ ' + t('error_auth_failed'));
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      setAdminKey(trimmedKey);
      const result = await adminListUsers();
      setUsers(result || []);
      setIsAuthed(true);
      setSuccess('✅ ' + t('authenticate'));
    } catch (err) {
      console.error(err);
      setLastAdminErrorSafe(err?.message || String(err));
      setIsAuthed(false);
      setError('❌ ' + t('error_auth_failed'));
    } finally {
      setLoading(false);
    }
  }, [adminKey, profile?.is_admin, t]);

  useEffect(() => {
    if (profile?.is_admin && !isAuthed && !loading) {
      authenticate();
    }
  }, [profile?.is_admin, isAuthed, loading, authenticate]);

  // Align front-end validation with backend: minimum 8 characters
  const isStrongPassword = (pwd) => typeof pwd === 'string' && pwd.length >= 8;

  const createUser = async () => {
    const email = newUserEmail.trim();
    const password = newUserPassword;

    if (!email || !password) {
      setError('❌ ' + t('error_required'));
      return;
    }

    if (!isStrongPassword(password)) {
      setError('❌ ' + t('error_password_weak'));
      return;
    }

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await adminCreateUser({
        email,
        password,
        is_admin: newUserIsAdmin
      });

      setSuccess('🎉 ' + t('user_added'));
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserIsAdmin(false);

      const updated = await adminListUsers();
      setUsers(updated || []);
    } catch (err) {
      console.error(err);
      setLastAdminErrorSafe(err?.message || String(err));
      setError('❌ ' + t('error_generic'));
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (!confirm(t('confirm_delete'))) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const base = import.meta.env.VITE_API_BASE || window.location.origin;
      const headers = {};
      const tok = getToken();
      if (profile?.is_admin && tok) headers['Authorization'] = 'Bearer ' + tok;
      else headers['x-admin-key'] = adminKey.trim();
      const res = await fetch(`${base}/api/admin/users/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers
      });

      if (!res.ok) {
        throw new Error(`HTTP_${res.status}`);
      }

      await res.json().catch(() => ({})); // ignore body, just in case

      const updated = await adminListUsers();
      setUsers(updated || []);
      setSuccess('✅ ' + t('user_deleted'));
    } catch (err) {
      console.error(err);
      setLastAdminErrorSafe(err?.message || String(err));
      setError('❌ ' + t('error_generic'));
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthed && !profile?.is_admin) {
    return (
      <div className={classNames('page', 'page--admin', styles.page)}>
        <div className={classNames('card--admin-main', styles.container)}>
          <div className={`${styles.card} ${styles.authCard}`}>
            <h1 className={styles.authTitle}>
              <span aria-hidden="true">🔐</span>
              {t('admin_key')}
            </h1>
            <p className={styles.authDescription}>
              {t('enter_admin_key')}
            </p>

            {error && (
              <div className={`${styles.alert} ${styles.alertError}`} role="alert">
                <span className={styles.alertIcon} aria-hidden="true">⚠️</span>
                <div className={styles.alertContent}>
                  <div>{error}</div>
                  {window.lastAdminError && (
                    <>
                      <div className={styles.alertActions}>
                        <button
                          type="button"
                          className={styles.alertBtn}
                          onClick={() => setShowErrorDetails(!showErrorDetails)}
                          aria-expanded={showErrorDetails}
                        >
                          {showErrorDetails ? 'Hide' : 'Show'} details
                        </button>
                      </div>
                      {showErrorDetails && (
                        <div className={styles.errorDetails}>
                          {window.lastAdminError}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {success && (
              <div className={`${styles.alert} ${styles.alertSuccess}`} role="status">
                <span className={styles.alertIcon} aria-hidden="true">✅</span>
                <div className={styles.alertContent}>{success}</div>
              </div>
            )}

            <form
              onSubmit={(e) => { e.preventDefault(); authenticate(); }}
              className={styles.form}
            >
              <div className={styles.fieldGroup}>
                <label htmlFor="admin-key" className={styles.label}>
                  {t('admin_key')} <span className={styles.required}>*</span>
                </label>
                <input
                  id="admin-key"
                  type="password"
                  className={styles.input}
                  placeholder="••••••••••••••"
                  value={adminKey}
                  onChange={(e) => setAdminKeyInput(e.target.value)}
                  disabled={loading}
                  autoComplete="off"
                  required
                  aria-required="true"
                />
              </div>

              <button
                type="submit"
                className={`${styles.btn} ${styles.btnPrimary}`}
                disabled={loading || !adminKey.trim()}
                aria-busy={loading}
              >
                {loading && <span className={styles.spinner} aria-hidden="true" />}
                <span>{loading ? '⏳ Authenticating...' : '🔓 ' + t('authenticate')}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const adminCount = users.filter(u => u.is_admin).length;
  const regularCount = users.length - adminCount;

  return (
    <div className={classNames('page', 'page--admin', styles.page)}>
      <div className={classNames('card--admin-main', styles.container)}>
        <div className={classNames('card-section--stacked', styles.card)}>
          {/* Header */}
          <div className={classNames('card-header--split', styles.header)}>
            <h1 className={styles.title}>
              <span className={styles.titleIcon} aria-hidden="true">👨‍💼</span>
              {t('admin_panel')}
            </h1>
            <p className={styles.subtitle}>
              {lang === 'pl'
                ? 'Zarządzaj użytkownikami systemu'
                : 'Manage system users'}
            </p>
          </div>

          {/* Alerts */}
          {(error || success) && (
            <div className={styles.alerts}>
              {success && (
                <div className={`${styles.alert} ${styles.alertSuccess}`} role="status">
                  <span className={styles.alertIcon} aria-hidden="true">✅</span>
                  <div className={styles.alertContent}>{success}</div>
                </div>
              )}
              {error && (
                <div className={`${styles.alert} ${styles.alertError}`} role="alert">
                  <span className={styles.alertIcon} aria-hidden="true">⚠️</span>
                  <div className={styles.alertContent}>{error}</div>
                </div>
              )}
            </div>
          )}

          <div className={classNames('card-section--stacked', styles.content)}>
            {/* Stats */}
            <div className={styles.stats}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>{t('users')}</div>
                <div className={styles.statValue}>
                  <span className={styles.statIcon} aria-hidden="true">👥</span>
                  {users.length}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>{lang === 'pl' ? 'Administratorzy' : 'Administrators'}</div>
                <div className={styles.statValue}>
                  <span className={styles.statIcon} aria-hidden="true">👑</span>
                  {adminCount}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>{lang === 'pl' ? 'Zwykli użytkownicy' : 'Regular Users'}</div>
                <div className={styles.statValue}>
                  <span className={styles.statIcon} aria-hidden="true">👤</span>
                  {regularCount}
                </div>
              </div>
            </div>

            {/* Add User Section */}
            <section className={classNames('card-section--stacked', styles.section)}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon} aria-hidden="true">➕</span>
                {t('add_user')}
              </h2>
              <p className={styles.sectionDescription}>
                {lang === 'pl'
                  ? 'Utwórz nowego użytkownika z dostępem do systemu'
                  : 'Create a new user with access to the system'}
              </p>

              <form
                onSubmit={(e) => { e.preventDefault(); createUser(); }}
                className={styles.form}
              >
                <div className={styles.formGrid}>
                  <div className={styles.fieldGroup}>
                    <label htmlFor="new-email" className={styles.label}>
                      {t('email')} <span className={styles.required}>*</span>
                    </label>
                    <input
                      ref={emailInputRef}
                      id="new-email"
                      type="email"
                      className={styles.input}
                      placeholder={lang === 'pl' ? 'uzytkownik@example.com' : 'user@example.com'}
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      disabled={loading}
                      required
                      autoComplete="email"
                      aria-required="true"
                    />
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="new-password" className={styles.label}>
                      {t('password')} <span className={styles.required}>*</span>
                    </label>
                    <input
                      id="new-password"
                      type="password"
                      className={styles.input}
                      placeholder="••••••••"
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      disabled={loading}
                      required
                      minLength={8}
                      title={t('password_requirements')}
                      autoComplete="new-password"
                      aria-required="true"
                    />
                    <span className={styles.helpText}>
                      {t('password_requirements')}
                    </span>
                  </div>
                </div>

                <fieldset className={styles.actionsRow}>
                  <legend className="visually-hidden">{t('actions')}</legend>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={newUserIsAdmin}
                      onChange={(e) => setNewUserIsAdmin(e.target.checked)}
                    />
                    {t('is_admin')}
                  </label>
                  <button
                    type="button"
                    className={styles.infoBadge}
                    onClick={() => alert(t('password_requirements'))}
                  >
                    ℹ️ {lang === 'pl' ? 'Wymagania hasła' : 'Password rules'}
                  </button>
                </fieldset>

                <button
                  type="submit"
                  className={`${styles.btn} ${styles.btnPrimary}`}
                  disabled={loading || !newUserEmail.trim() || !newUserPassword.trim()}
                  aria-busy={loading}
                >
                  {loading && <span className={styles.spinner} aria-hidden="true" />}
                  <span>{loading ? '⏳' : '✨'} {t('create')}</span>
                </button>
              </form>
            </section>

            {/* Users List Section */}
            <section className={classNames('card-section--stacked', styles.section)}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.sectionIcon} aria-hidden="true">👥</span>
                {t('users')} ({users.length})
              </h2>

              {users.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon} aria-hidden="true">📭</div>
                  <div className={styles.emptyTitle}>{t('no_users')}</div>
                  <div className={styles.emptyDescription}>
                    {lang === 'pl'
                      ? 'Dodaj pierwszego użytkownika używając formularza powyżej'
                      : 'Add your first user using the form above'}
                  </div>
                </div>
              ) : (
                <div className={classNames('table-shell--admin', styles.tableContainer)}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>{t('email')}</th>
                        <th>{t('is_admin')}</th>
                        <th>{t('created_at')}</th>
                        <th>{t('actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className={styles.tableEmail}>{user.email}</td>
                          <td>
                            <span className={classNames('admin-chip', styles.tableBadge, user.is_admin ? styles.badgeYes : styles.badgeNo)}>
                              <span aria-hidden="true">{user.is_admin ? '✅' : '❌'}</span>
                              {user.is_admin ? t('yes') : t('no')}
                            </span>
                          </td>
                          <td className={styles.tableDate}>
                            {user.created_at
                              ? new Date(user.created_at).toLocaleDateString(
                                  lang === 'pl' ? 'pl-PL' : 'en-US'
                                )
                              : '—'}
                          </td>
                          <td>
                            <button
                              type="button"
                              className={styles.tableAction}
                              onClick={() => deleteUser(user.id)}
                            >
                              <span aria-hidden="true">🗑️</span> {t('delete')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
