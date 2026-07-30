import { useTheme } from '../lib/theme';

/**
 * Light/dark switch. Rendered as a two-state track rather than a single
 * icon button so the available choice is visible rather than guessed at.
 */
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, toggle } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      className={`tap glass group relative flex items-center rounded-full transition ${
        compact ? 'h-8 w-[3.25rem] px-1' : 'h-9 w-[3.75rem] px-1'
      }`}
    >
      {/* Sliding knob */}
      <span
        className={`absolute flex items-center justify-center rounded-full bg-ash-100 transition-transform duration-300 ease-out ${
          compact ? 'h-6 w-6' : 'h-7 w-7'
        } ${isDark ? 'translate-x-0' : compact ? 'translate-x-[1.25rem]' : 'translate-x-[1.5rem]'}`}
      >
        {isDark ? <MoonIcon /> : <SunIcon />}
      </span>

      {/* Static track icons, dimmed under the knob */}
      <span className="pointer-events-none flex w-full items-center justify-between px-[0.35rem] text-ash-500">
        <span className={isDark ? 'opacity-0' : 'opacity-60'}>
          <MoonIcon />
        </span>
        <span className={isDark ? 'opacity-60' : 'opacity-0'}>
          <SunIcon />
        </span>
      </span>
    </button>
  );
}

function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2.2M12 19.8V22M22 12h-2.2M4.2 12H2m15.1-7.1-1.6 1.6M8.5 15.5l-1.6 1.6m10.2 0-1.6-1.6M8.5 8.5 6.9 6.9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
