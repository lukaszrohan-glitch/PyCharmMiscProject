import { useState } from 'react';
import { adminListKeys, adminCreateKey, adminDeleteKey, setAdminKey } from '../services/api';

export default function ApiKeyManager({ lang }) {
  const [keys, setKeys] = useState([]);
  const [adminKey, setAdminKeyInput] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  const [loading, setLoading] = useState(false);

  const t = (key) => {
    const translations = {
      admin_key: { pl: 'Klucz Admin', en: 'Admin Key' },
      authenticate: { pl: 'Uwierzytelnij', en: 'Authenticate' },
      api_keys: { pl: 'Klucze API', en: 'API Keys' },
      create_new: { pl: 'Utwórz nowy klucz', en: 'Create New Key' },
      label: { pl: 'Etykieta', en: 'Label' },
      create: { pl: 'Utwórz', en: 'Create' },
      delete: { pl: 'Usuń', en: 'Delete' },
      created: { pl: 'Utworzono', en: 'Created' },
      copy: { pl: 'Kopiuj', en: 'Copy' },
      copied: { pl: 'Skopiowano!', en: 'Copied!' },
      active: { pl: 'Aktywny', en: 'Active' },
      key_created: {
        pl: 'Klucz utworzony! Skopiuj go teraz – nie będzie widoczny ponownie.',
        en: "Key created! Copy it now – it won't be shown again."
      },
      confirm_delete: { pl: 'Czy na pewno chcesz usunąć ten klucz?', en: 'Are you sure you want to delete this key?' },
      enter_admin_key: { pl: 'Wprowadź klucz administratora aby zarządzać kluczami API', en: 'Enter admin key to manage API keys' }
    };
    return translations[key]?.[lang] || key;
  };

  const authenticate = async () => {
    if (!adminKey.trim()) {
      setError('❌ ' + t('enter_admin_key'));
      return;
    }
    setError('');
    setSuccess('');
    setLoading(true);
    setAdminKey(adminKey.trim());
    try {
      const result = await adminListKeys();
      setKeys(result || []);
      setIsAuthed(true);
      setSuccess('✅ ' + t('authenticate'));
    } catch (err) {
      setError('❌ ' + (err?.message || t('enter_admin_key')));
      setIsAuthed(false);
    } finally {
      setLoading(false);
    }
  };

  const createKey = async () => {
    if (!newLabel.trim()) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const result = await adminCreateKey({ label: newLabel });
      setSuccess(`🎉 ${t('key_created')}\n\n${result.api_key}`);
      setNewLabel('');
      const updated = await adminListKeys();
      setKeys(updated);
    } catch (err) {
      setError('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteKey = async (keyId) => {
    if (!confirm(t('confirm_delete'))) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await adminDeleteKey(keyId);
      const updated = await adminListKeys();
      setKeys(updated);
      setSuccess('✅ ' + t('delete'));
    } catch (err) {
      setError('❌ ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator?.clipboard?.writeText(text);
      setSuccess('✅ ' + t('copied'));
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      setError('❌ ' + (err?.message || 'Clipboard error'));
    }
  };

  const handleKeyDown = (evt, action) => {
    if (evt.key === 'Enter') {
      evt.preventDefault();
      action();
    }
  };

  if (!isAuthed) {
    return (
      <div className="api-key-auth">
        <div className="auth-card" role="form" aria-label="Admin authentication">
          <h2>🔐 {t('admin_key')}</h2>
          <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>{t('enter_admin_key')}</p>

          {error && <div className="error-msg" role="alert">{error}</div>}
          {success && <div className="success-msg" role="status">{success}</div>}

          <label htmlFor="admin-key-input" className="sr-only">{t('admin_key')}</label>
          <input
            id="admin-key-input"
            type="password"
            placeholder={t('admin_key')}
            value={adminKey}
            onChange={(e) => setAdminKeyInput(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, authenticate)}
            disabled={loading}
            autoComplete="off"
          />
          <button type="button" onClick={authenticate} disabled={loading || !adminKey.trim()}>
            {loading ? '⏳' : '🔓'} {t('authenticate')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="api-key-manager">
      <h2>🔑 {t('api_keys')}</h2>

      {error && <div className="error-msg" role="alert">{error}</div>}
      {success && (
        <div className="success-msg" style={{ whiteSpace: 'pre-wrap' }} role="status">
          {success}
        </div>
      )}

      <div className="create-key-section">
        <h3>➕ {t('create_new')}</h3>
        <form
          className="create-key-form"
          onSubmit={(e) => {
            e.preventDefault();
            createKey();
          }}
        >
          <label htmlFor="new-key-label" className="sr-only">{t('label')}</label>
          <input
            id="new-key-label"
            placeholder={t('label')}
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, createKey)}
            disabled={loading}
            maxLength={60}
          />
          <button type="submit" disabled={loading || !newLabel.trim()}>
            {loading ? '⏳' : '✨'} {t('create')}
          </button>
        </form>
      </div>

      <div className="keys-list">
        <h3>📋 {t('active')} ({keys.length})</h3>
        {keys.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#9ca3af', padding: '2rem' }}>
            {lang === 'pl' ? 'Brak kluczy API' : 'No API keys'}
          </p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>{t('label')}</th>
                <th>Key</th>
                <th>{t('created')}</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {keys.map((key) => (
                <tr key={key.id}>
                  <td><strong>{key.label}</strong></td>
                  <td>
                    <code>
                      {key.key_text ? `${key.key_text.substring(0, 20)}...` : '***'}
                    </code>
                    {key.key_text && (
                      <button
                        type="button"
                        className="copy-btn"
                        onClick={() => copyToClipboard(key.key_text)}
                        title={t('copy')}
                        aria-label={`${t('copy')} ${key.label}`}
                      >
                        📋
                      </button>
                    )}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: '#6b7280' }}>
                    {key.created_at
                      ? new Date(key.created_at).toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-US')
                      : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="delete-btn"
                      onClick={() => deleteKey(key.id)}
                      disabled={loading}
                      aria-label={`${t('delete')} ${key.label}`}
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