import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { US_STATES } from '@ctg/shared';

export default function PlayerInfoPage() {
  const navigate = useNavigate();
  const { register, loading, error } = useGameStore();
  const [name, setName] = useState('');
  const [state, setState] = useState('');
  const [instagram, setInstagram] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !state || !instagram.trim()) return;

    try {
      await register(name.trim(), state, instagram.trim().replace('@', ''));
      navigate('/game');
    } catch {
      // Error handled by store
    }
  };

  return (
    <div className="page" style={{ justifyContent: 'center' }}>
      <div className="card fade-in" style={{ maxWidth: '400px' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '24px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '4px',
          letterSpacing: '0.5px',
        }}>
          Enter Your Info
        </h2>
        <p style={{
          fontSize: '14px',
          color: 'var(--text-muted)',
          marginBottom: '24px',
        }}>
          This is how you'll appear on the leaderboard
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              maxLength={50}
              autoFocus
            />
          </div>

          <div className="input-group">
            <label>State</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: '2px solid var(--gray-200)',
                borderRadius: 'var(--radius-sm)',
                fontSize: '16px',
                transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
                background: 'var(--bg-elevated)',
                color: state ? 'var(--text-primary)' : 'var(--gray-300)',
                fontFamily: 'var(--font)',
                appearance: 'none',
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236B7280' stroke-width='2' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 16px center',
                paddingRight: '40px',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = 'var(--accent)';
                e.target.style.boxShadow = '0 0 0 3px var(--accent-glow)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'var(--gray-200)';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="" disabled>Select your state</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>Instagram</label>
            <div style={{ position: 'relative' }}>
              <span style={{
                position: 'absolute',
                left: '16px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontSize: '16px',
                fontWeight: 500,
              }}>
                @
              </span>
              <input
                type="text"
                value={instagram}
                onChange={(e) => setInstagram(e.target.value)}
                placeholder="username"
                maxLength={30}
                style={{ paddingLeft: '32px' }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={loading || !name.trim() || !state || !instagram.trim()}
            style={{ marginTop: '8px' }}
          >
            {loading ? 'Starting...' : "Let's Go"}
          </button>
        </form>
      </div>
    </div>
  );
}
