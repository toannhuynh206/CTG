import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';

export default function PlayerInfoPage() {
  const navigate = useNavigate();
  const { register, loading, error } = useGameStore();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [instagram, setInstagram] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !city.trim() || !instagram.trim()) return;

    try {
      await register(name.trim(), city.trim(), instagram.trim().replace('@', ''));
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
            <label>City</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Where you're from"
              maxLength={50}
            />
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
            disabled={loading || !name.trim() || !city.trim() || !instagram.trim()}
            style={{ marginTop: '8px' }}
          >
            {loading ? 'Starting...' : "Let's Go"}
          </button>
        </form>
      </div>
    </div>
  );
}
