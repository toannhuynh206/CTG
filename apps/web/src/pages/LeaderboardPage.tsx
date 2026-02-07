import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { LeaderboardEntry } from '@ctg/shared';
import { formatTime } from '../components/game/Timer';

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const data = await api.getLeaderboard();
        setEntries(data.entries || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadLeaderboard();
  }, []);

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page" style={{ gap: '20px', paddingTop: '24px' }}>
      <h2 style={{
        fontFamily: 'var(--font-display)',
        fontSize: '26px',
        fontWeight: 700,
        color: 'var(--text-primary)',
        letterSpacing: '0.5px',
      }}>
        Leaderboard
      </h2>

      {error && (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>{error}</p>
        </div>
      )}

      {!error && entries.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
            No entries yet
          </p>
        </div>
      )}

      {entries.length > 0 && (
        <div style={{ width: '100%', borderRadius: 'var(--radius)', overflow: 'hidden' }}>
          {entries.map((entry, i) => (
            <div
              key={i}
              className="fade-in"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 16px',
                background: i === 0
                  ? 'linear-gradient(135deg, rgba(249, 227, 0, 0.15), rgba(249, 227, 0, 0.05))'
                  : i % 2 === 0
                    ? 'var(--bg-card)'
                    : 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                borderBottom: i === 0 ? '1px solid rgba(249, 227, 0, 0.2)' : '1px solid rgba(255,255,255,0.04)',
                animationDelay: `${i * 50}ms`,
                animationFillMode: 'backwards',
              }}
            >
              <div style={{
                fontFamily: 'var(--font-display)',
                fontSize: '20px',
                fontWeight: 700,
                width: '36px',
                color: i === 0 ? 'var(--cta-yellow)' : 'var(--text-muted)',
              }}>
                {entry.rank}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-primary)' }}>{entry.name}</div>
                <div style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  marginTop: '1px',
                }}>
                  {entry.city} · @{entry.instagram}
                </div>
              </div>

              <div style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '17px',
                fontVariantNumeric: 'tabular-nums',
                color: i === 0 ? 'var(--cta-yellow)' : 'var(--accent)',
                transition: 'color 0.3s ease',
              }}>
                {formatTime(entry.total_time_ms)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
