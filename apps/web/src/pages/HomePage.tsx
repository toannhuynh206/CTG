import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';

export default function HomePage() {
  const navigate = useNavigate();
  const { checkSchedule, sessionToken, loadGameState } = useGameStore();

  useEffect(() => {
    checkSchedule();
  }, []);

  const handlePlay = async () => {
    if (sessionToken) {
      await loadGameState();
      navigate('/game');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="page" style={{ justifyContent: 'center', gap: '32px' }}>
      <div style={{ textAlign: 'center' }} className="fade-in">
        <div style={{
          width: '100px',
          height: '100px',
          background: 'var(--blue)',
          borderRadius: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: 'var(--shadow-lg)',
        }}>
          <span style={{ fontSize: '48px', fontWeight: 900, color: 'var(--white)' }}>C</span>
        </div>

        <h2 style={{
          fontSize: '28px',
          fontWeight: 900,
          color: 'var(--blue)',
          marginBottom: '8px',
        }}>
          Monday Morning Games
        </h2>
        <p style={{
          fontSize: '15px',
          color: 'var(--gray-500)',
          lineHeight: '1.5',
          maxWidth: '320px',
          margin: '0 auto',
        }}>
          Two puzzles. One timer. Complete Connections and the Mini Crossword
          for the fastest time.
        </p>
      </div>

      <div style={{ width: '100%', maxWidth: '320px' }} className="fade-in">
        <button
          className="btn btn-primary btn-full"
          onClick={handlePlay}
          style={{ fontSize: '18px', padding: '16px' }}
        >
          Play Now
        </button>

        <div style={{
          textAlign: 'center',
          marginTop: '16px',
          fontSize: '13px',
          color: 'var(--gray-400)',
        }}>
          Available Mondays 8am–3pm CT
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '24px',
        justifyContent: 'center',
        marginTop: '8px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--blue)' }}>2</div>
          <div style={{ fontSize: '12px', color: 'var(--gray-400)', fontWeight: 600 }}>PUZZLES</div>
        </div>
        <div style={{ width: '1px', background: 'var(--gray-200)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--red)' }}>1</div>
          <div style={{ fontSize: '12px', color: 'var(--gray-400)', fontWeight: 600 }}>TIMER</div>
        </div>
        <div style={{ width: '1px', background: 'var(--gray-200)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--blue)' }}>5pm</div>
          <div style={{ fontSize: '12px', color: 'var(--gray-400)', fontWeight: 600 }}>LEADERBOARD</div>
        </div>
      </div>
    </div>
  );
}
