import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../stores/gameStore';
import ThemeSelector from '../components/ui/ThemeSelector';
import ModeToggle from '../components/ui/ModeToggle';

export default function HomePage() {
  const navigate = useNavigate();
  const { checkSchedule, gameAvailable, sessionToken, loadGameState } = useGameStore();

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
        {/* CTA Roundel Logo */}
        <div style={{
          width: '110px',
          height: '110px',
          borderRadius: '50%',
          border: `4px solid var(--accent)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          background: 'var(--bg-card)',
          boxShadow: '0 0 30px var(--accent-glow)',
          transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
        }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: '48px',
            fontWeight: 700,
            color: 'var(--text-primary)',
            letterSpacing: '2px',
          }}>
            CTG
          </span>
        </div>

        <h2 style={{
          fontFamily: 'var(--font-display)',
          fontSize: '30px',
          fontWeight: 700,
          color: 'var(--text-primary)',
          marginBottom: '8px',
          letterSpacing: '1px',
        }}>
          Monday Morning Games
        </h2>
        <p style={{
          fontSize: '15px',
          color: 'var(--text-muted)',
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
          color: 'var(--text-muted)',
        }}>
          Available Mondays 8am-3pm CT
        </div>
      </div>

      {/* Station Info Panels */}
      <div style={{
        display: 'flex',
        gap: '24px',
        justifyContent: 'center',
        marginTop: '8px',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--accent)',
            transition: 'color 0.3s ease',
          }}>2</div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontWeight: 700,
            letterSpacing: '1px',
          }}>PUZZLES</div>
        </div>
        <div style={{ width: '1px', background: 'var(--gray-200)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--accent)',
            transition: 'color 0.3s ease',
          }}>1</div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontWeight: 700,
            letterSpacing: '1px',
          }}>TIMER</div>
        </div>
        <div style={{ width: '1px', background: 'var(--gray-200)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '28px',
            fontWeight: 700,
            color: 'var(--accent)',
            transition: 'color 0.3s ease',
          }}>5pm</div>
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontWeight: 700,
            letterSpacing: '1px',
          }}>LEADERBOARD</div>
        </div>
      </div>

      {/* Theme Selector */}
      <div style={{ width: '100%', maxWidth: '360px', marginTop: '16px' }} className="fade-in">
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '12px',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '1.5px',
          marginBottom: '12px',
          textAlign: 'center',
        }}>
          Choose Your Line
        </div>
        <ThemeSelector />

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
          <ModeToggle />
        </div>
      </div>
    </div>
  );
}
