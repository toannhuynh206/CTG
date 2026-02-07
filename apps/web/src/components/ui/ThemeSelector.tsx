import { useThemeStore, CTA_LINES } from '../../stores/themeStore';

export default function ThemeSelector() {
  const { selectedLine, setLine } = useThemeStore();

  return (
    <div className="theme-selector">
      {CTA_LINES.map((line) => (
        <button
          key={line.id}
          className={`theme-option ${selectedLine === line.id ? 'selected' : ''}`}
          onClick={() => setLine(line.id)}
          title={`${line.name} - ${line.destination}`}
        >
          <div
            className="color-dot"
            style={{ background: line.color }}
          />
          <span className="line-name">{line.destination}</span>
        </button>
      ))}
    </div>
  );
}
