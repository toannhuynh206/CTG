import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import { MAX_CROSSWORD_ATTEMPTS } from '@ctg/shared';
import Timer from '../components/game/Timer';
import PuzzleNav from '../components/game/PuzzleNav';
import CrosswordGrid from '../components/crossword/CrosswordGrid';
import type { CrosswordGridHandle } from '../components/crossword/CrosswordGrid';
import CluesList from '../components/crossword/CluesList';
import CrosswordKeyboard from '../components/crossword/CrosswordKeyboard';

export default function CrosswordPage() {
  const navigate = useNavigate();
  const {
    sessionToken,
    loadGameState,
    startPuzzle,
    crosswordPuzzle,
    crosswordGrid,
    crosswordCompleted,
    connectionsCompleted,
    connectionsFailed,
    crosswordFailed,
    crosswordAttempts,
    submitCrossword,
    giveUpCrossword,
    wrongCells,
    loading,
  } = useGameStore();

  const gridRef = useRef<CrosswordGridHandle>(null);
  const [initialized, setInitialized] = useState(false);
  const [activeClue, setActiveClue] = useState<{ number: number; direction: 'across' | 'down' } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Check if every non-black cell is filled
  const gridFull = useMemo(() => {
    if (!crosswordPuzzle || crosswordGrid.length === 0) return false;
    for (let r = 0; r < crosswordPuzzle.size; r++) {
      for (let c = 0; c < crosswordPuzzle.size; c++) {
        if (crosswordPuzzle.grid[r][c] === null) continue; // black cell
        if (!crosswordGrid[r]?.[c]) return false;
      }
    }
    return true;
  }, [crosswordPuzzle, crosswordGrid]);

  const attemptsLeft = MAX_CROSSWORD_ATTEMPTS - crosswordAttempts;
  const canViewResults = crosswordCompleted && connectionsCompleted;

  // Look up the active clue text for the hint bar
  const activeClueText = useMemo(() => {
    if (!activeClue || !crosswordPuzzle) return null;
    const clueList = activeClue.direction === 'across'
      ? crosswordPuzzle.clues.across
      : crosswordPuzzle.clues.down;
    const found = clueList.find(c => c.number === activeClue.number);
    return found ? found.clue : null;
  }, [activeClue, crosswordPuzzle]);

  useEffect(() => {
    if (!sessionToken) {
      navigate('/');
      return;
    }

    const init = async () => {
      try {
        await loadGameState();
        const state = useGameStore.getState();

        // Keep failed crossword blocked after hard refresh.
        if (state.crosswordFailed) {
          setInitialized(true);
          return;
        }

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

    if (result.failed) {
      // Will show the failed state below
    }
  };

  const handleGiveUp = async () => {
    setShowConfirm(false);
    await giveUpCrossword();
    setGaveUp(true);
  };

  if (!initialized || loading || (!crosswordPuzzle && !crosswordFailed && !gaveUp)) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  // Gave up or failed state
  if (gaveUp || crosswordFailed) {
    return (
      <div className="page" style={{ justifyContent: 'center', gap: '24px' }}>
        <div className="card fade-in" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            <span role="img" aria-label="tough">&#128558;</span>
          </div>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '24px',
            fontWeight: 700,
            color: 'var(--cta-red)',
            marginBottom: '8px',
          }}>
            {crosswordFailed && !gaveUp ? 'No Attempts Left!' : 'Oooo that was a tough one!'}
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

      {crosswordPuzzle && (
        <>
          {/* Active clue hint bar — fixed height to prevent layout shifts */}
          <div style={{
            width: '100%',
            background: 'var(--bg-card)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 12px',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'baseline',
            gap: '8px',
            height: '36px',
            overflow: 'hidden',
          }}>
            {activeClue && activeClueText ? (
              <>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '12px',
                  fontWeight: 800,
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.5px',
                }}>
                  {activeClue.number}{activeClue.direction === 'across' ? 'A' : 'D'}
                </span>
                <span style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  lineHeight: '1.3',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {activeClueText}
                </span>
              </>
            ) : (
              <span style={{
                fontSize: '13px',
                fontWeight: 600,
                color: 'var(--text-muted)',
                fontStyle: 'italic',
              }}>
                Tap a cell to see its clue
              </span>
            )}
          </div>

          <CrosswordGrid
            ref={gridRef}
            puzzle={crosswordPuzzle}
            activeClue={activeClue}
            onClueChange={setActiveClue}
            wrongCells={wrongCells}
          />

          {!crosswordCompleted && (
            <div className="mobile-only">
              <CrosswordKeyboard onKey={(key) => gridRef.current?.handleVirtualKey(key)} />
            </div>
          )}

          {/* Attempts counter */}
          {crosswordAttempts > 0 && !crosswordCompleted && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '6px',
              width: '100%',
            }}>
              {Array.from({ length: MAX_CROSSWORD_ATTEMPTS }).map((_, i) => (
                <div key={i} style={{
                  width: '10px',
                  height: '10px',
                  borderRadius: '50%',
                  background: i < crosswordAttempts ? 'var(--cta-red)' : 'var(--border-muted)',
                  transition: 'background 0.2s ease',
                }} />
              ))}
              <span style={{
                fontSize: '12px',
                fontWeight: 600,
                color: attemptsLeft === 1 ? 'var(--cta-red)' : 'var(--text-muted)',
                marginLeft: '4px',
              }}>
                {attemptsLeft} {attemptsLeft === 1 ? 'attempt' : 'attempts'} left
              </span>
            </div>
          )}

          {wrongCells.length > 0 && (
            <div className="error-message fade-in" style={{ textAlign: 'center', padding: '8px 12px', fontSize: '13px', marginBottom: 0 }}>
              Some cells are incorrect. Keep trying!
            </div>
          )}

          {crosswordCompleted ? (
            connectionsFailed ? null : (
              <button
                className="btn btn-primary btn-full fade-in"
                onClick={() => navigate(canViewResults ? '/complete' : '/game/connections')}
              >
                {canViewResults ? 'View Results' : 'Continue to Connections'}
              </button>
            )
          ) : !showConfirm ? (
            <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <button
                className="btn btn-outline"
                onClick={() => setShowConfirm(true)}
                style={{ whiteSpace: 'nowrap', padding: '12px 20px', fontSize: '14px' }}
              >
                Give Up
              </button>
              <button
                className={`btn ${gridFull ? 'btn-primary' : 'btn-outline'}`}
                onClick={handleSubmit}
                disabled={submitting || !gridFull}
                style={{
                  flex: 1,
                  padding: '12px',
                  transition: 'all 0.2s ease',
                }}
              >
                {submitting ? 'Checking...' : `Submit (${attemptsLeft})`}
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
                  className="btn btn-danger"
                  onClick={handleGiveUp}
                  style={{ padding: '10px 20px', fontSize: '14px' }}
                >
                  I Give Up
                </button>
              </div>
            </div>
          )}

          <CluesList
            puzzle={crosswordPuzzle}
            activeClue={activeClue}
            onClueSelect={setActiveClue}
          />
        </>
      )}
    </div>
  );
}
