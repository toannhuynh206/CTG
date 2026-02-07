import { useState, useEffect, ReactNode } from 'react';
import { api } from '../api/client';

interface LockGuardProps {
  children: ReactNode;
}

export default function LockGuard({ children }: LockGuardProps) {
  const [checking, setChecking] = useState(true);
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    checkLockStatus();
  }, []);

  const checkLockStatus = async () => {
    try {
      const status = await api.getScheduleStatus();
      // game_available is false when locked OR no puzzle set
      setLocked(!status.game_available);
    } catch (err) {
      // If we can't check, assume locked for safety
      setLocked(true);
    } finally {
      setChecking(false);
    }
  };

  if (checking) {
    return (
      <div className="page" style={{ justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (locked) {
    return (
      <div className="page" style={{ justifyContent: 'center', gap: '24px' }}>
        <div className="card fade-in" style={{
          textAlign: 'center',
          padding: '48px 32px',
          maxWidth: '360px',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Train tracks background */}
          <svg
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              opacity: 0.08,
              pointerEvents: 'none',
            }}
            viewBox="0 0 360 400"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            {/* Horizontal track top */}
            <line x1="0" y1="60" x2="360" y2="60" stroke="#555" strokeWidth="2.5" />
            <line x1="0" y1="68" x2="360" y2="68" stroke="#555" strokeWidth="2.5" />
            {[...Array(18)].map((_, i) => (
              <line key={`ht-${i}`} x1={i * 20 + 5} y1="57" x2={i * 20 + 5} y2="71" stroke="#555" strokeWidth="2" />
            ))}

            {/* Horizontal track bottom */}
            <line x1="0" y1="330" x2="360" y2="330" stroke="#555" strokeWidth="2.5" />
            <line x1="0" y1="338" x2="360" y2="338" stroke="#555" strokeWidth="2.5" />
            {[...Array(18)].map((_, i) => (
              <line key={`hb-${i}`} x1={i * 20 + 5} y1="327" x2={i * 20 + 5} y2="341" stroke="#555" strokeWidth="2" />
            ))}

            {/* Diagonal track top-left to bottom-right */}
            <line x1="-20" y1="0" x2="120" y2="400" stroke="#555" strokeWidth="2.5" />
            <line x1="-12" y1="0" x2="128" y2="400" stroke="#555" strokeWidth="2.5" />
            {[...Array(14)].map((_, i) => {
              const y = i * 30;
              const x = -20 + (140 * y) / 400;
              return <line key={`dl-${i}`} x1={x - 3} y1={y} x2={x + 11} y2={y + 4} stroke="#555" strokeWidth="2" />;
            })}

            {/* Diagonal track top-right to bottom-left */}
            <line x1="380" y1="0" x2="240" y2="400" stroke="#555" strokeWidth="2.5" />
            <line x1="372" y1="0" x2="232" y2="400" stroke="#555" strokeWidth="2.5" />
            {[...Array(14)].map((_, i) => {
              const y = i * 30;
              const x = 380 - (140 * y) / 400;
              return <line key={`dr-${i}`} x1={x - 8} y1={y + 4} x2={x + 6} y2={y} stroke="#555" strokeWidth="2" />;
            })}
          </svg>

          {/* Lock Icon */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent) 0%, var(--accent-dark) 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 8px 24px var(--accent-glow)',
            position: 'relative',
            zIndex: 1,
          }}>
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h2 style={{
            fontSize: '24px',
            fontWeight: 800,
            color: 'var(--gray-900)',
            marginBottom: '12px',
          }}>
            Puzzle Locked
          </h2>

          <p style={{
            fontSize: '16px',
            color: 'var(--gray-500)',
            lineHeight: '1.6',
            marginBottom: '24px',
          }}>
            The puzzle is currently locked. Check back soon!
          </p>

          <div style={{
            background: 'var(--gray-100)',
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
          }}>
            <p style={{
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--gray-500)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: '4px',
            }}>
              Next Game
            </p>
            <p style={{
              fontSize: '15px',
              fontWeight: 700,
              color: 'var(--blue)',
            }}>
              Monday 8am – 4pm CST
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
