import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import type { LeaderboardEntry } from '@ctg/shared';
import { formatTime } from '../components/game/Timer';

export default function LeaderboardPage() {
  const [searchParams] = useSearchParams();
  const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const data = await api.getLeaderboard(date);
        setEntries(data.entries || []);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    loadLeaderboard();
  }, [date]);

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
        fontSize: '22px',
        fontWeight: 800,
        color: 'var(--blue)',
      }}>
        Leaderboard
      </h2>

      <div style={{
        fontSize: '13px',
        color: 'var(--gray-400)',
        fontWeight: 500,
      }}>
        {new Date(date + 'T12:00:00').toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })}
      </div>

      {error && (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--gray-500)', fontSize: '15px' }}>{error}</p>
        </div>
      )}

      {!error && entries.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--gray-400)', fontSize: '15px' }}>
            No entries yet
          </p>
        </div>
      )}

      {entries.length > 0 && (
        <div style={{ width: '100%' }}>
          {entries.map((entry, i) => (
            <div
              key={i}
              className="fade-in"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '14px 16px',
                background: i === 0 ? 'var(--blue)' : i % 2 === 0 ? 'var(--white)' : 'var(--gray-100)',
                color: i === 0 ? 'var(--white)' : 'var(--gray-900)',
                borderRadius: i === 0 ? 'var(--radius)' : '0',
                marginBottom: i === 0 ? '4px' : '0',
                animationDelay: `${i * 50}ms`,
                animationFillMode: 'backwards',
              }}
            >
              <div style={{
                fontSize: '18px',
                fontWeight: 900,
                width: '36px',
                color: i === 0 ? 'var(--conn-yellow)' : 'var(--gray-400)',
              }}>
                {entry.rank}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '15px' }}>{entry.name}</div>
                <div style={{
                  fontSize: '12px',
                  opacity: 0.6,
                  marginTop: '1px',
                }}>
                  {entry.city} · @{entry.instagram}
                </div>
              </div>

              <div style={{
                fontWeight: 800,
                fontSize: '16px',
                fontVariantNumeric: 'tabular-nums',
                color: i === 0 ? 'var(--conn-yellow)' : 'var(--blue)',
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
