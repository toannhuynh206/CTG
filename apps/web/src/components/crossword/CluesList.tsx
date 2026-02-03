import type { CrosswordPuzzle } from '@ctg/shared';

interface CluesListProps {
  puzzle: CrosswordPuzzle;
  activeClue: { number: number; direction: 'across' | 'down' } | null;
  onClueSelect: (clue: { number: number; direction: 'across' | 'down' }) => void;
}

export default function CluesList({ puzzle, activeClue, onClueSelect }: CluesListProps) {
  const isActive = (number: number, direction: 'across' | 'down') =>
    activeClue?.number === number && activeClue?.direction === direction;

  return (
    <div style={{
      width: '100%',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '16px',
    }}>
      <div>
        <h3 style={{
          fontSize: '13px',
          fontWeight: 800,
          color: 'var(--blue)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '8px',
        }}>
          Across
        </h3>
        {puzzle.clues.across.map(clue => (
          <button
            key={`a-${clue.number}`}
            onClick={() => onClueSelect({ number: clue.number, direction: 'across' })}
            style={{
              display: 'flex',
              gap: '6px',
              width: '100%',
              padding: '6px 8px',
              borderRadius: '6px',
              background: isActive(clue.number, 'across') ? '#D4E4FF' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '13px',
              lineHeight: '1.4',
              color: 'var(--gray-900)',
            }}
          >
            <span style={{ fontWeight: 800, minWidth: '16px', color: 'var(--gray-400)' }}>
              {clue.number}
            </span>
            <span>{clue.clue}</span>
          </button>
        ))}
      </div>

      <div>
        <h3 style={{
          fontSize: '13px',
          fontWeight: 800,
          color: 'var(--blue)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '8px',
        }}>
          Down
        </h3>
        {puzzle.clues.down.map(clue => (
          <button
            key={`d-${clue.number}`}
            onClick={() => onClueSelect({ number: clue.number, direction: 'down' })}
            style={{
              display: 'flex',
              gap: '6px',
              width: '100%',
              padding: '6px 8px',
              borderRadius: '6px',
              background: isActive(clue.number, 'down') ? '#D4E4FF' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              textAlign: 'left',
              fontSize: '13px',
              lineHeight: '1.4',
              color: 'var(--gray-900)',
            }}
          >
            <span style={{ fontWeight: 800, minWidth: '16px', color: 'var(--gray-400)' }}>
              {clue.number}
            </span>
            <span>{clue.clue}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
