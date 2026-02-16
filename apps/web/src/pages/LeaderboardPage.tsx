import { useEffect, useState } from 'react';
import { api } from '../api/client';
import type { LeaderboardEntry } from '@ctg/shared';
import { formatTime } from '../components/game/Timer';

interface YourEntry {
  rank: number;
  name: string;
  total_time_ms: number;
}

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'] as const;
const PODIUM_HEIGHTS = [140, 110, 90] as const;
// Display order: 2nd, 1st, 3rd
const PODIUM_ORDER = [1, 0, 2] as const;

function PodiumPlace({ entry, place }: { entry: LeaderboardEntry | null; place: number }) {
  const height = PODIUM_HEIGHTS[place];
  const color = MEDAL_COLORS[place];
  const label = place === 0 ? '1st' : place === 1 ? '2nd' : '3rd';

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      flex: 1,
      gap: '8px',
    }}>
      {/* Player info above podium */}
      {entry ? (
        <div className="fade-in" style={{
          textAlign: 'center',
          minHeight: '58px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-end',
          animationDelay: `${place * 100}ms`,
          animationFillMode: 'backwards',
        }}>
          <div style={{
            fontSize: place === 0 ? '15px' : '13px',
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: '1.2',
            wordBreak: 'break-word',
          }}>
            {entry.name}
          </div>
          <div style={{
            fontSize: '11px',
            color: 'var(--text-muted)',
            marginTop: '2px',
          }}>
            {entry.city}
          </div>
          <div style={{
            fontSize: '10px',
            color: 'var(--accent)',
            marginTop: '1px',
            fontWeight: 600,
          }}>
            @{entry.instagram}
          </div>
        </div>
      ) : (
        <div style={{ minHeight: '48px' }} />
      )}

      {/* Podium block */}
      <div style={{
        width: '100%',
        height: `${height}px`,
        background: `linear-gradient(180deg, ${color}22 0%, ${color}11 100%)`,
        borderRadius: '12px 12px 0 0',
        border: `2px solid ${color}44`,
        borderBottom: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        position: 'relative',
      }}>
        {/* Medal circle */}
        <div style={{
          width: place === 0 ? '44px' : '36px',
          height: place === 0 ? '44px' : '36px',
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${color}, ${color}99)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 2px 12px ${color}66`,
        }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontSize: place === 0 ? '18px' : '14px',
            fontWeight: 800,
            color: place === 0 ? '#1B1D23' : '#FFFFFF',
          }}>
            {place + 1}
          </span>
        </div>

        {/* Time */}
        {entry ? (
          <div style={{
            fontFamily: 'var(--font-display)',
            fontSize: place === 0 ? '16px' : '14px',
            fontWeight: 800,
            color,
            fontVariantNumeric: 'tabular-nums',
            textShadow: `0 0 12px ${color}44`,
          }}>
            {formatTime(entry.total_time_ms)}
          </div>
        ) : (
          <div style={{
            fontSize: '12px',
            color: 'var(--text-muted)',
            fontStyle: 'italic',
          }}>
            —
          </div>
        )}

        {/* Label */}
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: '10px',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}>
          {label}
        </div>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [yourEntry, setYourEntry] = useState<YourEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        const data = await api.getLeaderboard();
        if (data.hidden) {
          setHidden(true);
        } else {
          setEntries(data.entries || []);
          setYourEntry(data.yourEntry || null);
        }
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

  const top3 = [entries[0] || null, entries[1] || null, entries[2] || null];
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

      {hidden && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
            Leaderboard will be available after the game closes.
          </p>
        </div>
      )}

      {!error && !hidden && entries.length === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '15px' }}>
            No entries yet
          </p>
        </div>
      )}

      {entries.length > 0 && (
        <>
          {/* Podium — displayed as 2nd, 1st, 3rd */}
          <div style={{
            width: '100%',
            display: 'flex',
            alignItems: 'flex-end',
            gap: '6px',
            padding: '0 4px',
          }}>
            {PODIUM_ORDER.map(place => (
              <PodiumPlace key={place} entry={top3[place]} place={place} />
            ))}
          </div>

          {/* Your position card */}
          {yourEntry && (
            <div className="card fade-in" style={{
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              background: 'linear-gradient(135deg, var(--bg-tint-strong), var(--bg-card))',
              border: '2px solid var(--accent)',
              boxShadow: '0 0 20px var(--accent-glow)',
            }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <span style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '16px',
                  fontWeight: 800,
                  color: 'var(--accent-text)',
                }}>
                  {yourEntry.rank}
                </span>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--accent)',
                  textTransform: 'uppercase',
                  letterSpacing: '1.5px',
                  marginBottom: '2px',
                }}>
                  Your Ranking
                </div>
                <div style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                }}>
                  {yourEntry.name}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '20px',
                  fontWeight: 800,
                  color: 'var(--accent)',
                  fontVariantNumeric: 'tabular-nums',
                }}>
                  {formatTime(yourEntry.total_time_ms)}
                </div>
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-muted)',
                  fontWeight: 600,
                }}>
                  #{yourEntry.rank}
                </div>
              </div>
            </div>
          )}

        </>
      )}
    </div>
  );
}
