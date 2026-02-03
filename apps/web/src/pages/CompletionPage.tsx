import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { formatTime } from '../components/game/Timer';
import Countdown from '../components/game/Countdown';

export default function CompletionPage() {
  const navigate = useNavigate();
  const {
    sessionToken,
    totalTimeMs,
    connectionsFailed,
    gameFailed,
    leaderboardTime,
    puzzleDate,
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
          background: connectionsFailed || gameFailed ? 'var(--gray-200)' : 'var(--conn-green)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: '28px',
          color: connectionsFailed || gameFailed ? 'var(--gray-500)' : 'var(--white)',
          fontWeight: 800,
        }}>
          {connectionsFailed || gameFailed ? '?' : '\u2713'}
        </div>

        {!connectionsFailed && !gameFailed && totalTimeMs ? (
          <>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 800,
              color: 'var(--blue)',
              marginBottom: '8px',
            }}>
              Puzzles Complete!
            </h2>
            <div style={{
              fontSize: '42px',
              fontWeight: 900,
              color: 'var(--blue)',
              fontVariantNumeric: 'tabular-nums',
              marginBottom: '8px',
            }}>
              {formatTime(totalTimeMs)}
            </div>
            <p style={{ fontSize: '14px', color: 'var(--gray-400)' }}>
              Your time has been recorded
            </p>
          </>
        ) : (
          <>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 800,
              color: 'var(--gray-700)',
              marginBottom: '8px',
            }}>
              Game Over
            </h2>
            <p style={{ fontSize: '14px', color: 'var(--gray-400)' }}>
              {connectionsFailed
                ? 'Connections failed — no leaderboard entry this week'
                : 'Better luck next time — no leaderboard entry this week'}
            </p>
          </>
        )}
      </div>

      {leaderboardTime && (
        <div className="card fade-in" style={{ textAlign: 'center' }}>
          <Countdown
            targetTime={leaderboardTime}
            label="Leaderboard drops in"
            onComplete={() => navigate(`/leaderboard?date=${puzzleDate}`)}
          />
        </div>
      )}

      <button
        className="btn btn-secondary btn-full"
        onClick={() => navigate(`/leaderboard?date=${puzzleDate}`)}
        style={{ maxWidth: '320px' }}
      >
        View Leaderboard
      </button>
    </div>
  );
}
