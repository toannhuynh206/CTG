import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import Timer from '../components/game/Timer';
import CrosswordGrid from '../components/crossword/CrosswordGrid';
import CluesList from '../components/crossword/CluesList';
import PuzzleNav from '../components/game/PuzzleNav';

export default function CrosswordPage() {
  const navigate = useNavigate();
  const {
    sessionToken,
    startPuzzle,
    crosswordPuzzle,
    crosswordCompleted,
    submitCrossword,
    giveUpCrossword,
    wrongCells,
    loading,
  } = useGameStore();

  const [initialized, setInitialized] = useState(false);
  const [activeClue, setActiveClue] = useState<{ number: number; direction: 'across' | 'down' } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [playingForFun, setPlayingForFun] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!sessionToken) {
      navigate('/');
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

  // Gave up state — show failure screen with option to play for fun
  if (gaveUp && !playingForFun) {
    return (
      <div className="page" style={{ justifyContent: 'center', gap: '24px' }}>
        <div className="card fade-in" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            <span role="img" aria-label="tough">😮‍💨</span>
          </div>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 800,
            color: 'var(--blue)',
            marginBottom: '8px',
          }}>
            Oooo that was a tough one!
          </h2>
          <p style={{
            fontSize: '15px',
            color: 'var(--gray-500)',
            lineHeight: '1.5',
            marginBottom: '4px',
          }}>
            Try again next week!
          </p>
          <p style={{
            fontSize: '13px',
            color: 'var(--gray-400)',
          }}>
            Your time has been stopped and won't appear on the leaderboard.
          </p>
        </div>

        <button
          className="btn btn-primary btn-full"
          onClick={() => setPlayingForFun(true)}
          style={{ maxWidth: '320px' }}
        >
          Keep Playing for Fun
        </button>

        <button
          className="btn btn-secondary btn-full"
          onClick={() => navigate('/game')}
          style={{ maxWidth: '320px' }}
        >
          Back to Game Hub
        </button>
      </div>
    );
  }

  return (
    <div className="page-game" style={{ gap: '16px', paddingTop: '16px' }}>
      {!playingForFun && !showConfirm && <Timer />}
      {!playingForFun && !showConfirm && <PuzzleNav />}

      {playingForFun && (
        <div className="fade-in" style={{
          background: '#FFF5F5',
          borderRadius: 'var(--radius)',
          padding: '8px 16px',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--red)',
          textAlign: 'center',
        }}>
          Playing for fun — not counted for leaderboard
        </div>
      )}

      <h2 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--blue)' }}>
        Mini Crossword
      </h2>

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

      <button
        className="btn btn-primary btn-full"
        onClick={handleSubmit}
        disabled={submitting}
        style={{ marginTop: '8px' }}
      >
        {submitting ? 'Checking...' : 'Submit'}
      </button>

      {wrongCells.length > 0 && (
        <div className="error-message fade-in" style={{ textAlign: 'center' }}>
          Some cells are incorrect. Keep trying!
        </div>
      )}

      {/* Give up (hidden when playing for fun) */}
      {playingForFun ? (
        <button
          className="btn btn-secondary btn-full"
          onClick={() => navigate('/game')}
          style={{ marginTop: '4px' }}
        >
          Back to Game Hub
        </button>
      ) : !showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--gray-400)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '8px',
            fontFamily: 'var(--font)',
          }}
        >
          Give Up
        </button>
      ) : (
        <div className="fade-in" style={{
          background: '#FFF8F0',
          border: '2px solid #FFD6A5',
          borderRadius: 'var(--radius)',
          padding: '16px',
          textAlign: 'center',
          width: '100%',
        }}>
          <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '12px' }}>
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
                background: 'var(--red)',
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
