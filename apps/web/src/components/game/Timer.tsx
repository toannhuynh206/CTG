import { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

export default function Timer() {
  const { startedAt, completedAt, serverTimeOffset, totalTimeMs } = useGameStore();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (totalTimeMs) {
      setElapsed(totalTimeMs);
      return;
    }

    if (!startedAt) {
      setElapsed(0);
      return;
    }

    if (completedAt) {
      const diff = new Date(completedAt).getTime() - new Date(startedAt).getTime();
      setElapsed(diff);
      return;
    }

    const startMs = new Date(startedAt).getTime();

    const tick = () => {
      const serverNow = Date.now() + serverTimeOffset;
      setElapsed(Math.max(0, serverNow - startMs));
    };

    tick();
    const interval = setInterval(tick, 50);
    return () => clearInterval(interval);
  }, [startedAt, completedAt, serverTimeOffset, totalTimeMs]);

  return <div className="timer">{formatTime(elapsed)}</div>;
}

export { formatTime };
