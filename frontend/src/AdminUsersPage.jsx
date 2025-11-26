import { useEffect, useState, useCallback, useMemo } from 'react';

const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    email: '',
    company_id: '',
    is_admin: false,
    subscription_plan: 'free',
    password: '',
  });

  const authToken = typeof window !== 'undefined' ? localStorage.getItem('authToken') : null;
  const commonHeaders = useMemo(() => ({
    'Content-Type': 'application/json',
    ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
  }), [authToken]);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'GET',
        headers: commonHeaders,
      });
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${await res.text()}`);
      }
      const data = await res.json();
      setUsers(data || []);
    } catch (e) {
      console.error(e);
      setError(e.message ?? 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [commonHeaders]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const body = {
        email: form.email,
        company_id: form.company_id || null,
        is_admin: form.is_admin,
        subscription_plan: form.subscription_plan || 'free',
        password: form.password || null,
      };
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: commonHeaders,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        throw new Error(`Error ${res.status}: ${await res.text()}`);
      }
      await loadUsers();
      setForm({
        email: '',
        company_id: '',
        is_admin: false,
        subscription_plan: 'free',
        password: '',
      });
    } catch (e) {
      console.error(e);
      setError(e.message ?? 'Failed to create user');
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>User Management</h1>

      {error && (
        <div style={{ padding: '12px', marginBottom: '16px', background: '#fee', color: '#c00', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '32px', padding: '16px', border: '1px solid #ddd', borderRadius: '8px', background: '#f9f9f9' }}>
        <h2>Create New User</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label htmlFor="admin-user-email" style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Email
            </label>
            <input
              id="admin-user-email"
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label htmlFor="admin-user-company" style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Company ID (optional)
            </label>
            <input
              id="admin-user-company"
              type="text"
              name="company_id"
              value={form.company_id}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label htmlFor="admin-user-plan" style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Subscription Plan
            </label>
            <select
              id="admin-user-plan"
              name="subscription_plan"
              value={form.subscription_plan}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            >
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
            </select>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label htmlFor="admin-user-is-admin" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                id="admin-user-is-admin"
                type="checkbox"
                name="is_admin"
                checked={form.is_admin}
                onChange={handleChange}
              />
              <span>Admin</span>
            </label>
          </div>

          <div style={{ marginBottom: '12px' }}>
            <label htmlFor="admin-user-password" style={{ display: 'block', marginBottom: '4px', fontWeight: '500' }}>
              Password (optional)
            </label>
            <input
              id="admin-user-password"
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc', boxSizing: 'border-box' }}
            />
          </div>

          <button
            type="submit"
            style={{
              padding: '10px 20px',
              background: '#0066cc',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
            }}
          >
            Create User
          </button>
        </form>
      </div>

      <div>
        <h2>Users</h2>
        {loading ? (
          <p>Loading...</p>
        ) : users.length === 0 ? (
          <p style={{ color: '#666' }}>No users found</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f0f0f0', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>User ID</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Company ID</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Admin</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Active</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Plan</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.user_id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{user.user_id}</td>
                    <td style={{ padding: '12px' }}>{user.email}</td>
                    <td style={{ padding: '12px' }}>{user.company_id || '—'}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ color: user.is_admin ? '#0066cc' : '#999' }}>
                        {user.is_admin ? '✓' : '—'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ color: user.active ? '#28a745' : '#dc3545' }}>
                        {user.active ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{user.subscription_plan || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;
