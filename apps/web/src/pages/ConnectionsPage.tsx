import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import Timer from '../components/game/Timer';
import PuzzleNav from '../components/game/PuzzleNav';
import WordGrid from '../components/connections/WordGrid';
import SolvedGroups from '../components/connections/SolvedGroups';
import MistakeCounter from '../components/connections/MistakeCounter';
import { MAX_CONNECTIONS_MISTAKES } from '@ctg/shared';

export default function ConnectionsPage() {
  const navigate = useNavigate();
  const {
    sessionToken,
    loadGameState,
    startPuzzle,
    connectionsWords,
    selectedWords,
    solvedGroups,
    connectionsMistakes,
    connectionsFailed,
    connectionsCompleted,
    crosswordCompleted,
    crosswordFailed,
    submitConnectionsGuess,
    clearSelection,
    shuffleConnectionsWords,
    oneAway,
    loading,
  } = useGameStore();

  const [shaking, setShaking] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const canViewResults = connectionsCompleted && (crosswordCompleted || crosswordFailed);

  useEffect(() => {
    if (!sessionToken) {
      navigate('/');
      return;
    }

    const init = async () => {
      try {
        await loadGameState();
        const state = useGameStore.getState();

        // Keep failed connections blocked after hard refresh.
        if (state.connectionsFailed) {
          navigate('/game');
          return;
        }

        if (state.connectionsCompleted) {
          setInitialized(true);
          return;
        }

        await startPuzzle('connections');
        setInitialized(true);
      } catch {
        navigate('/game');
      }
    };
    init();
  }, []);

  const handleSubmit = useCallback(async () => {
    if (selectedWords.length !== 4) return;

    setMessage(null);
    const result = await submitConnectionsGuess();

    if (result.duplicate) {
      setMessage('Already guessed!');
      setTimeout(() => setMessage(null), 2000);
      return;
    }

    if (!result.correct) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }

    if (result.failed) {
      setTimeout(() => navigate('/game'), 1500);
    }
  }, [selectedWords, submitConnectionsGuess, navigate]);


  if (!initialized || loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page" style={{ gap: '16px', paddingTop: '16px' }}>
      <Timer />
      <PuzzleNav current="connections" />

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        width: '100%',
      }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '20px',
          fontWeight: 700,
          color: 'var(--accent)',
          transition: 'color 0.3s ease',
        }}>
          Connections
        </h2>
        <MistakeCounter mistakes={connectionsMistakes} max={MAX_CONNECTIONS_MISTAKES} />
      </div>

      <p style={{
        fontSize: '13px',
        color: 'var(--text-muted)',
        textAlign: 'center',
      }}>
        Find groups of 4 related words
      </p>

      <SolvedGroups groups={solvedGroups} />

      <WordGrid shaking={shaking} />

      {oneAway && !connectionsFailed && (
        <div className="fade-in" style={{
          textAlign: 'center',
          padding: '8px 16px',
          background: 'var(--accent-glow)',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '14px',
          fontWeight: 700,
          color: 'var(--accent)',
          width: '100%',
        }}>
          One away...
        </div>
      )}

      {message && (
        <div className="fade-in" style={{
          textAlign: 'center',
          padding: '8px 16px',
          background: 'rgba(198, 12, 48, 0.12)',
          border: '1px solid rgba(198, 12, 48, 0.25)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '14px',
          fontWeight: 600,
          color: '#FF4D6A',
          width: '100%',
        }}>
          {message}
        </div>
      )}

      {connectionsCompleted ? (
        <button
          className="btn btn-primary btn-full fade-in"
          onClick={() => navigate(canViewResults ? '/complete' : '/game/crossword')}
          style={{ marginTop: '8px' }}
        >
          {canViewResults ? 'View Results' : 'Continue to Crossword'}
        </button>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
            <button
              className="btn btn-outline"
              onClick={shuffleConnectionsWords}
              disabled={connectionsWords.length < 2}
              style={{ flex: 1 }}
            >
              Shuffle
            </button>
            <button
              className="btn btn-outline"
              onClick={clearSelection}
              disabled={selectedWords.length === 0}
              style={{ flex: 1 }}
            >
              Clear
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSubmit}
              disabled={selectedWords.length !== 4 || connectionsFailed}
              style={{ flex: 2 }}
            >
              Submit
            </button>
          </div>

          {connectionsFailed && (
            <div className="fade-in error-message" style={{ textAlign: 'center' }}>
              Too many mistakes! Returning to game hub...
            </div>
          )}
        </>
      )}
    </div>
  );
}
