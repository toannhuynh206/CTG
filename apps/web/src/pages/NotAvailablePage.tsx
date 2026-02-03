import { useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import Countdown from '../components/game/Countdown';

export default function NotAvailablePage() {
  const { checkSchedule, nextGameStart } = useGameStore();

  useEffect(() => {
    checkSchedule();
  }, []);

  return (
    <div className="page" style={{ justifyContent: 'center', gap: '32px' }}>
      <div className="card fade-in" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <div style={{
          fontSize: '48px',
          marginBottom: '16px',
        }}>
          {/* Clock icon */}
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', display: 'block' }}>
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        </div>

        <h2 style={{
          fontSize: '22px',
          fontWeight: 800,
          color: 'var(--blue)',
          marginBottom: '8px',
        }}>
          Not Game Time Yet
        </h2>

        <p style={{
          fontSize: '14px',
          color: 'var(--gray-400)',
          lineHeight: '1.5',
          marginBottom: '24px',
        }}>
          CTG is available every Monday from 8am to 3pm CT.
          Come back when it's game time!
        </p>

        {nextGameStart && (
          <Countdown
            targetTime={nextGameStart}
            label="Next game starts in"
          />
        )}
      </div>
    </div>
  );
}
