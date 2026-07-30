import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type Theme = 'dark' | 'light';

const KEY = 'portfolio:theme';

/**
 * Palette handed to the 3D scene. Kept as a plain module export (not just
 * context) because `useFrame` callbacks read it every frame and must not
 * depend on a React render to see the current value.
 */
export const scenePalette: Record<Theme, {
  fog: string;
  star: string;
  orbCore: string;
  orbEdge: string;
  terrainLow: string;
  terrainHigh: string;
  terrainLine: string;
  lattice: string;
  latticeLink: string;
  halo: string;
  keyLight: string;
}> = {
  // Green ramp: #1FA37C → #0C6B52 → #064435 → #02100C
  light: {
    // The default. Ink-on-paper: the scene has to sit *under* dark text on a
    // near-white ground, so everything deepens rather than glows.
    fog: '#f4f9f6',
    star: '#8fb3a5',
    orbCore: '#0a6b51',
    orbEdge: '#8fb3a5',
    terrainLow: '#d6e8e0',
    terrainHigh: '#0a6b51',
    terrainLine: '#365247',
    lattice: '#365247',
    latticeLink: '#a8c4b8',
    halo: '#547267',
    keyLight: '#ffffff',
  },
  dark: {
    fog: '#02100c',
    star: '#3c7a65',
    orbCore: '#2ec898',
    orbEdge: '#103c2f',
    terrainLow: '#071f18',
    terrainHigh: '#2ec898',
    terrainLine: '#a2c8ba',
    lattice: '#a2c8ba',
    latticeLink: '#1a5442',
    halo: '#76a694',
    keyLight: '#e0f0e9',
  },
};

/** Live value for the render loop. */
export let currentTheme: Theme = 'light';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function initialTheme(): Theme {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    /* private browsing */
  }
  // Light is the designed default — the whole palette and the 3D scene are
  // composed for it. We deliberately do NOT follow prefers-color-scheme here:
  // a visitor whose OS is in dark mode would otherwise never see the site as
  // designed. Dark remains available from the toggle and is then remembered.
  return 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(initialTheme);

  useEffect(() => {
    currentTheme = theme;
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);
    root.style.colorScheme = theme;
    document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#02100c' : '#f4f9f6');
    try {
      localStorage.setItem(KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setTheme = useCallback((t: Theme) => setThemeState(t), []);
  const toggle = useCallback(() => setThemeState((t) => (t === 'dark' ? 'light' : 'dark')), []);

  const value = useMemo(() => ({ theme, setTheme, toggle }), [theme, setTheme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside <ThemeProvider>');
  return ctx;
}
