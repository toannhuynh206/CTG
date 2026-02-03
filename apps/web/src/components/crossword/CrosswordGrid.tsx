import { useRef, useEffect, useState, useCallback } from 'react';
import { useGameStore } from '../../stores/gameStore';
import type { CrosswordPuzzle } from '@ctg/shared';

interface CrosswordGridProps {
  puzzle: CrosswordPuzzle;
  activeClue: { number: number; direction: 'across' | 'down' } | null;
  onClueChange: (clue: { number: number; direction: 'across' | 'down' } | null) => void;
  wrongCells: { row: number; col: number }[];
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
    // Calculate word length by walking right
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

export default function CrosswordGrid({ puzzle, activeClue, onClueChange, wrongCells }: CrosswordGridProps) {
  const { crosswordGrid, updateCrosswordCell } = useGameStore();
  const inputRefs = useRef<(HTMLInputElement | null)[][]>(
    Array.from({ length: puzzle.size }, () => Array(puzzle.size).fill(null))
  );
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const [direction, setDirection] = useState<'across' | 'down'>('across');

  const cellNumbers = buildCellNumbers(puzzle);
  const wrongCellSet = new Set(wrongCells.map(c => `${c.row}-${c.col}`));

  const isCellHighlighted = useCallback((row: number, col: number) => {
    if (!activeClue) return false;
    const clues = getCellClues(puzzle, row, col);
    return clues.some(c => c.number === activeClue.number && c.direction === activeClue.direction);
  }, [activeClue, puzzle]);

  const handleCellClick = (row: number, col: number) => {
    if (puzzle.grid[row][col] === null) return;

    // If clicking the same cell, toggle direction
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

    inputRefs.current[row][col]?.focus();
  };

  const moveToNextCell = (row: number, col: number) => {
    if (direction === 'across') {
      for (let c = col + 1; c < puzzle.size; c++) {
        if (puzzle.grid[row][c] !== null) {
          setActiveCell({ row, col: c });
          inputRefs.current[row][c]?.focus();
          return;
        }
      }
    } else {
      for (let r = row + 1; r < puzzle.size; r++) {
        if (puzzle.grid[r][col] !== null) {
          setActiveCell({ row: r, col });
          inputRefs.current[r][col]?.focus();
          return;
        }
      }
    }
  };

  const moveToPrevCell = (row: number, col: number) => {
    if (direction === 'across') {
      for (let c = col - 1; c >= 0; c--) {
        if (puzzle.grid[row][c] !== null) {
          setActiveCell({ row, col: c });
          inputRefs.current[row][c]?.focus();
          return;
        }
      }
    } else {
      for (let r = row - 1; r >= 0; r--) {
        if (puzzle.grid[r][col] !== null) {
          setActiveCell({ row: r, col });
          inputRefs.current[r][col]?.focus();
          return;
        }
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    if (e.key === 'Backspace') {
      if (crosswordGrid[row]?.[col]) {
        updateCrosswordCell(row, col, '');
      } else {
        moveToPrevCell(row, col);
      }
      e.preventDefault();
    } else if (e.key === 'ArrowRight') {
      setDirection('across');
      moveToNextCell(row, col);
      e.preventDefault();
    } else if (e.key === 'ArrowLeft') {
      setDirection('across');
      moveToPrevCell(row, col);
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      setDirection('down');
      moveToNextCell(row, col);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      setDirection('down');
      moveToPrevCell(row, col);
      e.preventDefault();
    } else if (e.key === 'Tab') {
      e.preventDefault();
      const newDir = direction === 'across' ? 'down' : 'across';
      setDirection(newDir);
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      updateCrosswordCell(row, col, e.key);
      moveToNextCell(row, col);
      e.preventDefault();
    }
  };

  const cellSize = Math.min(60, (window.innerWidth - 48) / puzzle.size);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${puzzle.size}, ${cellSize}px)`,
        gap: '2px',
        background: 'var(--gray-900)',
        padding: '2px',
        borderRadius: 'var(--radius-sm)',
      }}
    >
      {Array.from({ length: puzzle.size }).map((_, row) =>
        Array.from({ length: puzzle.size }).map((_, col) => {
          const isBlack = puzzle.grid[row][col] === null;
          const cellKey = `${row}-${col}`;
          const number = cellNumbers[cellKey];
          const isWrong = wrongCellSet.has(cellKey);
          const isActive = activeCell?.row === row && activeCell?.col === col;
          const isHighlighted = isCellHighlighted(row, col);

          if (isBlack) {
            return (
              <div
                key={cellKey}
                style={{
                  width: cellSize,
                  height: cellSize,
                  background: 'var(--gray-900)',
                }}
              />
            );
          }

          return (
            <div
              key={cellKey}
              onClick={() => handleCellClick(row, col)}
              style={{
                width: cellSize,
                height: cellSize,
                background: isActive
                  ? 'var(--blue)'
                  : isWrong
                    ? '#FFE0E0'
                    : isHighlighted
                      ? '#D4E4FF'
                      : 'var(--white)',
                position: 'relative',
                cursor: 'pointer',
              }}
            >
              {number && (
                <span style={{
                  position: 'absolute',
                  top: '2px',
                  left: '3px',
                  fontSize: '9px',
                  fontWeight: 700,
                  color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--gray-500)',
                  lineHeight: 1,
                  pointerEvents: 'none',
                }}>
                  {number}
                </span>
              )}
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
                  fontSize: `${cellSize * 0.45}px`,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: isActive ? 'var(--white)' : isWrong ? 'var(--red)' : 'var(--gray-900)',
                  caretColor: 'transparent',
                  padding: 0,
                  paddingTop: '6px',
                }}
                maxLength={1}
                autoComplete="off"
                autoCapitalize="characters"
                inputMode="text"
              />
            </div>
          );
        })
      )}
    </div>
  );
}
