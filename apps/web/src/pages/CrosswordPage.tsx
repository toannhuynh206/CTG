import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import Timer from '../components/game/Timer';
import PuzzleNav from '../components/game/PuzzleNav';
import CrosswordGrid from '../components/crossword/CrosswordGrid';
import CluesList from '../components/crossword/CluesList';

export default function CrosswordPage() {
  const navigate = useNavigate();
  const {
    sessionToken,
    startPuzzle,
    crosswordPuzzle,
    crosswordCompleted,
    crosswordFailed,
    submitCrossword,
    giveUpCrossword,
    wrongCells,
    loading,
  } = useGameStore();

  const [initialized, setInitialized] = useState(false);
  const [activeClue, setActiveClue] = useState<{ number: number; direction: 'across' | 'down' } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!sessionToken) {
      navigate('/');
      return;
    }

    // Already done — don't allow replay
    if (crosswordCompleted || crosswordFailed) {
      navigate('/game');
      return;
    }

    const init = async () => {
      try {
        await startPuzzle('crossword');
        setInitialized(true);
      } catch {
        navigate('/game');
      }
    };
    init();
  }, []);

  const handleSubmit = async () => {
    setSubmitting(true);
    const result = await submitCrossword();
    setSubmitting(false);

    if (result.correct) {
      setTimeout(() => navigate('/game'), 600);
    }
  };

  const handleGiveUp = async () => {
    setShowConfirm(false);
    await giveUpCrossword();
    setGaveUp(true);
  };

  useEffect(() => {
    if (crosswordCompleted) {
      setTimeout(() => navigate('/game'), 600);
    }
  }, [crosswordCompleted, navigate]);

  if (!initialized || loading || !crosswordPuzzle) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  // Gave up state
  if (gaveUp) {
    return (
      <div className="page" style={{ justifyContent: 'center', gap: '24px' }}>
        <div className="card fade-in" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            <span role="img" aria-label="tough">😮‍💨</span>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--cta-red)',
            marginBottom: '8px',
          }}>
            Oooo that was a tough one!
          </h2>
          <p style={{
            fontSize: '15px',
            color: 'var(--text-muted)',
            lineHeight: '1.5',
            marginBottom: '4px',
          }}>
            Better luck next time!
          </p>
          <p style={{
            fontSize: '13px',
            color: 'var(--text-muted)',
          }}>
            Your time has been stopped but won't appear on the leaderboard.
          </p>
        </div>

        <button
          className="btn btn-primary btn-full"
          onClick={() => navigate('/game')}
          style={{ maxWidth: '320px' }}
        >
          Back to Game Hub
        </button>
      </div>
    );
  }

  return (
    <div className="page" style={{ gap: '8px', paddingTop: '8px', justifyContent: 'flex-start', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '18px',
          fontWeight: 700,
          color: 'var(--accent)',
          transition: 'color 0.3s ease',
        }}>
          Mini Crossword
        </h2>
        {!showConfirm && <Timer />}
      </div>

      <PuzzleNav current="crossword" />

      <CrosswordGrid
        puzzle={crosswordPuzzle}
        activeClue={activeClue}
        onClueChange={setActiveClue}
        wrongCells={wrongCells}
      />

      <CluesList
        puzzle={crosswordPuzzle}
        activeClue={activeClue}
        onClueSelect={setActiveClue}
      />

      {wrongCells.length > 0 && (
        <div className="error-message fade-in" style={{ textAlign: 'center', padding: '8px 12px', fontSize: '13px', marginBottom: 0 }}>
          Some cells are incorrect. Keep trying!
        </div>
      )}

      {/* Submit + Give Up side by side */}
      {!showConfirm ? (
        <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
          <button
            onClick={() => setShowConfirm(true)}
            style={{
              background: 'none',
              border: '2px solid var(--gray-200)',
              borderRadius: '50px',
              color: 'var(--text-muted)',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              padding: '12px 20px',
              fontFamily: 'var(--font)',
              whiteSpace: 'nowrap',
            }}
          >
            Give Up
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ flex: 1, padding: '12px' }}
          >
            {submitting ? 'Checking...' : 'Submit'}
          </button>
        </div>
      ) : (
        <div className="fade-in" style={{
          background: 'rgba(198, 12, 48, 0.1)',
          border: '2px solid rgba(198, 12, 48, 0.3)',
          borderRadius: 'var(--radius)',
          padding: '12px',
          textAlign: 'center',
          width: '100%',
        }}>
          <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
            Are you sure? Your time will stop and you won't make the leaderboard.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              className="btn btn-outline"
              onClick={() => setShowConfirm(false)}
              style={{ padding: '10px 20px', fontSize: '14px' }}
            >
              Keep Going
            </button>
            <button
              className="btn"
              onClick={handleGiveUp}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                background: 'var(--cta-red)',
                color: 'var(--white)',
                fontWeight: 700,
              }}
            >
              I Give Up
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
