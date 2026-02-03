import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import Timer from '../components/game/Timer';

export default function GameHubPage() {
  const navigate = useNavigate();
  const {
    sessionToken,
    loadGameState,
    startedAt,
    connectionsCompleted,
    crosswordCompleted,
    connectionsFailed,
    gameFailed,
    totalTimeMs,
    loading,
    devComplete,
  } = useGameStore();

  useEffect(() => {
    if (!sessionToken) {
      navigate('/');
      return;
    }
    loadGameState();
  }, []);

  useEffect(() => {
    // Navigate to completion when both puzzles are done (success or fail)
    if (connectionsCompleted && crosswordCompleted && totalTimeMs) {
      navigate('/complete');
    }
    // Also navigate if the game is failed (gave up crossword or connections failed + crossword done)
    if (gameFailed && totalTimeMs) {
      navigate('/complete');
    }
  }, [connectionsCompleted, crosswordCompleted, gameFailed, totalTimeMs, navigate]);

  const handleStartPuzzle = (type: 'connections' | 'crossword') => {
    navigate(`/game/${type}`);
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page" style={{ gap: '24px', paddingTop: '32px' }}>
      {startedAt && (
        <div className="fade-in">
          <Timer />
        </div>
      )}

      <h2 style={{
        fontSize: '20px',
        fontWeight: 800,
        color: 'var(--blue)',
        textAlign: 'center',
      }}>
        Choose Your Puzzle
      </h2>

      <p style={{
        fontSize: '14px',
        color: 'var(--gray-400)',
        textAlign: 'center',
        marginTop: '-12px',
      }}>
        {!startedAt
          ? 'Timer starts when you open your first puzzle'
          : 'Complete both puzzles to earn your time'}
      </p>

      {/* Connections card */}
      <button
        className="card"
        onClick={() => handleStartPuzzle('connections')}
        disabled={connectionsCompleted || connectionsFailed}
        style={{
          cursor: connectionsCompleted || connectionsFailed ? 'default' : 'pointer',
          textAlign: 'left',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          border: connectionsCompleted ? '2px solid var(--conn-green)' : connectionsFailed ? '2px solid var(--red)' : '2px solid transparent',
          opacity: connectionsFailed ? 0.6 : 1,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
              {['var(--conn-yellow)', 'var(--conn-green)', 'var(--conn-blue)', 'var(--conn-purple)'].map((c, i) => (
                <div key={i} style={{
                  width: '20px', height: '20px', borderRadius: '4px', background: c,
                }} />
              ))}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '4px' }}>
              Connections
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--gray-400)' }}>
              Find 4 groups of 4 words
            </p>
          </div>
          <div style={{
            fontSize: '13px',
            fontWeight: 700,
            padding: '6px 12px',
            borderRadius: '20px',
            background: connectionsCompleted ? 'var(--conn-green)' : connectionsFailed ? 'var(--red)' : 'var(--gray-100)',
            color: connectionsCompleted ? 'var(--white)' : connectionsFailed ? 'var(--white)' : 'var(--gray-500)',
          }}>
            {connectionsCompleted ? 'Done' : connectionsFailed ? 'Failed' : 'Play'}
          </div>
        </div>
      </button>

      {/* Crossword card */}
      <button
        className="card"
        onClick={() => handleStartPuzzle('crossword')}
        disabled={crosswordCompleted || gameFailed}
        style={{
          cursor: crosswordCompleted || gameFailed ? 'default' : 'pointer',
          textAlign: 'left',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          border: crosswordCompleted ? '2px solid var(--conn-green)' : gameFailed ? '2px solid var(--red)' : '2px solid transparent',
          opacity: gameFailed && !crosswordCompleted ? 0.6 : 1,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 18px)',
              gap: '2px',
              marginBottom: '12px',
            }}>
              {[1, 0, 1, 0, 1, 0, 1, 0, 1].map((filled, i) => (
                <div key={i} style={{
                  width: '18px', height: '18px', borderRadius: '3px',
                  background: filled ? 'var(--blue)' : 'var(--gray-200)',
                }} />
              ))}
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--gray-900)', marginBottom: '4px' }}>
              Mini Crossword
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--gray-400)' }}>
              5x5 crossword puzzle
            </p>
          </div>
          <div style={{
            fontSize: '13px',
            fontWeight: 700,
            padding: '6px 12px',
            borderRadius: '20px',
            background: crosswordCompleted ? 'var(--conn-green)' : gameFailed ? 'var(--red)' : 'var(--gray-100)',
            color: crosswordCompleted ? 'var(--white)' : gameFailed ? 'var(--white)' : 'var(--gray-500)',
          }}>
            {crosswordCompleted ? 'Done' : gameFailed ? 'Gave Up' : 'Play'}
          </div>
        </div>
      </button>

      {connectionsFailed && (
        <div className="fade-in" style={{
          textAlign: 'center',
          padding: '16px',
          background: '#FFF5F5',
          borderRadius: 'var(--radius)',
          fontSize: '14px',
          color: 'var(--red)',
          fontWeight: 500,
        }}>
          Connections failed — you can still play Crossword for fun, but your time won't appear on the leaderboard.
        </div>
      )}

      {/* DEV ONLY: Auto-complete buttons */}
      <div style={{
        marginTop: '32px',
        padding: '16px',
        background: '#FFFBE6',
        border: '2px dashed #E6C200',
        borderRadius: 'var(--radius)',
        width: '100%',
      }}>
        <p style={{ fontSize: '12px', fontWeight: 700, color: '#B89500', marginBottom: '10px', textAlign: 'center' }}>
          DEV MODE — Auto-Complete
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            className="btn"
            onClick={() => devComplete('connections')}
            disabled={connectionsCompleted || connectionsFailed}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              background: connectionsCompleted ? 'var(--gray-300)' : '#E6C200',
              color: 'var(--white)',
              fontWeight: 700,
            }}
          >
            Solve Connections
          </button>
          <button
            className="btn"
            onClick={() => devComplete('crossword')}
            disabled={crosswordCompleted || gameFailed}
            style={{
              padding: '8px 16px',
              fontSize: '13px',
              background: crosswordCompleted ? 'var(--gray-300)' : '#E6C200',
              color: 'var(--white)',
              fontWeight: 700,
            }}
          >
            Solve Crossword
          </button>
        </div>
      </div>
    </div>
  );
}
