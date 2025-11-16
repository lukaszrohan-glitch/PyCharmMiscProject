import { useState, useEffect } from 'react';
import { adminListUsers, adminCreateUser, setAdminKey } from '../services/api';

export default function Admin({ lang }) {
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
      confirm_delete: { pl: 'Czy na pewno chcesz usunąć tego użytkownika?', en: 'Are you sure you want to delete this user?' },
      enter_admin_key: { pl: 'Wprowadź klucz administratora aby zarządzać użytkownikami', en: 'Enter admin key to manage users' },
      password_requirements: { pl: 'Hasło musi mieć co najmniej 8 znaków, zawierać littery, cyfry i znaki specjalne', en: 'Password must have at least 8 characters with letters, numbers and special characters' },
      no_users: { pl: 'Brak użytkowników', en: 'No users' }
    };
    return translations[key]?.[lang] || key;
  };

  const authenticate = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    setAdminKey(adminKey);
    try {
      const result = await adminListUsers();
      setUsers(result);
      setIsAuthed(true);
      setSuccess('✅ ' + t('authenticate'));
    } catch (err) {
      setError('❌ ' + err.message);
      setIsAuthed(false);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUserEmail.trim() || !newUserPassword.trim()) {
      setError('❌ Email and password are required');
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await adminCreateUser({ 
        email: newUserEmail, 
        password: newUserPassword,
        is_admin: newUserIsAdmin 
      });
      setSuccess('🎉 ' + t('user_added'));
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserIsAdmin(false);
      const updated = await adminListUsers();
      setUsers(updated);
    } catch (err) {
      setError('❌ ' + err.message);
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
      await fetch(`${import.meta.env.VITE_API_BASE || window.location.origin}/api/admin/users/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers: {
          'x-admin-key': adminKey
        }
      }).then(res => {
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
        return res.json();
      });
      const updated = await adminListUsers();
      setUsers(updated);
      setSuccess('✅ ' + t('user_deleted'));
    } catch (err) {
      setError('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthed) {
    return (
      <div className="api-key-auth">
        <div className="auth-card">
          <h2>🔐 {t('admin_key')}</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>{t('enter_admin_key')}</p>

          {error && <div className="error-msg">{error}</div>}
          {success && <div className="success-msg">{success}</div>}

          <input
            type="password"
            placeholder={t('admin_key')}
            value={adminKey}
            onChange={(e) => setAdminKeyInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && authenticate()}
            disabled={loading}
          />
          <button onClick={authenticate} disabled={loading || !adminKey.trim()}>
            {loading ? '⏳' : '🔓'} {t('authenticate')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="api-key-manager">
      <h2>👨‍💼 {t('admin_panel')}</h2>

      {error && <div className="error-msg">{error}</div>}
      {success && <div className="success-msg">{success}</div>}

      <div className="create-key-section">
        <h3>➕ {t('add_user')}</h3>
        <div className="create-key-form">
          <input
            placeholder={t('email')}
            type="email"
            value={newUserEmail}
            onChange={(e) => setNewUserEmail(e.target.value)}
            disabled={loading}
          />
          <input
            placeholder={t('password')}
            type="password"
            value={newUserPassword}
            onChange={(e) => setNewUserPassword(e.target.value)}
            disabled={loading}
            title={t('password_requirements')}
          />
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              checked={newUserIsAdmin}
              onChange={(e) => setNewUserIsAdmin(e.target.checked)}
              disabled={loading}
            />
            {t('is_admin')}
          </label>
          <button onClick={createUser} disabled={loading || !newUserEmail.trim() || !newUserPassword.trim()}>
            {loading ? '⏳' : '✨'} {t('create')}
          </button>
        </div>
      </div>

      <div className="keys-list">
        <h3>👥 {t('users')} ({users.length})</h3>
        {users.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
            {t('no_users')}
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('email')}</th>
                <th>{t('is_admin')}</th>
                <th>{t('created_at')}</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.email}</strong></td>
                  <td>{user.is_admin ? '✅ Yes' : '❌ No'}</td>
                  <td style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    {new Date(user.created_at).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-US')}
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
    </div>
  );
}
