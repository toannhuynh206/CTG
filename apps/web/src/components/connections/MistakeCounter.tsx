interface MistakeCounterProps {
  mistakes: number;
  max: number;
}

export default function MistakeCounter({ mistakes, max }: MistakeCounterProps) {
  return (
    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
      <span style={{
        fontFamily: 'var(--font-display)',
        fontSize: '12px',
        fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '1px',
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
              background: i < mistakes ? 'var(--cta-red)' : 'var(--gray-300)',
              transition: 'background 0.2s ease',
              boxShadow: i < mistakes ? '0 0 6px rgba(198, 12, 48, 0.4)' : 'none',
            }}
          />
        ))}
      </div>
    </div>
  );
}
