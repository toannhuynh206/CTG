import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { CONNECTION_COLORS } from '@ctg/shared';

const DIFFICULTY_LABELS = ['Easy', 'Medium', 'Hard', 'Tricky'];

const SAMPLE_GROUPS: GroupDraft[] = [
  { label: 'Chicago Landmarks', words: ['BEAN', 'NAVY PIER', 'WILLIS', 'MILLENNIUM'], difficulty: 1 },
  { label: 'Pizza Styles', words: ['DEEP DISH', 'THIN CRUST', 'STUFFED', 'TAVERN'], difficulty: 2 },
  { label: 'Cubs Players', words: ['BANKS', 'SANTO', 'SANDBERG', 'SOSA'], difficulty: 3 },
  { label: '___ Park', words: ['LINCOLN', 'HYDE', 'GRANT', 'WRIGLEY'], difficulty: 4 },
];

interface GroupDraft {
  label: string;
  words: [string, string, string, string];
  difficulty: number;
}

function emptyGroup(difficulty: number): GroupDraft {
  return { label: '', words: ['', '', '', ''], difficulty };
}

export default function AdminConnectionsPage() {
  const navigate = useNavigate();

  const [groups, setGroups] = useState<GroupDraft[]>([
    emptyGroup(1),
    emptyGroup(2),
    emptyGroup(3),
    emptyGroup(4),
  ]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // Load existing puzzle data
  useEffect(() => {
    api.adminGetCurrentPuzzle().then(data => {
      if (data.puzzle?.connections_data?.groups?.length === 4) {
        setGroups(data.puzzle.connections_data.groups.map((g: any) => ({
          label: g.label,
          words: g.words as [string, string, string, string],
          difficulty: g.difficulty,
        })));
      }
    }).catch(() => {});
  }, []);

  const updateGroup = (idx: number, field: string, value: string) => {
    setGroups(prev => prev.map((g, i) => {
      if (i !== idx) return g;
      return { ...g, [field]: value };
    }));
  };

  const updateWord = (groupIdx: number, wordIdx: number, value: string) => {
    setGroups(prev => prev.map((g, i) => {
      if (i !== groupIdx) return g;
      const newWords = [...g.words] as [string, string, string, string];
      newWords[wordIdx] = value.toUpperCase();
      return { ...g, words: newWords };
    }));
  };

  const validate = (): string | null => {
    for (let i = 0; i < 4; i++) {
      if (!groups[i].label.trim()) return `Group ${i + 1} needs a label`;
      for (let j = 0; j < 4; j++) {
        if (!groups[i].words[j].trim()) return `Group ${i + 1} word ${j + 1} is empty`;
      }
    }

    // Check for duplicate words
    const allWords = groups.flatMap(g => g.words.map(w => w.trim().toUpperCase()));
    const seen = new Set<string>();
    for (const w of allWords) {
      if (seen.has(w)) return `Duplicate word: "${w}"`;
      seen.add(w);
    }

    if (allWords.length !== 16) return 'Need exactly 16 words (4 groups of 4)';
    return null;
  };

  const handleSave = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setSaving(true);
    setMessage('');

    try {
      const connectionsData = {
        groups: groups.map((g, i) => ({
          label: g.label.trim(),
          words: g.words.map(w => w.trim().toUpperCase()),
          difficulty: g.difficulty,
          color: CONNECTION_COLORS[i],
        })),
      };

      await api.adminSetConnections(connectionsData);
      setMessage('Connections saved!');
    } catch (err: any) {
      setError(err.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // Build shuffled preview
  const previewWords = groups
    .flatMap(g => g.words.filter(w => w.trim()))
    .sort(() => Math.random() - 0.5);

  return (
    <div className="page" style={{ gap: '20px', paddingTop: '16px', maxWidth: '540px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
        <button
          onClick={() => navigate('/admin/ctgadmin2026/dashboard')}
          className="btn btn-outline"
          style={{ padding: '8px 14px', fontSize: '14px' }}
        >
          Back
        </button>
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--blue)' }}>
            Connections Builder
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--gray-400)' }}>Current Puzzle</p>
        </div>
        <button
          onClick={() => setGroups(SAMPLE_GROUPS.map(g => ({ ...g, words: [...g.words] as [string, string, string, string] })))}
          className="btn"
          style={{
            padding: '8px 14px', fontSize: '12px', fontWeight: 700,
            background: '#E6C200', color: 'var(--white)',
          }}
        >
          Load Sample
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {message && (
        <div style={{
          background: '#E8F5E9',
          color: '#2E7D32',
          padding: '12px 16px',
          borderRadius: 'var(--radius-sm)',
          fontSize: '14px',
          fontWeight: 500,
          width: '100%',
        }}>
          {message}
        </div>
      )}

      {/* Group editors */}
      {groups.map((group, gi) => (
        <div
          key={gi}
          className="card"
          style={{
            borderLeft: `4px solid ${CONNECTION_COLORS[gi]}`,
            padding: '16px 20px',
          }}
        >
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}>
            <span style={{
              fontSize: '11px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: 'var(--gray-400)',
            }}>
              Group {gi + 1} — {DIFFICULTY_LABELS[gi]}
            </span>
            <div style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              background: CONNECTION_COLORS[gi],
            }} />
          </div>

          <div className="input-group" style={{ marginBottom: '12px' }}>
            <label>Category Label</label>
            <input
              type="text"
              value={group.label}
              onChange={(e) => updateGroup(gi, 'label', e.target.value)}
              placeholder="e.g. Chicago Landmarks"
              maxLength={50}
            />
          </div>

          <label style={{
            display: 'block',
            fontSize: '13px',
            fontWeight: 600,
            color: 'var(--gray-500)',
            marginBottom: '6px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            4 Words
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {group.words.map((word, wi) => (
              <input
                key={wi}
                type="text"
                value={word}
                onChange={(e) => updateWord(gi, wi, e.target.value)}
                placeholder={`Word ${wi + 1}`}
                maxLength={30}
                style={{
                  padding: '10px 12px',
                  border: '2px solid var(--gray-200)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '14px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font)',
                }}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
        <button
          className="btn btn-outline"
          onClick={() => setShowPreview(!showPreview)}
          style={{ flex: 1 }}
        >
          {showPreview ? 'Hide Preview' : 'Preview'}
        </button>
        <button
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saving}
          style={{ flex: 2 }}
        >
          {saving ? 'Saving...' : 'Save Connections'}
        </button>
      </div>

      {/* Preview */}
      {showPreview && (
        <div className="card fade-in" style={{ padding: '20px' }}>
          <h3 style={{
            fontSize: '14px',
            fontWeight: 700,
            color: 'var(--gray-500)',
            marginBottom: '12px',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}>
            Player Preview (shuffled)
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '6px',
          }}>
            {previewWords.map((word, i) => (
              <div
                key={`${word}-${i}`}
                style={{
                  background: 'var(--white)',
                  border: '2px solid var(--gray-200)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '12px 6px',
                  textAlign: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.3px',
                  lineHeight: '1.2',
                  wordBreak: 'break-word',
                }}
              >
                {word || '—'}
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px' }}>
            <h3 style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--gray-500)',
              marginBottom: '8px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              Answer Key
            </h3>
            {groups.map((g, i) => (
              <div
                key={i}
                style={{
                  background: CONNECTION_COLORS[i],
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  marginBottom: '6px',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontWeight: 800, fontSize: '13px', textTransform: 'uppercase' }}>
                  {g.label || `Group ${i + 1}`}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 500, marginTop: '2px', textTransform: 'uppercase' }}>
                  {g.words.filter(w => w).join(', ') || '—'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
