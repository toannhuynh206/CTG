const ROWS = [
  ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
  ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
  ['Z', 'X', 'C', 'V', 'B', 'N', 'M', 'DEL'],
];

interface CrosswordKeyboardProps {
  onKey: (key: string) => void;
}

export default function CrosswordKeyboard({ onKey }: CrosswordKeyboardProps) {
  const handleKey = (key: string) => {
    onKey(key === 'DEL' ? 'Backspace' : key);
  };

  return (
    <div style={{
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      gap: '5px',
      padding: '6px 2px',
      background: 'var(--bg-elevated)',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--border-subtle)',
      userSelect: 'none',
    }}>
      {ROWS.map((row, i) => (
        <div key={i} style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '4px',
        }}>
          {row.map(key => {
            const isDel = key === 'DEL';
            return (
              <button
                key={key}
                onPointerDown={(e) => {
                  e.preventDefault();
                  handleKey(key);
                }}
                style={{
                  minWidth: isDel ? '48px' : '30px',
                  flex: isDel ? undefined : 1,
                  maxWidth: isDel ? undefined : '38px',
                  height: '40px',
                  borderRadius: '6px',
                  border: 'none',
                  background: isDel ? 'var(--border-muted)' : 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  fontSize: isDel ? '12px' : '15px',
                  fontWeight: 700,
                  fontFamily: 'var(--font)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {isDel ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z" />
                    <line x1="18" y1="9" x2="12" y2="15" />
                    <line x1="12" y1="9" x2="18" y2="15" />
                  </svg>
                ) : key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
