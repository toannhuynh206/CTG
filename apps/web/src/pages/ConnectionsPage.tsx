import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import Timer from '../components/game/Timer';
import WordGrid from '../components/connections/WordGrid';
import SolvedGroups from '../components/connections/SolvedGroups';
import MistakeCounter from '../components/connections/MistakeCounter';
import PuzzleNav from '../components/game/PuzzleNav';
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
    <div className="page-game" style={{ gap: '16px', paddingTop: '16px' }}>
      <Timer />
      <PuzzleNav />

      <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--blue)' }}>
        Connections
      </h2>

      <p style={{
        fontSize: '13px',
        color: 'var(--gray-400)',
        textAlign: 'center',
        marginTop: '-8px',
      }}>
        Find groups of 4 related words
      </p>

      <SolvedGroups groups={solvedGroups} />

      <WordGrid shaking={shaking} />

      <MistakeCounter mistakes={connectionsMistakes} max={MAX_CONNECTIONS_MISTAKES} />

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
