interface MistakeCounterProps {
  mistakes: number;
  max: number;
}

export default function MistakeCounter({ mistakes, max }: MistakeCounterProps) {
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      <span style={{
        fontSize: '12px',
        fontWeight: 600,
        color: 'var(--gray-400)',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        Mistakes
      </span>
      <div style={{ display: 'flex', gap: '4px' }}>
        {Array.from({ length: max }).map((_, i) => (
          <div
            key={i}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: i < mistakes ? 'var(--red)' : 'var(--gray-200)',
              transition: 'background 0.2s ease',
            }}
          />
        ))}
      </div>
    </div>
  );
}
