import { useGameStore } from '../../stores/gameStore';
import WordTile from './WordTile';

interface WordGridProps {
  shaking: boolean;
}

export default function WordGrid({ shaking }: WordGridProps) {
  const { connectionsWords } = useGameStore();

  // Calculate cell size to match crossword proportions (square grid)
  const gridSize = Math.min(360, window.innerWidth - 32);
  const cellSize = (gridSize - 24) / 4; // 4 columns, 3 gaps of 8px

  return (
    <div
      className={shaking ? 'shake' : ''}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(4, ${cellSize}px)`,
        gridAutoRows: `${cellSize}px`,
        gap: '8px',
        width: 'fit-content',
        margin: '0 auto',
      }}
    >
      {connectionsWords.map((word) => (
        <WordTile key={word} word={word} />
      ))}
    </div>
  );
}
