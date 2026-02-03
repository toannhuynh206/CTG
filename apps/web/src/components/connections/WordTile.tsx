import { useGameStore } from '../../stores/gameStore';

interface WordTileProps {
  word: string;
}

export default function WordTile({ word }: WordTileProps) {
  const { selectedWords, selectWord, deselectWord } = useGameStore();
  const isSelected = selectedWords.includes(word);

  const handleClick = () => {
    if (isSelected) {
      deselectWord(word);
    } else {
      selectWord(word);
    }
  };

  return (
    <button
      onClick={handleClick}
      style={{
        padding: '14px 8px',
        borderRadius: 'var(--radius-sm)',
        border: 'none',
        background: isSelected ? 'var(--blue)' : 'var(--white)',
        color: isSelected ? 'var(--white)' : 'var(--gray-900)',
        fontWeight: 700,
        fontSize: '13px',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        cursor: 'pointer',
        transition: 'all 0.12s ease',
        boxShadow: isSelected ? 'var(--shadow-lg)' : 'var(--shadow)',
        transform: isSelected ? 'scale(1.03)' : 'scale(1)',
        lineHeight: '1.2',
        wordBreak: 'break-word',
      }}
    >
      {word}
    </button>
  );
}
