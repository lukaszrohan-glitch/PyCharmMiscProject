import { useEffect, useState } from 'react';
import { adminListUsers, adminCreateUser, setAdminKey, getToken } from '../services/api';
import { useAuth } from '../auth/AuthProvider';

export default function Admin({ lang }) {
  const { profile } = useAuth();
  const [users, setUsers] = useState([]);
  const [adminKey, setAdminKeyInput] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserIsAdmin, setNewUserIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(false);

  const t = (key) => {
    const translations = {
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
    };
    return translations[key]?.[lang] || key;
  };

  useEffect(() => {
    if (profile?.is_admin && !isAuthed && !loading) {
      authenticate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.is_admin]);

  // Align front-end validation with backend: minimum 8 characters
  const isStrongPassword = (pwd) => typeof pwd === 'string' && pwd.length >= 8;

  const authenticate = async () => {
    // If logged-in user is an admin, prefer JWT and skip admin key
    if (profile?.is_admin) {
      setError('');
      setSuccess('');
      setLoading(true);
      try {
        const result = await adminListUsers();
        setUsers(result || []);
        setIsAuthed(true);
        setSuccess(' ' + t('authenticate'));
      } catch (err) { console.error(err); try { window.lastAdminError = err?.message || String(err) } catch {}
        setIsAuthed(false);
        setError(' ' + t('error_generic'));
        try { document.getElementById('admin-error-details').textContent = err?.message || String(err) } catch {}
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
      // Uwaga: zadbaj, żeby setAdminKey NIE zapisywał klucza w localStorage,
      // tylko np. w pamięci i dodawał nagłówek x-admin-key do zapytań admina.
      setAdminKey(trimmedKey);
      const result = await adminListUsers();
      setUsers(result || []);
      setIsAuthed(true);
      setSuccess('✅ ' + t('authenticate'));
    } catch (err) { console.error(err); try { window.lastAdminError = err?.message || String(err) } catch {}
      setIsAuthed(false);
      setError('❌ ' + t('error_auth_failed'));
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err) { console.error(err); try { window.lastAdminError = err?.message || String(err) } catch {}
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
    } catch (err) { console.error(err); try { window.lastAdminError = err?.message || String(err) } catch {}
      setError('❌ ' + t('error_generic'));
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthed && !profile?.is_admin) {
    return (
      <div className="page page--admin">
        <div className="card card--admin-auth">
          <h2>🔐 {t('admin_key')}</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
            {t('enter_admin_key')}
          </p>

          {error && (
            <div className="error-msg" style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span>{error}</span>
              <button
                type="button"
                onClick={(e)=>{
                  e.preventDefault();
                  const el = document.getElementById('admin-error-details');
                  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
                }}
                style={{ marginLeft: 8, background:'transparent', border:'none', color:'#6e6e73', cursor:'pointer' }}
              >
                details
              </button>
            </div>
          )}
          <pre id="admin-error-details" style={{display:'none', whiteSpace:'pre-wrap', background:'#f5f5f7', border:'1px solid #d2d2d7', padding:'8px', borderRadius:'8px', color:'#1d1d1f'}}>
          </pre>
          {success && <div className="success-msg">{success}</div>}

          <input
            type="password"
            placeholder={t('admin_key')}
            value={adminKey}
            onChange={(e) => setAdminKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !loading && authenticate()}
            disabled={loading}
            autoComplete="off"
          />
          <button
            onClick={authenticate}
            disabled={loading || !adminKey.trim()}
          >
            {loading ? '⏳' : '🔓'} {t('authenticate')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page page--admin">
      <div className="card card--admin-main">
        <h2>
          👨‍💼 {t('admin_panel')}
        </h2>

        {/* Intentionally hide the generic error banner to reduce noise in Admin */}
        {success && <div className="success-msg">{success}</div>}

        <section className="card-section card-section--stacked">
          <div className="create-key-section">
            <h3>➕ {t('add_user')}</h3>
            <div className="create-key-form">
              <input
                placeholder={t('email')}
                type="email"
                value={newUserEmail}
                onChange={(e) => setNewUserEmail(e.target.value)}
                disabled={loading}
                required
                autoComplete="email"
              />
              <input
                placeholder={t('password')}
                type="password"
                value={newUserPassword}
                onChange={(e) => setNewUserPassword(e.target.value)}
                disabled={loading}
                title={t('password_requirements')}
                required
                autoComplete="new-password"
              />
              <label
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <input
                  type="checkbox"
                  checked={newUserIsAdmin}
                  onChange={(e) => setNewUserIsAdmin(e.target.checked)}
                  disabled={loading}
                />
                {t('is_admin')}
              </label>
              <button
                onClick={createUser}
                disabled={
                  loading ||
                  !newUserEmail.trim() ||
                  !newUserPassword.trim()
                }
              >
                {loading ? '⏳' : '✨'} {t('create')}
              </button>
            </div>
          </div>
        </section>

        <section className="card-section card-section--flush">
          <div className="keys-list">
            <h3>
              👥 {t('users')} ({users.length})
            </h3>
            {users.length === 0 ? (
              <p
                style={{
                  textAlign: 'center',
                  color: '#9ca3af',
                  padding: '2rem'
                }}
              >
                {t('no_users')}
              </p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>{t('email')}</th>
                    <th>{t('is_admin')}</th>
                    <th>{t('created_at')}</th>
                    <th style={{ textAlign: 'right' }}>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.email}</strong>
                      </td>
                      <td>
                        {user.is_admin ? `✅ ${t('yes')}` : `❌ ${t('no')}`}
                      </td>
                      <td
                        style={{
                          fontSize: '0.85rem',
                          color: '#6b7280'
                        }}
                      >
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString(
                              lang === 'pl' ? 'pl-PL' : 'en-US'
                            )
                          : '—'}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="delete-btn"
                          onClick={() => deleteUser(user.id)}
                          disabled={loading}
                        >
                          🗑️ {t('delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
