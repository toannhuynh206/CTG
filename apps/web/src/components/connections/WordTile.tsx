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
        padding: '12px',
        borderRadius: 'var(--radius)',
        border: 'none',
        background: isSelected ? 'var(--blue)' : 'var(--white)',
        color: isSelected ? 'var(--white)' : 'var(--gray-900)',
        fontWeight: 700,
        fontSize: 'clamp(13px, 2.5vw, 16px)',
        minHeight: 'clamp(68px, 12vw, 88px)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
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
