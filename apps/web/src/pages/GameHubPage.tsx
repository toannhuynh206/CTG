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
    crosswordFailed,
    totalTimeMs,
    loading,
  } = useGameStore();

  useEffect(() => {
    if (!sessionToken) {
      navigate('/');
      return;
    }
    loadGameState();
  }, []);

  // Redirect to completion if both puzzles are done (completed or failed)
  useEffect(() => {
    const connDone = connectionsCompleted || connectionsFailed;
    const crossDone = crosswordCompleted || crosswordFailed;
    if (connDone && crossDone) {
      navigate('/complete');
    }
  }, [connectionsCompleted, crosswordCompleted, connectionsFailed, crosswordFailed]);

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
        fontFamily: 'var(--font-display)',
        fontSize: '22px',
        fontWeight: 700,
        color: 'var(--text-primary)',
        textAlign: 'center',
        letterSpacing: '0.5px',
      }}>
        Choose Your Puzzle
      </h2>

      <p style={{
        fontSize: '14px',
        color: 'var(--text-muted)',
        textAlign: 'center',
        marginTop: '-12px',
      }}>
        {!startedAt
          ? 'Timer starts when you open your first puzzle'
          : 'Complete both puzzles to earn your time'}
      </p>

      {/* Connections card — accent color border */}
      <button
        className="card"
        onClick={() => handleStartPuzzle('connections')}
        disabled={connectionsCompleted || connectionsFailed}
        style={{
          cursor: connectionsCompleted || connectionsFailed ? 'default' : 'pointer',
          textAlign: 'left',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          borderLeft: '4px solid var(--cta-purple)',
          borderTop: connectionsCompleted ? '1px solid var(--cta-green)' : connectionsFailed ? '1px solid var(--cta-red)' : '1px solid rgba(255,255,255,0.06)',
          borderRight: connectionsCompleted ? '1px solid var(--cta-green)' : connectionsFailed ? '1px solid var(--cta-red)' : '1px solid rgba(255,255,255,0.06)',
          borderBottom: connectionsCompleted ? '1px solid var(--cta-green)' : connectionsFailed ? '1px solid var(--cta-red)' : '1px solid rgba(255,255,255,0.06)',
          opacity: connectionsFailed ? 0.6 : 1,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
              {['var(--cta-yellow)', 'var(--cta-green)', 'var(--cta-blue)', 'var(--cta-purple)'].map((c, i) => (
                <div key={i} style={{
                  width: '20px', height: '20px', borderRadius: '4px', background: c,
                }} />
              ))}
            </div>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '4px',
            }}>
              Connections
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              Find 4 groups of 4 words
            </p>
          </div>
          <div style={{
            fontSize: '13px',
            fontWeight: 700,
            padding: '6px 16px',
            borderRadius: '20px',
            background: connectionsCompleted ? 'var(--cta-green)' : connectionsFailed ? 'var(--cta-red)' : 'var(--bg-elevated)',
            color: connectionsCompleted ? 'var(--white)' : connectionsFailed ? 'var(--white)' : 'var(--text-muted)',
          }}>
            {connectionsCompleted ? 'Done' : connectionsFailed ? 'Failed' : 'Play'}
          </div>
        </div>
      </button>

      {/* Crossword card — accent color border */}
      <button
        className="card"
        onClick={() => handleStartPuzzle('crossword')}
        disabled={crosswordCompleted || crosswordFailed}
        style={{
          cursor: crosswordCompleted || crosswordFailed ? 'default' : 'pointer',
          textAlign: 'left',
          transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          borderLeft: '4px solid var(--cta-brown)',
          borderTop: crosswordCompleted ? '1px solid var(--cta-green)' : crosswordFailed ? '1px solid var(--cta-red)' : '1px solid rgba(255,255,255,0.06)',
          borderRight: crosswordCompleted ? '1px solid var(--cta-green)' : crosswordFailed ? '1px solid var(--cta-red)' : '1px solid rgba(255,255,255,0.06)',
          borderBottom: crosswordCompleted ? '1px solid var(--cta-green)' : crosswordFailed ? '1px solid var(--cta-red)' : '1px solid rgba(255,255,255,0.06)',
          opacity: crosswordFailed ? 0.6 : 1,
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
                  background: filled ? 'var(--cta-brown)' : 'var(--bg-elevated)',
                }} />
              ))}
            </div>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              marginBottom: '4px',
            }}>
              Mini Crossword
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
              5x5 crossword puzzle
            </p>
          </div>
          <div style={{
            fontSize: '13px',
            fontWeight: 700,
            padding: '6px 16px',
            borderRadius: '20px',
            background: crosswordCompleted ? 'var(--cta-green)' : crosswordFailed ? 'var(--cta-red)' : 'var(--bg-elevated)',
            color: crosswordCompleted ? 'var(--white)' : crosswordFailed ? 'var(--white)' : 'var(--text-muted)',
          }}>
            {crosswordCompleted ? 'Done' : crosswordFailed ? 'Failed' : 'Play'}
          </div>
        </div>
      </button>

      {connectionsFailed && !crosswordFailed && (
        <div className="fade-in" style={{
          textAlign: 'center',
          padding: '16px',
          background: 'rgba(198, 12, 48, 0.12)',
          border: '1px solid rgba(198, 12, 48, 0.25)',
          borderRadius: 'var(--radius)',
          fontSize: '14px',
          color: '#FF4D6A',
          fontWeight: 500,
        }}>
          Connections failed — you can still play Crossword for fun, but your time won't appear on the leaderboard.
        </div>
      )}

      {crosswordFailed && !connectionsFailed && (
        <div className="fade-in" style={{
          textAlign: 'center',
          padding: '16px',
          background: 'rgba(198, 12, 48, 0.12)',
          border: '1px solid rgba(198, 12, 48, 0.25)',
          borderRadius: 'var(--radius)',
          fontSize: '14px',
          color: '#FF4D6A',
          fontWeight: 500,
        }}>
          Crossword given up — you can still play Connections for fun, but your time won't appear on the leaderboard.
        </div>
      )}
    </div>
  );
}
