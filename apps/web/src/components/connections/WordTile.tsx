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
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        borderRadius: 'var(--radius-sm)',
        border: isSelected ? '2px solid var(--accent)' : '2px solid var(--border-subtle)',
        background: isSelected ? 'var(--accent)' : 'var(--bg-card)',
        color: isSelected ? 'var(--accent-text)' : 'var(--text-primary)',
        fontWeight: 700,
        fontSize: '12px',
        textTransform: 'uppercase',
        letterSpacing: '0.3px',
        cursor: 'pointer',
        transition: 'all 0.12s ease',
        boxShadow: isSelected ? '0 0 16px var(--accent-glow)' : 'var(--shadow)',
        transform: isSelected ? 'scale(1.02)' : 'scale(1)',
        lineHeight: '1.2',
        wordBreak: 'break-word',
        textAlign: 'center',
      }}
    >
      {word}
    </button>
  );
}
