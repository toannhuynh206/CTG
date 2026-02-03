import { useGameStore } from '../../stores/gameStore';
import WordTile from './WordTile';

interface WordGridProps {
  shaking: boolean;
}

export default function WordGrid({ shaking }: WordGridProps) {
  const { connectionsWords } = useGameStore();

  return (
    <div
      className={shaking ? 'shake' : ''}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '8px',
        width: '100%',
      }}
    >
      {connectionsWords.map((word) => (
        <WordTile key={word} word={word} />
      ))}
    </div>
  );
}
