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
      // gameAvailable is false when locked OR no puzzle set
      setLocked(!status.gameAvailable);
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
      <div className="page" style={{ justifyContent: 'center', gap: '32px' }}>
        <div className="card fade-in" style={{ textAlign: 'center', padding: '40px 24px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--blue)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ margin: '0 auto', display: 'block' }}
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>

          <h2 style={{
            fontSize: '22px',
            fontWeight: 800,
            color: 'var(--blue)',
            marginBottom: '8px',
          }}>
            Puzzle Locked
          </h2>

          <p style={{
            fontSize: '16px',
            color: 'var(--gray-500)',
            lineHeight: '1.6',
            marginBottom: '8px',
          }}>
            The puzzle is now locked.
          </p>

          <p style={{
            fontSize: '14px',
            color: 'var(--gray-400)',
            lineHeight: '1.5',
          }}>
            Stay tuned for the next one on Monday from 8am - 4pm CST
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
