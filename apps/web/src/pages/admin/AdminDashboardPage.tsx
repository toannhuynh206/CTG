import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';

function getNextMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const daysUntil = day === 1 ? 0 : (1 - day + 7) % 7 || 7;
  const next = new Date(now);
  next.setDate(now.getDate() + daysUntil);
  return next.toISOString().split('T')[0];
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [date, setDate] = useState(getNextMonday());
  const [existingPuzzle, setExistingPuzzle] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPuzzle();
  }, [date]);

  const loadPuzzle = async () => {
    setLoading(true);
    try {
      const data = await api.adminGetPuzzle(date);
      setExistingPuzzle(data.puzzle);
    } catch {
      setExistingPuzzle(null);
    } finally {
      setLoading(false);
    }
  };

  const hasConnections = existingPuzzle?.connections_data?.groups?.length > 0;
  const hasCrossword = existingPuzzle?.crossword_data?.grid?.length > 0;

  return (
    <div className="page" style={{ gap: '24px', paddingTop: '24px' }}>
      <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--blue)' }}>
        Puzzle Admin
      </h2>

      <div className="card" style={{ padding: '16px' }}>
        <div className="input-group" style={{ marginBottom: '0' }}>
          <label>Puzzle Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ fontSize: '16px' }}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px' }}>
          <div className="spinner" />
        </div>
      ) : (
        <>
          {/* Connections */}
          <button
            className="card"
            onClick={() => navigate(`/admin/ctgadmin2026/connections?date=${date}`)}
            style={{
              cursor: 'pointer',
              textAlign: 'left',
              border: hasConnections ? '2px solid var(--conn-green)' : '2px solid var(--gray-200)',
              transition: 'border-color 0.15s ease',
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
                    ? `${existingPuzzle.connections_data.groups.length} groups defined`
                    : 'Not created yet'}
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
            onClick={() => navigate(`/admin/ctgadmin2026/crossword?date=${date}`)}
            style={{
              cursor: 'pointer',
              textAlign: 'left',
              border: hasCrossword ? '2px solid var(--conn-green)' : '2px solid var(--gray-200)',
              transition: 'border-color 0.15s ease',
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
                  {hasCrossword ? 'Grid and clues defined' : 'Not created yet'}
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
        </>
      )}
    </div>
  );
}
