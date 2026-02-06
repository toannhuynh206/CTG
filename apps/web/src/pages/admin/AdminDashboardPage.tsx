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
    if (!confirm('Archive the current game? This will:\n- Save boards + leaderboard\n- Clear all player sessions\n- Clear the current puzzle\n\nPlayers will need to start fresh.')) {
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
    <div className="page" style={{ gap: '24px', paddingTop: '24px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--blue)' }}>
        Puzzle Admin
      </h2>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {/* Game Lock Toggle */}
      <div className="card" style={{
        padding: '16px',
        background: gameLocked ? '#FFF5F5' : '#F0FFF4',
        border: gameLocked ? '2px solid var(--red)' : '2px solid var(--conn-green)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h3 style={{
              fontSize: '16px',
              fontWeight: 800,
              color: gameLocked ? 'var(--red)' : 'var(--conn-green)',
              marginBottom: '4px',
            }}>
              {gameLocked ? 'Game Locked' : 'Game Unlocked'}
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--gray-500)' }}>
              {gameLocked
                ? 'Players cannot play puzzles'
                : 'Players can play puzzles'}
            </p>
          </div>
          <button
            onClick={toggleLock}
            disabled={lockLoading}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              fontWeight: 700,
              borderRadius: '8px',
              border: 'none',
              cursor: lockLoading ? 'not-allowed' : 'pointer',
              background: gameLocked ? 'var(--conn-green)' : 'var(--red)',
              color: 'var(--white)',
              opacity: lockLoading ? 0.6 : 1,
            }}
          >
            {lockLoading ? '...' : gameLocked ? 'Unlock' : 'Lock'}
          </button>
        </div>
      </div>

      {/* Current Puzzle Section */}
      <div style={{ marginTop: '8px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gray-600)', marginBottom: '12px' }}>
          Current Puzzle
        </h3>

        {/* Connections */}
        <button
          className="card"
          onClick={() => navigate('/admin/ctgadmin2026/connections')}
          style={{
            cursor: 'pointer',
            textAlign: 'left',
            marginBottom: '12px',
            border: hasConnections ? '2px solid var(--conn-green)' : '2px solid var(--gray-200)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ display: 'flex', gap: '4px', marginBottom: '10px' }}>
                {['var(--conn-yellow)', 'var(--conn-green)', 'var(--conn-blue)', 'var(--conn-purple)'].map((c, i) => (
                  <div key={i} style={{ width: '16px', height: '16px', borderRadius: '3px', background: c }} />
                ))}
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '4px' }}>Connections</h3>
              <p style={{ fontSize: '13px', color: 'var(--gray-400)' }}>
                {hasConnections
                  ? `${currentPuzzle.connections_data.groups.length} groups defined`
                  : 'Not set'}
              </p>
            </div>
            <div style={{
              fontSize: '13px',
              fontWeight: 700,
              padding: '6px 12px',
              borderRadius: '20px',
              background: hasConnections ? 'var(--conn-green)' : 'var(--gray-100)',
              color: hasConnections ? 'var(--white)' : 'var(--gray-500)',
            }}>
              {hasConnections ? 'Edit' : 'Create'}
            </div>
          </div>
        </button>

        {/* Crossword */}
        <button
          className="card"
          onClick={() => navigate('/admin/ctgadmin2026/crossword')}
          style={{
            cursor: 'pointer',
            textAlign: 'left',
            border: hasCrossword ? '2px solid var(--conn-green)' : '2px solid var(--gray-200)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 14px)',
                gap: '2px',
                marginBottom: '10px',
              }}>
                {[1,0,1,0,1,0,1,0,1].map((f, i) => (
                  <div key={i} style={{ width: '14px', height: '14px', borderRadius: '2px', background: f ? 'var(--blue)' : 'var(--gray-200)' }} />
                ))}
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, marginBottom: '4px' }}>Mini Crossword</h3>
              <p style={{ fontSize: '13px', color: 'var(--gray-400)' }}>
                {hasCrossword ? 'Grid and clues defined' : 'Not set'}
              </p>
            </div>
            <div style={{
              fontSize: '13px',
              fontWeight: 700,
              padding: '6px 12px',
              borderRadius: '20px',
              background: hasCrossword ? 'var(--conn-green)' : 'var(--gray-100)',
              color: hasCrossword ? 'var(--white)' : 'var(--gray-500)',
            }}>
              {hasCrossword ? 'Edit' : 'Create'}
            </div>
          </div>
        </button>
      </div>

      {/* Archive Button */}
      <div style={{ marginTop: '8px' }}>
        <button
          onClick={handleArchive}
          disabled={!canArchive || archiveLoading}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: '15px',
            fontWeight: 700,
            borderRadius: '8px',
            border: 'none',
            cursor: !canArchive || archiveLoading ? 'not-allowed' : 'pointer',
            background: canArchive ? 'var(--blue)' : 'var(--gray-300)',
            color: 'var(--white)',
            opacity: archiveLoading ? 0.6 : 1,
          }}
        >
          {archiveLoading ? 'Archiving...' : 'Archive Current Game'}
        </button>
        {!canArchive && (
          <p style={{ fontSize: '12px', color: 'var(--gray-400)', textAlign: 'center', marginTop: '8px' }}>
            Set both puzzles before archiving
          </p>
        )}
      </div>

      {/* Archives List */}
      {archives.length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--gray-600)', marginBottom: '12px' }}>
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
                  padding: '12px 16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--gray-700)' }}>
                      {new Date(archive.archived_date + 'T12:00:00').toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--gray-400)' }}>
                      {archive.player_count} player{archive.player_count !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <div style={{ color: 'var(--gray-400)' }}>→</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
