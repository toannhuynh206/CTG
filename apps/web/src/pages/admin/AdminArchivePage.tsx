import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../api/client';
import { CONNECTION_COLORS } from '@ctg/shared';

interface LeaderboardEntry {
  player_name: string;
  city: string;
  instagram: string;
  time_ms: number;
  rank: number;
}

interface Archive {
  id: string;
  archived_date: string;
  created_at: string;
  connections_data: any;
  crossword_data: any;
  leaderboard: LeaderboardEntry[];
}

function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function AdminArchivePage() {
  const navigate = useNavigate();
  const { archiveId } = useParams();
  const [archive, setArchive] = useState<Archive | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!archiveId) return;
    loadArchive();
  }, [archiveId]);

  const loadArchive = async () => {
    setLoading(true);
    try {
      const data = await api.adminGetArchive(archiveId!);
      setArchive(data.archive);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page" style={{ justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  if (error || !archive) {
    return (
      <div className="page" style={{ gap: '24px', paddingTop: '24px' }}>
        <button
          onClick={() => navigate('/admin/ctgadmin2026/dashboard')}
          className="btn btn-outline"
          style={{ alignSelf: 'flex-start' }}
        >
          Back
        </button>
        <div className="error-message">{error || 'Archive not found'}</div>
      </div>
    );
  }

  const formattedDate = new Date(archive.archived_date + 'T12:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="page" style={{ gap: '24px', paddingTop: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
        <button
          onClick={() => navigate('/admin/ctgadmin2026/dashboard')}
          className="btn btn-outline"
          style={{ padding: '8px 14px', fontSize: '14px' }}
        >
          Back
        </button>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--blue)' }}>
            {formattedDate}
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--gray-400)' }}>
            {archive.leaderboard.length} player{archive.leaderboard.length !== 1 ? 's' : ''}
          </p>
          <p style={{ fontSize: '12px', color: 'var(--gray-300)' }}>
            Archived at {new Date(archive.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
          </p>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: 800,
          color: 'var(--blue)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '16px',
        }}>
          Leaderboard
        </h3>
        {archive.leaderboard.length === 0 ? (
          <p style={{ color: 'var(--gray-400)', fontSize: '14px' }}>No completions</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {archive.leaderboard.map((entry) => (
              <div
                key={entry.rank}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 12px',
                  background: entry.rank <= 3 ? '#FFFDE7' : 'var(--gray-50)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <span style={{
                  fontSize: '16px',
                  fontWeight: 800,
                  color: entry.rank === 1 ? '#FFB300' : entry.rank === 2 ? '#78909C' : entry.rank === 3 ? '#8D6E63' : 'var(--gray-400)',
                  minWidth: '24px',
                }}>
                  #{entry.rank}
                </span>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gray-700)' }}>
                    {entry.player_name}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--gray-400)' }}>
                    {entry.city} · @{entry.instagram}
                  </p>
                </div>
                <span style={{
                  fontSize: '15px',
                  fontWeight: 700,
                  color: 'var(--blue)',
                  fontFamily: 'monospace',
                }}>
                  {formatTime(entry.time_ms)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connections */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: 800,
          color: 'var(--blue)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '16px',
        }}>
          Connections
        </h3>
        {archive.connections_data?.groups?.map((group: any, i: number) => (
          <div
            key={i}
            style={{
              background: CONNECTION_COLORS[i] || 'var(--gray-200)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 16px',
              marginBottom: '8px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '14px', textTransform: 'uppercase' }}>
              {group.label}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 500, marginTop: '4px', textTransform: 'uppercase' }}>
              {group.words.join(', ')}
            </div>
          </div>
        ))}
      </div>

      {/* Crossword */}
      <div className="card" style={{ padding: '20px' }}>
        <h3 style={{
          fontSize: '14px',
          fontWeight: 800,
          color: 'var(--blue)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '16px',
        }}>
          Crossword
        </h3>
        {archive.crossword_data?.grid && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${archive.crossword_data.size || 5}, 36px)`,
            gap: '2px',
            background: 'var(--gray-900)',
            padding: '2px',
            borderRadius: 'var(--radius-sm)',
            width: 'fit-content',
          }}>
            {archive.crossword_data.grid.map((row: (string | null)[], r: number) =>
              row.map((cell, c) => (
                <div
                  key={`${r}-${c}`}
                  style={{
                    width: '36px',
                    height: '36px',
                    background: cell === null ? 'var(--gray-900)' : 'var(--white)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '16px',
                    fontWeight: 700,
                    color: 'var(--gray-700)',
                  }}
                >
                  {cell}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
