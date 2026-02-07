import type { ConnectionsGroup } from '@ctg/shared';
import { CONNECTION_COLORS } from '@ctg/shared';

interface SolvedGroupsProps {
  groups: ConnectionsGroup[];
}

// Text colors for each CTA background to ensure readability
const TEXT_COLORS: Record<number, string> = {
  1: '#1B1D23', // Dark text on Yellow
  2: '#FFFFFF', // White text on Green
  3: '#FFFFFF', // White text on Blue
  4: '#FFFFFF', // White text on Purple
};

export default function SolvedGroups({ groups }: SolvedGroupsProps) {
  if (groups.length === 0) return null;

  // Match the grid width
  const gridSize = Math.min(360, window.innerWidth - 32);

  return (
    <div style={{
      width: gridSize,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px'
    }}>
      {groups.map((group, i) => (
        <div
          key={group.label}
          className="slide-down"
          style={{
            background: CONNECTION_COLORS[group.difficulty - 1] || CONNECTION_COLORS[0],
            borderRadius: 'var(--radius-sm)',
            padding: '16px',
            textAlign: 'center',
            animationDelay: `${i * 100}ms`,
            animationFillMode: 'backwards',
            color: TEXT_COLORS[group.difficulty] || '#1B1D23',
          }}
        >
          <div style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            marginBottom: '4px',
          }}>
            {group.label}
          </div>
          <div style={{
            fontSize: '12px',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
          }}>
            {group.words.join(', ')}
          </div>
        </div>
      ))}
    </div>
  );
}
