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
        fontSize: '12px',
        fontWeight: 600,
        color: 'var(--gray-400)',
        textTransform: 'uppercase',
        letterSpacing: '1px',
        marginBottom: '4px',
      }}>
        {label}
      </div>
      <div style={{
        fontSize: '24px',
        fontWeight: 800,
        fontVariantNumeric: 'tabular-nums',
        color: 'var(--gray-700)',
      }}>
        {remaining}
      </div>
    </div>
  );
}
