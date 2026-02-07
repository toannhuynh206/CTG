import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { formatTime } from '../components/game/Timer';

export default function CompletionPage() {
  const navigate = useNavigate();
  const {
    sessionToken,
    totalTimeMs,
    connectionsFailed,
    loadGameState,
  } = useGameStore();

  useEffect(() => {
    if (!sessionToken) {
      navigate('/');
      return;
    }
    loadGameState();
  }, []);

  return (
    <div className="page" style={{ justifyContent: 'center', gap: '32px' }}>
      <div className="card fade-in" style={{ textAlign: 'center' }}>
        <div style={{
          width: '64px',
          height: '64px',
          background: connectionsFailed ? 'var(--bg-elevated)' : 'var(--cta-green)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: '28px',
          color: 'var(--white)',
          fontWeight: 800,
          boxShadow: connectionsFailed ? 'none' : '0 0 24px rgba(0, 155, 58, 0.3)',
        }}>
          {connectionsFailed ? '?' : '\u2713'}
        </div>

        {!connectionsFailed && totalTimeMs ? (
          <>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '8px',
            }}>
              Puzzles Complete!
            </h2>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontSize: '46px',
              fontWeight: 700,
              color: 'var(--accent)',
              fontVariantNumeric: 'tabular-nums',
              marginBottom: '8px',
              textShadow: '0 0 20px var(--accent-glow)',
              transition: 'color 0.3s ease',
            }}>
              {formatTime(totalTimeMs)}
            </div>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Your time has been recorded
            </p>
          </>
        ) : (
          <>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '22px',
              fontWeight: 700,
              color: 'var(--cta-red)',
              marginBottom: '8px',
            }}>
              Game Over
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              Connections failed — no leaderboard entry this week
            </p>
          </>
        )}
      </div>

      <button
        className="btn btn-secondary btn-full"
        onClick={() => navigate('/leaderboard')}
        style={{ maxWidth: '320px' }}
      >
        View Leaderboard
      </button>
    </div>
  );
}
