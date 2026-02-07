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
    startPuzzle,
    connectionsWords,
    selectedWords,
    solvedGroups,
    connectionsMistakes,
    connectionsFailed,
    connectionsCompleted,
    submitConnectionsGuess,
    clearSelection,
    loading,
  } = useGameStore();

  const [shaking, setShaking] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!sessionToken) {
      navigate('/');
      return;
    }

    // Already done — don't allow replay
    if (connectionsCompleted || connectionsFailed) {
      navigate('/game');
      return;
    }

    const init = async () => {
      try {
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

    const result = await submitConnectionsGuess();

    if (!result.correct) {
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }

    if (result.failed) {
      setTimeout(() => navigate('/game'), 1500);
    }
  }, [selectedWords, submitConnectionsGuess, navigate]);

  useEffect(() => {
    if (connectionsCompleted) {
      setTimeout(() => navigate('/game'), 800);
    }
  }, [connectionsCompleted, navigate]);

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

      <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
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
    </div>
  );
}
