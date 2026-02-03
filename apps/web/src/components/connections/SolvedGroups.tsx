import type { ConnectionsGroup } from '@ctg/shared';
import { CONNECTION_COLORS } from '@ctg/shared';

interface SolvedGroupsProps {
  groups: ConnectionsGroup[];
}

export default function SolvedGroups({ groups }: SolvedGroupsProps) {
  if (groups.length === 0) return null;

  return (
    <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {groups.map((group, i) => (
        <div
          key={group.label}
          className="slide-down"
          style={{
            background: CONNECTION_COLORS[group.difficulty - 1] || CONNECTION_COLORS[0],
            borderRadius: 'var(--radius)',
            padding: '22px 16px',
            textAlign: 'center',
            animationDelay: `${i * 100}ms`,
            animationFillMode: 'backwards',
          }}
        >
          <div style={{
            fontWeight: 800,
            fontSize: '16px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '6px',
          }}>
            {group.label}
          </div>
          <div style={{
            fontSize: '14px',
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
