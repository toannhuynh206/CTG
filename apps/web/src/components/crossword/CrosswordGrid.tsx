import { useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useGameStore } from '../../stores/gameStore';
import type { CrosswordPuzzle } from '@ctg/shared';

interface CrosswordGridProps {
  puzzle: CrosswordPuzzle;
  activeClue: { number: number; direction: 'across' | 'down' } | null;
  onClueChange: (clue: { number: number; direction: 'across' | 'down' } | null) => void;
  wrongCells: { row: number; col: number }[];
}

export interface CrosswordGridHandle {
  handleVirtualKey: (key: string) => void;
}

// Build a map of cell -> clue number
function buildCellNumbers(puzzle: CrosswordPuzzle) {
  const numbers: Record<string, number> = {};
  [...puzzle.clues.across, ...puzzle.clues.down].forEach(clue => {
    const key = `${clue.row}-${clue.col}`;
    numbers[key] = clue.number;
  });
  return numbers;
}

// Find which clues a cell belongs to
function getCellClues(puzzle: CrosswordPuzzle, row: number, col: number) {
  const clues: { number: number; direction: 'across' | 'down' }[] = [];

  for (const clue of puzzle.clues.across) {
    let len = 0;
    for (let c = clue.col; c < puzzle.size && puzzle.grid[clue.row][c] !== null; c++) len++;
    if (row === clue.row && col >= clue.col && col < clue.col + len) {
      clues.push({ number: clue.number, direction: 'across' });
    }
  }

  for (const clue of puzzle.clues.down) {
    let len = 0;
    for (let r = clue.row; r < puzzle.size && puzzle.grid[r][clue.col] !== null; r++) len++;
    if (col === clue.col && row >= clue.row && row < clue.row + len) {
      clues.push({ number: clue.number, direction: 'down' });
    }
  }

  return clues;
}

