import { adminListUsers, adminCreateUser, setAdminKey, adminDeleteUser, adminUpdateUser, adminListPlans } from '../services/api';
import { useAuth } from '../auth/useAuth';
import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import AdminUsersPage from '../AdminUsersPage';
import styles from './Admin.module.css';
import classNames from 'classnames';
import { translateError } from '../services/api';

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
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showErrorDetails, setShowErrorDetails] = useState(false);
  const emailInputRef = useRef(null);
  const [filter, setFilter] = useState({ query: '', role: 'all', plan: 'all' });
  const [plans, setPlans] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showLegacyPage, setShowLegacyPage] = useState(false);
  const [sortBy, setSortBy] = useState({ field: 'created_at', direction: 'desc' });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, user: null });

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
    const preload = async () => {
      try {
        const planData = await adminListPlans();
        setPlans(planData || []);
      } catch (err) {
        console.warn('Unable to load plans', err);
      }
    };
     // If logged-in user is an admin, prefer JWT and skip admin key
     if (profile?.is_admin) {
       setError('');
       setSuccess('');
       setLoading(true);
       try {
        const result = await adminListUsers();
        setUsers(result || []);
        preload();
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
    setLoadingUsers(true);

    try {
      setAdminKey(trimmedKey);
      const result = await adminListUsers();
      setUsers(result || []);
      preload();
      setIsAuthed(true);
      setSuccess('✅ ' + t('authenticate'));
    } catch (err) {
      console.error('Admin authenticate error:', err);
      const msg = err?.message || String(err);
      setLastAdminErrorSafe(msg);

      // Handle token expiration - auto logout
      if (msg.includes('Invalid or expired token') || msg.includes('401') || err?.status === 401) {
        const expMsg = lang === 'pl' ? 'Token wygasł. Musisz się zalogować ponownie.' : 'Token expired. Please login again.';
        setError('❌ ' + expMsg);
        setIsAuthed(false);
        // Trigger logout after showing message
        setTimeout(() => {
          window.location.href = '/';
        }, 2000);
      } else {
        setIsAuthed(false);
        setError('❌ ' + t('error_auth_failed'));
      }
    } finally {
      setLoadingUsers(false);
    }
  }, [adminKey, profile?.is_admin, t]);

  useEffect(() => {
    if (profile?.is_admin && !isAuthed && !loadingUsers) {
      authenticate();
    }
  }, [profile?.is_admin, isAuthed, loadingUsers, authenticate]);

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
      setError(translateError(err, lang) || err?.message || 'Failed to create user');
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
      await adminDeleteUser(userId);

      const updated = await adminListUsers();
      setUsers(updated || []);
      setSuccess('✅ ' + t('user_deleted'));
      if (selectedUser?.id === userId) {
        setShowDrawer(false);
        setSelectedUser(null);
      }
    } catch (err) {
      console.error(err);
      setLastAdminErrorSafe(err?.message || String(err));
      setError('❌ ' + t('error_generic'));
    } finally {
      setLoading(false);
    }
  };

  const updateUserMeta = async (userId, payload) => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await adminUpdateUser(userId, payload);
      const updated = await adminListUsers();
      setUsers(updated || []);
      setSuccess('✅ User updated');
      if (selectedUser?.id === userId) {
        const refreshed = updated?.find(u => u.id === userId);
        if (refreshed) setSelectedUser(refreshed);
      }
    } catch (err) {
      console.error(err);
      setLastAdminErrorSafe(err?.message || String(err));
      setError('❌ ' + t('error_generic'));
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users
    .filter(user => {
      const matchesQuery = filter.query
        ? user.email.toLowerCase().includes(filter.query.toLowerCase())
          || user.company_id?.toLowerCase().includes(filter.query.toLowerCase())
        : true;
      const matchesRole = filter.role === 'all'
        ? true
        : filter.role === 'admin'
          ? user.is_admin
          : !user.is_admin;
      const matchesPlan = filter.plan === 'all'
        ? true
        : (user.subscription_plan || 'free') === filter.plan;
      return matchesQuery && matchesRole && matchesPlan;
    })
    .sort((a, b) => {
      const dir = sortBy.direction === 'asc' ? 1 : -1;
      if (sortBy.field === 'created_at') {
        return dir * (new Date(a.created_at || 0) - new Date(b.created_at || 0));
      }
      if (sortBy.field === 'email') {
        return dir * a.email.localeCompare(b.email);
      }
      return dir * ((a.id || 0) - (b.id || 0));
    });

  const openDrawer = (user) => {
    setSelectedUser(user);
    setShowDrawer(true);
  };

  const closeDrawer = () => {
    setShowDrawer(false);
    setSelectedUser(null);
  };

  const adminLayout = (
    <>
      <div className={styles.controlsBar}>
        <div className={styles.searchGroup}>
          <input
            type="search"
            placeholder={lang === 'pl' ? 'Szukaj użytkownika...' : 'Search users...'}
            value={filter.query}
            onChange={(e) => setFilter({ ...filter, query: e.target.value })}
          />
          <select
            value={filter.role}
            onChange={(e) => setFilter({ ...filter, role: e.target.value })}
          >
            <option value="all">{lang === 'pl' ? 'Wszyscy' : 'All roles'}</option>
            <option value="admin">{lang === 'pl' ? 'Administratorzy' : 'Admins'}</option>
            <option value="user">{lang === 'pl' ? 'Użytkownicy' : 'Users'}</option>
          </select>
          <select
            value={filter.plan}
            onChange={(e) => setFilter({ ...filter, plan: e.target.value })}
          >
            <option value="all">{lang === 'pl' ? 'Wszystkie plany' : 'All plans'}</option>
            {plans.map(plan => (
              <option key={plan.id || plan.name} value={plan.slug || plan.name}>
                {plan.name}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.rightControls}>
          <button type="button" onClick={() => setShowAdvanced(!showAdvanced)}>
            {showAdvanced ? '⬆️' : '⬇️'} {lang === 'pl' ? 'Zaawansowane' : 'Advanced'}
          </button>
          <button type="button" onClick={() => setShowLegacyPage(!showLegacyPage)}>
            {showLegacyPage ? '🧩' : '🗂️'} {lang === 'pl' ? 'Widok klasyczny' : 'Legacy view'}
          </button>
        </div>
      </div>

      {showAdvanced && (
        <div className={styles.advancedPanel}>
          <div>
            <label className={styles.filterLabel} htmlFor="admin-sort-field">
              {lang === 'pl' ? 'Sortuj według' : 'Sort by'}
            </label>
            <div className={styles.selectShell}>
              <select
                id="admin-sort-field"
                aria-label={lang === 'pl' ? 'Sortuj użytkowników według' : 'Sort users by'}
                value={sortBy.field}
                onChange={(e) => setSortBy({ ...sortBy, field: e.target.value })}
              >
                <option value="created_at">{lang === 'pl' ? 'Data utworzenia' : 'Created date'}</option>
                <option value="email">Email</option>
                <option value="id">ID</option>
              </select>
            </div>
          </div>
          <div>
            <label className={styles.filterLabel} htmlFor="admin-sort-direction">
              {lang === 'pl' ? 'Kierunek sortowania' : 'Sort direction'}
            </label>
            <div className={styles.selectShell}>
              <select
                id="admin-sort-direction"
                aria-label={lang === 'pl' ? 'Kierunek sortowania użytkowników' : 'Sort direction for users'}
                value={sortBy.direction}
                onChange={(e) => setSortBy({ ...sortBy, direction: e.target.value })}
              >
                <option value="asc">⬆️</option>
                <option value="desc">⬇️</option>
              </select>
            </div>
          </div>
          <button type="button" onClick={() => authenticate()}>
            🔄 {lang === 'pl' ? 'Odśwież listę' : 'Refresh list'}
          </button>
        </div>
      )}

      {showLegacyPage ? (
        <div className={styles.legacyEmbed}>
          <AdminUsersPage />
        </div>
      ) : (
        <section className={classNames('card-section--stacked', styles.section)}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon} aria-hidden="true">👥</span>
            {t('users')} ({filteredUsers.length})
          </h2>

          {filteredUsers.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon} aria-hidden="true">📭</div>
              <div className={styles.emptyTitle}>{t('no_users')}</div>
              <div className={styles.emptyDescription}>
                {lang === 'pl'
                  ? 'Dopasuj filtry lub dodaj nowego użytkownika'
                  : 'Adjust filters or create a new user'}
              </div>
            </div>
          ) : (
            <div className={classNames('table-shell--admin', styles.tableContainer)}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>{t('email')}</th>
                    <th>{t('is_admin')}</th>
                    <th>{lang === 'pl' ? 'Plan' : 'Plan'}</th>
                    <th>{t('created_at')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id}>
                      <td className={styles.tableEmail}>{user.email}</td>
                      <td>
                        <span className={classNames('admin-chip', styles.tableBadge, user.is_admin ? styles.badgeYes : styles.badgeNo)}>
                          <span aria-hidden="true">{user.is_admin ? '✅' : '❌'}</span>
                          {user.is_admin ? t('yes') : t('no')}
                        </span>
                      </td>
                      <td>{user.subscription_plan || 'free'}</td>
                      <td className={styles.tableDate}>
                        {user.created_at
                          ? new Date(user.created_at).toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-US', {
                              dateStyle: 'medium',
                              timeStyle: 'short'
                            })
                          : '—'}
                      </td>
                      <td className={styles.actionsCell}>
                        <button
                          type="button"
                          className={styles.tableAction}
                          onClick={() => openDrawer(user)}
                        >
                          <span aria-hidden="true">🔍</span> {lang === 'pl' ? 'Szczegóły' : 'Details'}
                        </button>
                        <button
                          type="button"
                          className={styles.tableAction}
                          onClick={() => setDeleteConfirm({ show: true, user })}
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
      )}
    </>
  );

  const drawer = showDrawer && selectedUser && (
    <div className={styles.drawer} role="dialog" aria-modal="true">
      <div className={styles.drawerHeader}>
        <h3>{selectedUser.email}</h3>
        <button type="button" onClick={closeDrawer}>✖️</button>
      </div>
      <div className={styles.drawerContent}>
        <div className={styles.drawerRow}>
          <span>{lang === 'pl' ? 'ID' : 'User ID'}</span>
          <strong>{selectedUser.id}</strong>
        </div>
        <div className={styles.drawerRow}>
          <span>{lang === 'pl' ? 'Firma' : 'Company'}</span>
          <strong>{selectedUser.company_id || '—'}</strong>
        </div>
        <div className={styles.drawerRow}>
          <span>{lang === 'pl' ? 'Plan' : 'Plan'}</span>
          <select
            value={selectedUser.subscription_plan || 'free'}
            onChange={(e) => updateUserMeta(selectedUser.id, { subscription_plan: e.target.value })}
          >
            <option value="free">free</option>
            <option value="basic">basic</option>
            <option value="pro">pro</option>
          </select>
        </div>
        <div className={styles.drawerRow}>
          <span>{lang === 'pl' ? 'Administrator' : 'Admin'}</span>
          <label className={styles.switch}>
            <span className="visually-hidden">
              {lang === 'pl' ? 'Przełącz uprawnienia administratora' : 'Toggle admin role'}
            </span>
            <input
              type="checkbox"
              checked={!!selectedUser.is_admin}
              onChange={(e) => updateUserMeta(selectedUser.id, { is_admin: e.target.checked })}
            />
            <span className={styles.slider} />
          </label>
        </div>
        <div className={styles.drawerRow}>
          <span>{lang === 'pl' ? 'Status' : 'Status'}</span>
          <label className={styles.switch}>
            <span className="visually-hidden">
              {lang === 'pl' ? 'Przełącz status konta' : 'Toggle account status'}
            </span>
            <input
              type="checkbox"
              checked={!!selectedUser.active}
              onChange={(e) => updateUserMeta(selectedUser.id, { active: e.target.checked })}
            />
            <span className={styles.slider} />
          </label>
        </div>
        <div className={styles.drawerRow}>
          <span>{lang === 'pl' ? 'Utworzono' : 'Created'}</span>
          <strong>
            {selectedUser.created_at
              ? new Date(selectedUser.created_at).toLocaleString(lang === 'pl' ? 'pl-PL' : 'en-US')
              : '—'}
          </strong>
        </div>
        <div className={styles.drawerActions}>
          <button type="button" className={styles.btnDanger} onClick={() => deleteUser(selectedUser.id)}>
            🗑️ {t('delete')}
          </button>
          <button type="button" className={styles.btnSecondary} onClick={closeDrawer}>
            {lang === 'pl' ? 'Zamknij' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );

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

  const StatIconUsers = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true" className={styles.statGlyph}>
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="8" r="3" />
        <path d="M3 19c0-3 2.5-5 6-5s6 2 6 5" />
        <circle cx="17" cy="7" r="2.2" />
        <path d="M15.5 13.5c1.3.4 2.5 1.5 2.5 3.5" />
      </g>
    </svg>
  );

  const StatIconCrown = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true" className={styles.statGlyph}>
      <path
        d="M4 9l3.5 3 4.5-6 4.5 6L20 9v9H4z"
        fill="url(#crownGradient)"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="crownGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0ea5e9" />
          <stop offset="100%" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
    </svg>
  );

  const StatIconPerson = () => (
    <svg width="32" height="32" viewBox="0 0 24 24" aria-hidden="true" className={styles.statGlyph}>
      <g fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
        <circle cx="12" cy="8" r="3.2" />
        <path d="M5 19c.5-3 3.5-5 7-5s6.5 2 7 5" strokeLinejoin="round" />
      </g>
    </svg>
  );

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
                  <StatIconUsers />
                  {users.length}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>{lang === 'pl' ? 'Administratorzy' : 'Administrators'}</div>
                <div className={styles.statValue}>
                  <StatIconCrown />
                  {adminCount}
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>{lang === 'pl' ? 'Zwykli użytkownicy' : 'Regular Users'}</div>
                <div className={styles.statValue}>
                  <StatIconPerson />
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
                    <div className={styles.inputShell}>
                      <span className={styles.inputIcon} aria-hidden="true">📧</span>
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
                  </div>

                  <div className={styles.fieldGroup}>
                    <label htmlFor="new-password" className={styles.label}>
                      {t('password')} <span className={styles.required}>*</span>
                    </label>
                    <div className={styles.inputShell}>
                      <span className={styles.inputIcon} aria-hidden="true">🔒</span>
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
                    </div>
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
                  <span>{loading ? '⏳' : '✨'} {lang === 'pl' ? 'Dodaj użytkownika' : 'Create user'}</span>
                </button>
              </form>
             </section>

            {adminLayout}
            {drawer}

            {/* Delete Confirmation Dialog */}
            {deleteConfirm.show && (
              <div className={styles.deleteConfirm} role="dialog" aria-modal="true">
                <div className={styles.deleteConfirmContent}>
                  <h3>{t('confirm_delete')}</h3>
                  <p>
                    {lang === 'pl'
                      ? 'Czy na pewno chcesz usunąć tego użytkownika?'
                      : 'Are you sure you want to delete this user?'}
                  </p>
                  <div className={styles.deleteConfirmActions}>
                    <button
                      type="button"
                      className={styles.btnDanger}
                      onClick={() => deleteUser(deleteConfirm.user.id)}
                    >
                      🗑️ {t('delete')}
                    </button>
                    <button
                      type="button"
                      className={styles.btnSecondary}
                      onClick={() => setDeleteConfirm({ show: false, user: null })}
                    >
                      {lang === 'pl' ? 'Anuluj' : 'Cancel'}
                    </button>
                  </div>
                </div>
              </div>
            )}
           </div>
         </div>
       </div>
     </div>
   );
 }
