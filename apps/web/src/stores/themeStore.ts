import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CTALine =
  | 'blue'
  | 'red'
  | 'green'
  | 'brown'
  | 'purple'
  | 'orange'
  | 'yellow'
  | 'pink';

export type ColorMode = 'light' | 'dark';

export interface LineInfo {
  id: CTALine;
  name: string;
  destination: string;
  color: string;
  colorLight: string;
  colorDark: string;
  textOnColor: string;
}

export const CTA_LINES: LineInfo[] = [
  { id: 'blue', name: 'Blue Line', destination: "O'Hare", color: '#00A1DE', colorLight: '#33B4E5', colorDark: '#0081B2', textOnColor: '#FFFFFF' },
  { id: 'red', name: 'Red Line', destination: 'Howard', color: '#C60C30', colorLight: '#D63D59', colorDark: '#9E0926', textOnColor: '#FFFFFF' },
  { id: 'green', name: 'Green Line', destination: 'Ashland', color: '#009B3A', colorLight: '#00B844', colorDark: '#007A2E', textOnColor: '#FFFFFF' },
  { id: 'brown', name: 'Brown Line', destination: 'Kimball', color: '#62361B', colorLight: '#7D4623', colorDark: '#4A2814', textOnColor: '#FFFFFF' },
  { id: 'purple', name: 'Purple Line', destination: 'Linden', color: '#522398', colorLight: '#6B35B0', colorDark: '#3E1A73', textOnColor: '#FFFFFF' },
  { id: 'orange', name: 'Orange Line', destination: 'Midway', color: '#F9461C', colorLight: '#FA6A47', colorDark: '#D63B16', textOnColor: '#FFFFFF' },
  { id: 'yellow', name: 'Yellow Line', destination: 'Skokie', color: '#F9E300', colorLight: '#FAEB4D', colorDark: '#D4C200', textOnColor: '#1B1D23' },
  { id: 'pink', name: 'Pink Line', destination: '54th/Cermak', color: '#E27EA6', colorLight: '#E99ABB', colorDark: '#C9608C', textOnColor: '#1B1D23' },
];

interface ThemeState {
  selectedLine: CTALine;
  colorMode: ColorMode;
  setLine: (line: CTALine) => void;
  setColorMode: (mode: ColorMode) => void;
  toggleColorMode: () => void;
  getLineInfo: () => LineInfo;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      selectedLine: 'blue',
      colorMode: 'light',

      setLine: (line) => {
        set({ selectedLine: line });
        applyTheme(line, get().colorMode);
      },

      setColorMode: (mode) => {
        set({ colorMode: mode });
        applyTheme(get().selectedLine, mode);
      },

      toggleColorMode: () => {
        const newMode = get().colorMode === 'dark' ? 'light' : 'dark';
        set({ colorMode: newMode });
        applyTheme(get().selectedLine, newMode);
      },

      getLineInfo: () => {
        return CTA_LINES.find(l => l.id === get().selectedLine) || CTA_LINES[0];
      },
    }),
    {
      name: 'ctg-theme',
      onRehydrateStorage: () => (state) => {
        if (state) {
          applyTheme(state.selectedLine, state.colorMode);
        }
      },
    }
  )
);

function applyTheme(line: CTALine, mode: ColorMode) {
  const lineInfo = CTA_LINES.find(l => l.id === line) || CTA_LINES[0];
  const root = document.documentElement;

  // Accent colors (same for both modes)
  root.style.setProperty('--accent', lineInfo.color);
  root.style.setProperty('--accent-light', lineInfo.colorLight);
  root.style.setProperty('--accent-dark', lineInfo.colorDark);
  root.style.setProperty('--accent-text', lineInfo.textOnColor);
  root.style.setProperty('--accent-glow', `${lineInfo.color}40`);

  // Mode-specific colors
  if (mode === 'dark') {
    root.style.setProperty('--bg-base', '#1B1D23');
    root.style.setProperty('--bg-card', '#23262E');
    root.style.setProperty('--bg-elevated', '#2C3039');
    root.style.setProperty('--text-primary', '#F0F1F3');
    root.style.setProperty('--text-muted', '#8B919C');
    root.style.setProperty('--border-subtle', 'rgba(255, 255, 255, 0.06)');
    root.style.setProperty('--border-muted', '#363A44');
    root.style.setProperty('--bg-tint', `${lineInfo.color}15`);
    root.style.setProperty('--bg-tint-strong', `${lineInfo.color}25`);
  } else {
    root.style.setProperty('--bg-base', '#F5F6F8');
    root.style.setProperty('--bg-card', '#FFFFFF');
    root.style.setProperty('--bg-elevated', '#F0F1F3');
    root.style.setProperty('--text-primary', '#1B1D23');
    root.style.setProperty('--text-muted', '#6B7280');
    root.style.setProperty('--border-subtle', 'rgba(0, 0, 0, 0.06)');
    root.style.setProperty('--border-muted', '#E0E2E6');
    root.style.setProperty('--bg-tint', `${lineInfo.color}12`);
    root.style.setProperty('--bg-tint-strong', `${lineInfo.color}20`);
  }

  root.setAttribute('data-theme', line);
  root.setAttribute('data-mode', mode);
}

// Initialize theme on load
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('ctg-theme');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      applyTheme(parsed.state?.selectedLine || 'blue', parsed.state?.colorMode || 'light');
    } catch {
      applyTheme('blue', 'light');
    }
  } else {
    applyTheme('blue', 'light');
  }
}
