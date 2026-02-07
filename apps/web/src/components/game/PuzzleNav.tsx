import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../stores/gameStore';

interface PuzzleNavProps {
  current: 'connections' | 'crossword';
}

export default function PuzzleNav({ current }: PuzzleNavProps) {
  const navigate = useNavigate();
  const {
    connectionsCompleted,
    crosswordCompleted,
    connectionsFailed,
  } = useGameStore();

  const puzzles = [
    {
      id: 'connections',
      label: 'Connections',
      completed: connectionsCompleted,
      failed: connectionsFailed,
    },
    {
      id: 'crossword',
      label: 'Crossword',
      completed: crosswordCompleted,
      failed: false,
    },
  ];

  return (
    <div style={{
      display: 'flex',
      gap: '8px',
      padding: '4px',
      background: 'var(--bg-elevated)',
      borderRadius: '50px',
      width: 'fit-content',
    }}>
      {puzzles.map((puzzle) => {
        const isActive = current === puzzle.id;
        const isDisabled = puzzle.id === 'connections' && (connectionsCompleted || connectionsFailed);

        return (
          <button
            key={puzzle.id}
            onClick={() => !isActive && navigate(`/game/${puzzle.id}`)}
            disabled={isDisabled && !isActive}
            style={{
              padding: '8px 16px',
              borderRadius: '50px',
              border: 'none',
              background: isActive ? 'var(--accent)' : 'transparent',
              color: isActive
                ? 'var(--accent-text)'
                : puzzle.completed
                  ? 'var(--cta-green)'
                  : puzzle.failed
                    ? 'var(--cta-red)'
                    : 'var(--text-muted)',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isDisabled && !isActive ? 'not-allowed' : isActive ? 'default' : 'pointer',
              opacity: isDisabled && !isActive ? 0.5 : 1,
              transition: 'all 0.15s ease',
              fontFamily: 'var(--font)',
            }}
          >
            {puzzle.label}
            {puzzle.completed && ' ✓'}
            {puzzle.failed && ' ✗'}
          </button>
        );
      })}
    </div>
  );
}
