import { useNavigate, useLocation } from 'react-router-dom';
import { useGameStore } from '../../stores/gameStore';

export default function PuzzleNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { connectionsCompleted, connectionsFailed, crosswordCompleted, gameFailed } = useGameStore();

  const isConnections = location.pathname.includes('connections');
  const isCrossword = location.pathname.includes('crossword');

  return (
    <div style={{
      display: 'flex',
      gap: '6px',
      width: '100%',
      maxWidth: '320px',
      margin: '0 auto',
    }}>
      <button
        onClick={() => navigate('/game/connections')}
        style={{
          flex: 1,
          padding: '8px 0',
          fontSize: '13px',
          fontWeight: 700,
          fontFamily: 'var(--font)',
          border: 'none',
          borderRadius: '8px',
          cursor: connectionsCompleted || connectionsFailed ? 'default' : 'pointer',
          background: isConnections ? 'var(--blue)' : 'var(--gray-100)',
          color: isConnections ? 'var(--white)' : connectionsCompleted ? 'var(--conn-green)' : connectionsFailed ? 'var(--red)' : 'var(--gray-500)',
          transition: 'all 0.15s ease',
        }}
      >
        {connectionsCompleted ? 'Connections \u2713' : connectionsFailed ? 'Connections \u2717' : 'Connections'}
      </button>
      <button
        onClick={() => navigate('/game/crossword')}
        style={{
          flex: 1,
          padding: '8px 0',
          fontSize: '13px',
          fontWeight: 700,
          fontFamily: 'var(--font)',
          border: 'none',
          borderRadius: '8px',
          cursor: crosswordCompleted || gameFailed ? 'default' : 'pointer',
          background: isCrossword ? 'var(--blue)' : 'var(--gray-100)',
          color: isCrossword ? 'var(--white)' : crosswordCompleted ? 'var(--conn-green)' : gameFailed ? 'var(--red)' : 'var(--gray-500)',
          transition: 'all 0.15s ease',
        }}
      >
        {crosswordCompleted ? 'Mini \u2713' : gameFailed ? 'Mini \u2717' : 'Mini'}
      </button>
    </div>
  );
}