const CrosswordGrid = forwardRef<CrosswordGridHandle, CrosswordGridProps>(
  ({ puzzle, activeClue, onClueChange, wrongCells }, ref) => {
  const { crosswordGrid, updateCrosswordCell, cementedCells } = useGameStore();
  const cementedSet = new Set(cementedCells.map(c => `${c.row}-${c.col}`));
  const inputRefs = useRef<(HTMLInputElement | null)[][]>(
    Array.from({ length: puzzle.size }, () => Array(puzzle.size).fill(null))
  );
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [direction, setDirection] = useState<'across' | 'down'>('across');

  const isMobile = window.innerWidth < 600;
  const cellNumbers = buildCellNumbers(puzzle);
  const wrongCellSet = new Set(wrongCells.map(c => `${c.row}-${c.col}`));

  const isCellHighlighted = useCallback((row: number, col: number) => {
    if (!activeClue) return false;
    const clues = getCellClues(puzzle, row, col);
    return clues.some(c => c.number === activeClue.number && c.direction === activeClue.direction);
  }, [activeClue, puzzle]);

  const updateClueForCell = (row: number, col: number, dir: 'across' | 'down') => {
    const clues = getCellClues(puzzle, row, col);
    const matchingClue = clues.find(c => c.direction === dir) || clues[0];
    if (matchingClue) {
      onClueChange(matchingClue);
    }
  };

  const focusCell = (row: number, col: number) => {
    if (!isMobile) {
      inputRefs.current[row][col]?.focus({ preventScroll: true });
    }
  };

  const moveToNextCell = useCallback((row: number, col: number, dir: 'across' | 'down') => {
    if (dir === 'across') {
      for (let c = col + 1; c < puzzle.size; c++) {
        if (puzzle.grid[row][c] !== null) {
          setActiveCell({ row, col: c });
          focusCell(row, c);
          return;
        }
      }
    } else {
      for (let r = row + 1; r < puzzle.size; r++) {
        if (puzzle.grid[r][col] !== null) {
          setActiveCell({ row: r, col });
          focusCell(r, col);
          return;
        }
      }
    }
  }, [puzzle, isMobile]);

  const moveToPrevCell = useCallback((row: number, col: number, dir: 'across' | 'down') => {
    if (dir === 'across') {
      for (let c = col - 1; c >= 0; c--) {
        if (puzzle.grid[row][c] !== null) {
          setActiveCell({ row, col: c });
          focusCell(row, c);
          return;
        }
      }
    } else {
      for (let r = row - 1; r >= 0; r--) {
        if (puzzle.grid[r][col] !== null) {
          setActiveCell({ row: r, col });
          focusCell(r, col);
          return;
        }
      }
    }
  }, [puzzle, isMobile]);

  const handleCellClick = (row: number, col: number) => {
    if (puzzle.grid[row][col] === null) return;

    if (activeCell?.row === row && activeCell?.col === col) {
      const newDir = direction === 'across' ? 'down' : 'across';
      setDirection(newDir);
      const clues = getCellClues(puzzle, row, col);
      const matchingClue = clues.find(c => c.direction === newDir);
      if (matchingClue) onClueChange(matchingClue);
    } else {
      setActiveCell({ row, col });
      const clues = getCellClues(puzzle, row, col);
      const matchingClue = clues.find(c => c.direction === direction) || clues[0];
      if (matchingClue) {
        setDirection(matchingClue.direction);
        onClueChange(matchingClue);
      }
    }

    focusCell(row, col);
  };

  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    if (e.key === 'Backspace') {
      if (crosswordGrid[row]?.[col]) {
        updateCrosswordCell(row, col, '');
      } else {
        moveToPrevCell(row, col, direction);
      }
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      setDirection('across');
      moveToNextCell(row, col, 'across');
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      setDirection('across');
      moveToPrevCell(row, col, 'across');
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      setDirection('down');
      moveToNextCell(row, col, 'down');
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setDirection('down');
      moveToPrevCell(row, col, 'down');
      e.preventDefault();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const newDir = direction === 'across' ? 'down' : 'across';
      setDirection(newDir);
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      updateCrosswordCell(row, col, e.key);
      moveToNextCell(row, col, direction);
      e.preventDefault();
    }
  };

  // Expose virtual key handler for the custom keyboard
  useImperativeHandle(ref, () => ({
    handleVirtualKey(key: string) {
      if (!activeCell) return;
      const { row, col } = activeCell;
      if (key === 'Backspace') {
        if (crosswordGrid[row]?.[col]) {
          updateCrosswordCell(row, col, '');
        } else {
          moveToPrevCell(row, col, direction);
        }
      } else if (/^[a-zA-Z]$/.test(key)) {
        updateCrosswordCell(row, col, key);
        moveToNextCell(row, col, direction);
      }
    }
  }));

  const cellSize = Math.min(56, (window.innerWidth - 48) / puzzle.size);
  const gap = 3;

  return (
    <div style={{
      background: 'var(--text-primary)',
      borderRadius: '10px',
      padding: `${gap}px`,
      boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
      display: 'inline-block',
    }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${puzzle.size}, ${cellSize}px)`,
          gap: `${gap}px`,
        }}
      >
        {Array.from({ length: puzzle.size }).map((_, row) =>
          Array.from({ length: puzzle.size }).map((_, col) => {
            const isBlack = puzzle.grid[row][col] === null;
            const cellKey = `${row}-${col}`;
            const number = cellNumbers[cellKey];
            const isWrong = wrongCellSet.has(cellKey);
            const isCemented = cementedSet.has(cellKey);
            const isActive = !isCemented && activeCell?.row === row && activeCell?.col === col;
            const isHighlighted = !isCemented && isCellHighlighted(row, col);

            const isTopLeft = row === 0 && col === 0;
            const isTopRight = row === 0 && col === puzzle.size - 1;
            const isBottomLeft = row === puzzle.size - 1 && col === 0;
            const isBottomRight = row === puzzle.size - 1 && col === puzzle.size - 1;
            const cornerRadius = isTopLeft ? '7px 0 0 0'
              : isTopRight ? '0 7px 0 0'
              : isBottomLeft ? '0 0 0 7px'
              : isBottomRight ? '0 0 7px 0'
              : '0';

            if (isBlack) {
              return (
                <div
                  key={cellKey}
                  style={{
                    width: cellSize,
                    height: cellSize,
                    background: 'var(--text-primary)',
                    borderRadius: cornerRadius,
                  }}
                />
              );
            }

            return (
              <div
                key={cellKey}
                onClick={() => !isCemented && handleCellClick(row, col)}
                style={{
                  width: cellSize,
                  height: cellSize,
                  background: isCemented
                    ? 'rgba(0, 155, 58, 0.15)'
                    : isActive
                      ? 'var(--accent)'
                      : isWrong
                        ? 'rgba(198, 12, 48, 0.15)'
                        : isHighlighted
                          ? 'var(--bg-card)'
                          : 'var(--bg-elevated)',
                  position: 'relative',
                  cursor: isCemented ? 'default' : 'pointer',
                  borderRadius: cornerRadius,
                  boxShadow: isCemented
                    ? 'inset 0 0 0 2px rgba(0, 155, 58, 0.4)'
                    : isActive
                      ? 'inset 0 0 0 2px var(--accent-dark)'
                      : isWrong
                        ? 'inset 0 0 0 2px var(--cta-red)'
                        : isHighlighted
                          ? 'inset 0 0 0 1px var(--accent-light)'
                          : 'none',
                  transition: 'background 0.12s ease, box-shadow 0.12s ease',
                }}
              >
                {number && (
                  <span style={{
                    position: 'absolute',
                    top: '2px',
                    left: '3px',
                    fontSize: `${Math.max(9, cellSize * 0.17)}px`,
                    fontWeight: 700,
                    fontFamily: 'var(--font)',
                    color: isCemented ? '#009B3A' : isActive ? 'var(--accent-text)' : 'var(--text-muted)',
                    lineHeight: 1,
                    pointerEvents: 'none',
                    opacity: isCemented ? 0.7 : isActive ? 0.85 : 0.7,
                  }}>
                    {number}
                  </span>
                )}
                {isCemented ? (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: `${cellSize * 0.48}px`,
                    fontWeight: 800,
                    fontFamily: 'var(--font-display)',
                    textTransform: 'uppercase',
                    color: '#009B3A',
                    paddingTop: `${cellSize * 0.12}px`,
                    userSelect: 'none',
                  }}>
                    {crosswordGrid[row]?.[col] || ''}
                  </div>
                ) : (
                  <input
                    ref={el => { inputRefs.current[row][col] = el; }}
                    value={crosswordGrid[row]?.[col] || ''}
                    onKeyDown={(e) => handleKeyDown(e, row, col)}
                    onChange={() => {}}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      background: 'transparent',
                      textAlign: 'center',
                      fontSize: `${cellSize * 0.48}px`,
                      fontWeight: 800,
                      fontFamily: 'var(--font-display)',
                      textTransform: 'uppercase',
                      color: isActive ? 'var(--accent-text)' : isWrong ? 'var(--cta-red)' : 'var(--text-primary)',
                      caretColor: 'transparent',
                      padding: 0,
                      paddingTop: `${cellSize * 0.12}px`,
                      borderRadius: cornerRadius,
                    }}
                    maxLength={1}
                    autoComplete="off"
                    autoCapitalize="characters"
                    inputMode={isMobile ? 'none' : 'text'}
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
});

export default CrosswordGrid;
