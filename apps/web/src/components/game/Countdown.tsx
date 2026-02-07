import { useState, useEffect } from 'react';

interface CountdownProps {
  targetTime: string;
  label: string;
  onComplete?: () => void;
}

export default function Countdown({ targetTime, label, onComplete }: CountdownProps) {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const target = new Date(targetTime).getTime();

    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) {
        setRemaining('00:00:00');
        onComplete?.();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setRemaining(
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
      );
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetTime, onComplete]);

  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '12px',
        fontWeight: 700,
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '1.5px',
        marginBottom: '4px',
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: 'var(--font-display)',
        fontSize: '28px',
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        color: 'var(--accent)',
        textShadow: '0 0 16px var(--accent-glow)',
        transition: 'color 0.3s ease',
      }}>
        {remaining}
      </div>
    </div>
  );
}
