import type { CrosswordPuzzle } from '@ctg/shared';

interface CluesListProps {
  puzzle: CrosswordPuzzle;
  activeClue: { number: number; direction: 'across' | 'down' } | null;
  onClueSelect: (clue: { number: number; direction: 'across' | 'down' }) => void;
}

export default function CluesList({ puzzle, activeClue, onClueSelect }: CluesListProps) {
  const isActive = (number: number, direction: 'across' | 'down') =>
    activeClue?.number === number && activeClue?.direction === direction;

  const renderClue = (clue: { number: number; clue: string }, dir: 'across' | 'down') => {
    const active = isActive(clue.number, dir);
    return (
      <button
        key={`${dir[0]}-${clue.number}`}
        onClick={() => onClueSelect({ number: clue.number, direction: dir })}
        style={{
          display: 'flex',
          gap: '6px',
          alignItems: 'baseline',
          width: '100%',
          padding: '4px 8px',
          borderRadius: '6px',
          background: active ? 'var(--accent)' : 'transparent',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          fontSize: '12px',
          lineHeight: '1.4',
          color: active ? 'var(--accent-text)' : 'var(--text-primary)',
          transition: 'background 0.12s ease, color 0.12s ease',
        }}
      >
        <span style={{
          fontWeight: 800,
          minWidth: '14px',
          fontSize: '11px',
          color: active ? 'var(--accent-text)' : 'var(--accent)',
          opacity: active ? 0.85 : 1,
          fontFamily: 'var(--font-display)',
        }}>
          {clue.number}
        </span>
        <span style={{ fontWeight: active ? 600 : 500 }}>{clue.clue}</span>
      </button>
    );
  };

  return (
    <div style={{
      width: '100%',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '12px',
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius)',
      padding: '12px',
      border: '1px solid var(--border-subtle)',
    }}>
      <div>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--accent)',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          marginBottom: '4px',
          paddingLeft: '8px',
          transition: 'color 0.3s ease',
        }}>
          Across
        </h3>
        {puzzle.clues.across.map(clue => renderClue(clue, 'across'))}
      </div>

      <div>
        <h3 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '11px',
          fontWeight: 700,
          color: 'var(--accent)',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          marginBottom: '4px',
          paddingLeft: '8px',
          transition: 'color 0.3s ease',
        }}>
          Down
        </h3>
        {puzzle.clues.down.map(clue => renderClue(clue, 'down'))}
      </div>
    </div>
  );
}
