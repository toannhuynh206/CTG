import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

interface Archive {
  archived_date: string;
  player_count: number;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [currentPuzzle, setCurrentPuzzle] = useState<any>(null);
  const [gameLocked, setGameLocked] = useState(false);
  const [archives, setArchives] = useState<Archive[]>([]);
  const [loading, setLoading] = useState(true);
  const [lockLoading, setLockLoading] = useState(false);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [puzzleRes, lockRes, archivesRes] = await Promise.all([
        api.adminGetCurrentPuzzle(),
        api.adminGetLock(),
        api.adminGetArchives(),
      ]);
      setCurrentPuzzle(puzzleRes.puzzle);
      setGameLocked(lockRes.locked);
      setArchives(archivesRes.archives || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleLock = async () => {
    setLockLoading(true);
    try {
      const data = await api.adminSetLock(!gameLocked);
      setGameLocked(data.locked);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLockLoading(false);
    }
  };

  const handleArchive = async () => {
    if (!confirm('Archive the current game? This will:\n\n• Save boards + leaderboard\n• Clear all player sessions\n• Clear the current puzzle\n\nPlayers will need to start fresh.')) {
      return;
    }
    setArchiveLoading(true);
    setError('');
    try {
      await api.adminArchive();
      await loadData();
      alert('Game archived successfully!');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setArchiveLoading(false);
    }
  };

  const hasConnections = currentPuzzle?.connections_data?.groups?.length > 0;
  const hasCrossword = currentPuzzle?.crossword_data?.grid?.length > 0;
  const canArchive = hasConnections && hasCrossword;

  if (loading) {
    return (
      <div className="page" style={{ justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="page" style={{ gap: '20px', paddingTop: '20px' }}>
      {/* Title */}
      <div style={{ width: '100%', marginBottom: '4px' }}>
        <h2 style={{
          fontSize: '24px',
          fontWeight: 800,
          color: 'var(--blue)',
        }}>
          Admin Dashboard
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--gray-400)', marginTop: '4px' }}>
          Manage puzzles and game state
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Game Lock Toggle */}
      <div className="card" style={{
        padding: '20px',
        background: gameLocked
          ? 'linear-gradient(135deg, #FFF5F5 0%, #FEE2E2 100%)'
          : 'linear-gradient(135deg, #F0FFF4 0%, #DCFCE7 100%)',
        border: gameLocked ? '2px solid #FCA5A5' : '2px solid #86EFAC',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            {/* Icon */}
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: gameLocked ? '#FEE2E2' : '#DCFCE7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {gameLocked ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                </svg>
              )}
            </div>
            <div>
              <h3 style={{
                fontSize: '18px',
                fontWeight: 800,
                color: gameLocked ? '#DC2626' : '#16A34A',
                marginBottom: '2px',
              }}>
                {gameLocked ? 'Game Locked' : 'Game Unlocked'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
                {gameLocked ? 'Players see the lock screen' : 'Players can play puzzles'}
              </p>
            </div>
          </div>
          <button
            onClick={toggleLock}
            disabled={lockLoading}
            style={{
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 700,
              borderRadius: '10px',
              border: 'none',
              cursor: lockLoading ? 'not-allowed' : 'pointer',
              background: gameLocked ? '#16A34A' : '#DC2626',
              color: 'white',
              opacity: lockLoading ? 0.6 : 1,
              boxShadow: gameLocked
                ? '0 4px 12px rgba(22, 163, 74, 0.3)'
                : '0 4px 12px rgba(220, 38, 38, 0.3)',
              transition: 'all 0.15s ease',
            }}
          >
            {lockLoading ? '...' : gameLocked ? 'Unlock Game' : 'Lock Game'}
          </button>
        </div>
      </div>

      {/* Current Puzzle Section */}
      <div style={{ width: '100%' }}>
        <h3 style={{
          fontSize: '13px',
          fontWeight: 700,
          color: 'var(--gray-400)',
          textTransform: 'uppercase',
          letterSpacing: '1px',
          marginBottom: '12px',
        }}>
          Current Puzzle
        </h3>

        {/* Connections Card */}
        <button
          className="card"
          onClick={() => navigate('/admin/ctgadmin2026/connections')}
          style={{
            cursor: 'pointer',
            textAlign: 'left',
            marginBottom: '10px',
            padding: '18px 20px',
            border: hasConnections ? '2px solid #86EFAC' : '2px solid var(--gray-200)',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* Color dots */}
              <div style={{ display: 'flex', gap: '3px' }}>
                {['#F9DF6D', '#A0C35A', '#B0C4EF', '#BA81C5'].map((c, i) => (
                  <div key={i} style={{
                    width: '12px',
                    height: '36px',
                    borderRadius: '4px',
                    background: c,
                  }} />
                ))}
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '2px' }}>
                  Connections
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--gray-400)' }}>
                  {hasConnections
                    ? `${currentPuzzle.connections_data.groups.length} groups ready`
                    : 'Not configured'}
                </p>
              </div>
            </div>
            <div style={{
              fontSize: '13px',
              fontWeight: 700,
              padding: '8px 16px',
              borderRadius: '20px',
              background: hasConnections ? '#16A34A' : 'var(--gray-100)',
              color: hasConnections ? 'white' : 'var(--gray-500)',
            }}>
              {hasConnections ? 'Edit' : 'Setup'}
            </div>
          </div>
        </button>

        {/* Crossword Card */}
        <button
          className="card"
          onClick={() => navigate('/admin/ctgadmin2026/crossword')}
          style={{
            cursor: 'pointer',
            textAlign: 'left',
            padding: '18px 20px',
            border: hasCrossword ? '2px solid #86EFAC' : '2px solid var(--gray-200)',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {/* Mini grid icon */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 12px)',
                gap: '2px',
              }}>
                {[1,0,1,0,1,0,1,0,1].map((f, i) => (
                  <div key={i} style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '2px',
                    background: f ? 'var(--blue)' : 'var(--gray-300)',
                  }} />
                ))}
              </div>
              <div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '2px' }}>
                  Mini Crossword
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--gray-400)' }}>
                  {hasCrossword ? 'Grid and clues ready' : 'Not configured'}
                </p>
              </div>
            </div>
            <div style={{
              fontSize: '13px',
              fontWeight: 700,
              padding: '8px 16px',
              borderRadius: '20px',
              background: hasCrossword ? '#16A34A' : 'var(--gray-100)',
              color: hasCrossword ? 'white' : 'var(--gray-500)',
            }}>
              {hasCrossword ? 'Edit' : 'Setup'}
            </div>
          </div>
        </button>
      </div>

      {/* Archive Button */}
      <div style={{ width: '100%', marginTop: '8px' }}>
        <button
          onClick={handleArchive}
          disabled={!canArchive || archiveLoading}
          className="btn btn-full"
          style={{
            padding: '16px',
            fontSize: '15px',
            fontWeight: 700,
            borderRadius: '12px',
            background: canArchive ? 'var(--blue)' : 'var(--gray-200)',
            color: canArchive ? 'white' : 'var(--gray-400)',
            opacity: archiveLoading ? 0.6 : 1,
            cursor: !canArchive || archiveLoading ? 'not-allowed' : 'pointer',
            boxShadow: canArchive ? '0 4px 12px rgba(14, 51, 134, 0.25)' : 'none',
          }}
        >
          {archiveLoading ? 'Archiving...' : 'Archive Current Game'}
        </button>
        {!canArchive && (
          <p style={{
            fontSize: '12px',
            color: 'var(--gray-400)',
            textAlign: 'center',
            marginTop: '8px',
          }}>
            Configure both puzzles before archiving
          </p>
        )}
      </div>

      {/* Archives List */}
      {archives.length > 0 && (
        <div style={{ width: '100%', marginTop: '16px' }}>
          <h3 style={{
            fontSize: '13px',
            fontWeight: 700,
            color: 'var(--gray-400)',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '12px',
          }}>
            Past Games
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {archives.map((archive) => (
              <button
                key={archive.archived_date}
                className="card"
                onClick={() => navigate(`/admin/ctgadmin2026/archive/${archive.archived_date}`)}
                style={{
                  cursor: 'pointer',
                  textAlign: 'left',
                  padding: '14px 18px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gray-700)' }}>
                      {new Date(archive.archived_date + 'T12:00:00').toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--gray-400)', marginTop: '2px' }}>
                      {archive.player_count} player{archive.player_count !== 1 ? 's' : ''} completed
                    </p>
                  </div>
                  <div style={{
                    color: 'var(--gray-300)',
                    fontSize: '18px',
                    fontWeight: 300,
                  }}>
                    →
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
