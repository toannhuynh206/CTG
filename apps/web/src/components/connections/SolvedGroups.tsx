import type { ConnectionsGroup } from '@ctg/shared';
import { CONNECTION_COLORS } from '@ctg/shared';

interface SolvedGroupsProps {
  groups: ConnectionsGroup[];
}

export default function SolvedGroups({ groups }: SolvedGroupsProps) {
  if (groups.length === 0) return null;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {groups.map((group, i) => (
        <div
          key={group.label}
          className="slide-down"
          style={{
            background: CONNECTION_COLORS[group.difficulty - 1] || CONNECTION_COLORS[0],
            borderRadius: 'var(--radius)',
            padding: '14px 16px',
            textAlign: 'center',
            animationDelay: `${i * 100}ms`,
            animationFillMode: 'backwards',
          }}
        >
          <div style={{
            fontWeight: 800,
            fontSize: '14px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '4px',
          }}>
            {group.label}
          </div>
          <div style={{
            fontSize: '13px',
            fontWeight: 500,
            textTransform: 'uppercase',
          }}>
            {group.words.join(', ')}
          </div>
        </div>
      ))}
    </div>
  );
}
