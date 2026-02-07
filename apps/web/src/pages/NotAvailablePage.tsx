import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';

export default function NotAvailablePage() {
  const navigate = useNavigate();
  const { checkSchedule, gameAvailable } = useGameStore();

  useEffect(() => {
    checkSchedule();
  }, []);

  // If game becomes available, redirect to home
  useEffect(() => {
    if (gameAvailable) {
      navigate('/');
    }
  }, [gameAvailable, navigate]);

  return (
    <div className="page" style={{ justifyContent: 'center', gap: '32px' }}>
      <div className="card fade-in" style={{ textAlign: 'center', padding: '40px 24px' }}>
        <div style={{ marginBottom: '16px' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ margin: '0 auto', display: 'block' }}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '24px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '8px',
        }}>
          Game Locked
        </h2>

        <p style={{
          fontSize: '14px',
          color: 'var(--text-muted)',
          lineHeight: '1.5',
          marginBottom: '24px',
        }}>
          The game is currently locked. Check back later when the puzzles are ready!
        </p>

        <button
          className="btn btn-secondary"
          onClick={() => checkSchedule()}
        >
          Check Again
        </button>
      </div>
    </div>
  );
}
