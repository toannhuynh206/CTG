import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, setAdminKey } from '../../api/client';

const VALID_SECRET = 'ctgadmin2026';

export default function AdminLoginPage() {
  const { secretKey } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Gate: secret URL must match
  if (secretKey !== VALID_SECRET) {
    return (
      <div className="page" style={{ justifyContent: 'center' }}>
        <p style={{ color: 'var(--gray-400)' }}>Page not found.</p>
      </div>
    );
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.adminLogin(password);
      setAdminKey(data.admin_token);
      navigate('/admin/ctgadmin2026/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page" style={{ justifyContent: 'center' }}>
      <div className="card fade-in" style={{ maxWidth: '380px' }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: 800,
          color: 'var(--blue)',
          marginBottom: '4px',
        }}>
          Admin Login
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--gray-400)', marginBottom: '24px' }}>
          Enter the admin password to manage puzzles
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Admin password"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading || !password}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </button>
        </form>
      </div>
    </div>
  );
}
