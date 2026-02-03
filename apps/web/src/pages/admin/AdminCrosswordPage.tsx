import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../api/client';

const SIZE = 5;

interface ClueDraft {
  number: number;
  clue: string;
  answer: string;
  row: number;
  col: number;
  direction: 'across' | 'down';
}

function createEmptyGrid(): (string | null)[][] {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(''));
}

export default function AdminCrosswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date') || '';

  const [grid, setGrid] = useState<(string | null)[][]>(createEmptyGrid());
  const [cluesAcross, setCluesAcross] = useState<ClueDraft[]>([]);
  const [cluesDown, setCluesDown] = useState<ClueDraft[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [existingConnections, setExistingConnections] = useState<any>(null);

  // Load existing
  useEffect(() => {
    if (!date) return;
    api.adminGetPuzzle(date).then(data => {
      if (data.puzzle) {
        setExistingConnections(data.puzzle.connections_data);
        if (data.puzzle.crossword_data?.grid?.length === SIZE) {
          setGrid(data.puzzle.crossword_data.grid);
        }
        if (data.puzzle.crossword_data?.clues) {
          setCluesAcross(data.puzzle.crossword_data.clues.across || []);
          setCluesDown(data.puzzle.crossword_data.clues.down || []);
        }
      }
    }).catch(() => {});
  }, [date]);

  const toggleBlack = (r: number, c: number) => {
    setGrid(prev => {
      const g = prev.map(row => [...row]);
      g[r][c] = g[r][c] === null ? '' : null;
      return g;
    });
  };

  const setCell = (r: number, c: number, val: string) => {
    if (grid[r][c] === null) return;
    setGrid(prev => {
      const g = prev.map(row => [...row]);
      g[r][c] = val.toUpperCase().slice(0, 1);
      return g;
    });
  };

  // Auto-detect words from the filled grid
  const detectWords = useCallback(() => {
    const across: { row: number; col: number; word: string }[] = [];
    const down: { row: number; col: number; word: string }[] = [];

    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] === null) continue;
        // Across start
        const leftNull = c === 0 || grid[r][c - 1] === null;
        const rightExists = c + 1 < SIZE && grid[r][c + 1] !== null;
        if (leftNull && rightExists) {
          let word = '';
          for (let cc = c; cc < SIZE && grid[r][cc] !== null; cc++) word += grid[r][cc] || '?';
          if (word.length >= 2) across.push({ row: r, col: c, word });
        }
        // Down start
        const aboveNull = r === 0 || grid[r - 1][c] === null;
        const belowExists = r + 1 < SIZE && grid[r + 1][c] !== null;
        if (aboveNull && belowExists) {
          let word = '';
          for (let rr = r; rr < SIZE && grid[rr][c] !== null; rr++) word += grid[rr][c] || '?';
          if (word.length >= 2) down.push({ row: r, col: c, word });
        }
      }
    }

    // Assign clue numbers
    const numberMap = new Map<string, number>();
    let num = 1;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const key = `${r}-${c}`;
        const isAcrossStart = across.some(a => a.row === r && a.col === c);
        const isDownStart = down.some(d => d.row === r && d.col === c);
        if (isAcrossStart || isDownStart) {
          numberMap.set(key, num++);
        }
      }
    }

    // Build clue drafts, preserving existing clue text
    const newAcross: ClueDraft[] = across.map(a => {
      const n = numberMap.get(`${a.row}-${a.col}`) || 0;
      const existing = cluesAcross.find(c => c.row === a.row && c.col === a.col);
      return {
        number: n,
        clue: existing?.clue || '',
        answer: a.word,
        row: a.row,
        col: a.col,
        direction: 'across' as const,
      };
    });

    const newDown: ClueDraft[] = down.map(d => {
      const n = numberMap.get(`${d.row}-${d.col}`) || 0;
      const existing = cluesDown.find(c => c.row === d.row && c.col === d.col);
      return {
        number: n,
        clue: existing?.clue || '',
        answer: d.word,
        row: d.row,
        col: d.col,
        direction: 'down' as const,
      };
    });

    setCluesAcross(newAcross);
    setCluesDown(newDown);
  }, [grid, cluesAcross, cluesDown]);

  // Detect words when grid changes
  useEffect(() => {
    detectWords();
  }, [grid]);

  const updateClue = (direction: 'across' | 'down', idx: number, text: string) => {
    if (direction === 'across') {
      setCluesAcross(prev => prev.map((c, i) => i === idx ? { ...c, clue: text } : c));
    } else {
      setCluesDown(prev => prev.map((c, i) => i === idx ? { ...c, clue: text } : c));
    }
  };

  const validate = (): string | null => {
    // Check all non-black cells have a letter
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if (grid[r][c] !== null && !grid[r][c]) {
          return `Cell (${r + 1}, ${c + 1}) is empty — fill in a letter or make it black`;
        }
      }
    }
    // Check all clues have text
    for (const clue of [...cluesAcross, ...cluesDown]) {
      if (!clue.clue.trim()) {
        return `${clue.number} ${clue.direction} needs a clue`;
      }
    }
    if (cluesAcross.length === 0 && cluesDown.length === 0) {
      return 'No words detected — fill in the grid first';
    }
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setSaving(true);
    setMessage('');

    try {
      const payload: any = {
        date,
        connections: existingConnections || { groups: [] },
        crossword: {
          size: SIZE,
          grid,
          clues: {
            across: cluesAcross,
            down: cluesDown,
          },
        },
      };

      await api.adminSavePuzzle(payload);
      setMessage('Crossword saved!');
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Build cell number map for display
  const cellNumbers: Record<string, number> = {};
  [...cluesAcross, ...cluesDown].forEach(c => {
    cellNumbers[`${c.row}-${c.col}`] = c.number;
  });

  const cellSize = Math.min(60, (window.innerWidth - 64) / SIZE);

  return (
    <div className="page" style={{ gap: '20px', paddingTop: '16px', maxWidth: '540px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
        <button
          onClick={() => navigate(`/admin/ctgadmin2026/dashboard`)}
          className="btn btn-outline"
          style={{ padding: '8px 14px', fontSize: '14px' }}
        >
          Back
        </button>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--blue)' }}>
            Crossword Builder
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--gray-400)' }}>{date}</p>
        </div>
      </div>

      <p style={{ fontSize: '13px', color: 'var(--gray-400)', width: '100%' }}>
        Type letters to fill cells. Right-click (or long-press) a cell to toggle it black.
      </p>

      {error && <div className="error-message">{error}</div>}
      {message && (
        <div style={{
          background: '#E8F5E9', color: '#2E7D32', padding: '12px 16px',
          borderRadius: 'var(--radius-sm)', fontSize: '14px', fontWeight: 500, width: '100%',
        }}>
          {message}
        </div>
      )}

      {/* Grid editor */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${SIZE}, ${cellSize}px)`,
        gap: '2px',
        background: 'var(--gray-900)',
        padding: '2px',
        borderRadius: 'var(--radius-sm)',
      }}>
        {Array.from({ length: SIZE }).map((_, r) =>
          Array.from({ length: SIZE }).map((_, c) => {
            const isBlack = grid[r][c] === null;
            const numLabel = cellNumbers[`${r}-${c}`];

            return (
              <div
                key={`${r}-${c}`}
                onContextMenu={(e) => { e.preventDefault(); toggleBlack(r, c); }}
                onDoubleClick={() => toggleBlack(r, c)}
                style={{
                  width: cellSize,
                  height: cellSize,
                  background: isBlack ? 'var(--gray-900)' : 'var(--white)',
                  position: 'relative',
                  cursor: 'pointer',
                }}
              >
                {numLabel && !isBlack && (
                  <span style={{
                    position: 'absolute', top: '2px', left: '3px',
                    fontSize: '9px', fontWeight: 700, color: 'var(--gray-400)',
                    lineHeight: 1, pointerEvents: 'none',
                  }}>
                    {numLabel}
                  </span>
                )}
                {!isBlack && (
                  <input
                    value={grid[r][c] || ''}
                    onChange={(e) => setCell(r, c, e.target.value)}
                    maxLength={1}
                    style={{
                      position: 'absolute', inset: 0, width: '100%', height: '100%',
                      border: 'none', background: 'transparent', textAlign: 'center',
                      fontSize: `${cellSize * 0.45}px`, fontWeight: 800,
                      textTransform: 'uppercase', color: 'var(--gray-900)',
                      caretColor: 'var(--blue)', padding: 0, paddingTop: '6px',
                      fontFamily: 'var(--font)',
                    }}
                  />
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Clue editors */}
      {cluesAcross.length > 0 && (
        <div className="card" style={{ padding: '16px 20px' }}>
          <h3 style={{
            fontSize: '13px', fontWeight: 800, color: 'var(--blue)',
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px',
          }}>
            Across
          </h3>
          {cluesAcross.map((clue, i) => (
            <div key={`a-${clue.number}`} style={{ marginBottom: '10px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px',
              }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--gray-400)', minWidth: '20px' }}>
                  {clue.number}
                </span>
                <span style={{
                  fontSize: '12px', fontWeight: 700, color: 'var(--blue)',
                  background: 'var(--gray-100)', padding: '2px 8px', borderRadius: '4px',
                  fontFamily: 'monospace', letterSpacing: '2px',
                }}>
                  {clue.answer}
                </span>
              </div>
              <input
                type="text"
                value={clue.clue}
                onChange={(e) => updateClue('across', i, e.target.value)}
                placeholder="Write the clue..."
                style={{
                  width: '100%', padding: '8px 12px', border: '2px solid var(--gray-200)',
                  borderRadius: 'var(--radius-sm)', fontSize: '14px', fontFamily: 'var(--font)',
                }}
              />
            </div>
          ))}
        </div>
      )}

      {cluesDown.length > 0 && (
        <div className="card" style={{ padding: '16px 20px' }}>
          <h3 style={{
            fontSize: '13px', fontWeight: 800, color: 'var(--blue)',
            textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px',
          }}>
            Down
          </h3>
          {cluesDown.map((clue, i) => (
            <div key={`d-${clue.number}`} style={{ marginBottom: '10px' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px',
              }}>
                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--gray-400)', minWidth: '20px' }}>
                  {clue.number}
                </span>
                <span style={{
                  fontSize: '12px', fontWeight: 700, color: 'var(--blue)',
                  background: 'var(--gray-100)', padding: '2px 8px', borderRadius: '4px',
                  fontFamily: 'monospace', letterSpacing: '2px',
                }}>
                  {clue.answer}
                </span>
              </div>
              <input
                type="text"
                value={clue.clue}
                onChange={(e) => updateClue('down', i, e.target.value)}
                placeholder="Write the clue..."
                style={{
                  width: '100%', padding: '8px 12px', border: '2px solid var(--gray-200)',
                  borderRadius: 'var(--radius-sm)', fontSize: '14px', fontFamily: 'var(--font)',
                }}
              />
            </div>
          ))}
        </div>
      )}

      <button
        className="btn btn-primary btn-full"
        onClick={handleSave}
        disabled={saving}
      >
        {saving ? 'Saving...' : 'Save Crossword'}
      </button>
    </div>
  );
}
