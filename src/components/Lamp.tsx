import { useContent } from '../lib/contentStore';

/**
 * The hanging lamp that lights the Career Paths section.
 *
 * Built in SVG/CSS by default — the cord, shade, bulb and glow are all
 * drawable, and a vector lamp stays sharp at any size and follows the theme.
 * If a lamp image is supplied it replaces the drawn shade and keeps the
 * coded cord and light cone, which are the parts that need to be
 * theme-aware and responsive.
 */
export function Lamp() {
  const { assets } = useContent();

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 flex flex-col items-center"
      aria-hidden
    >
      {/* Cord — a slight kink partway down so it reads as a hung object
          rather than a floating icon. */}
      <svg width="60" height="112" viewBox="0 0 60 112" className="overflow-visible">
        <path
          d="M30 0 L30 34 Q30 44 38 48 Q46 52 38 58 Q30 63 30 74 L30 96"
          fill="none"
          stroke="rgb(var(--ash-600))"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>

      {/* Shade */}
      {assets.lamp ? (
        <img
          src={assets.lamp}
          alt=""
          className="-mt-2 h-24 w-auto object-contain"
          loading="eager"
          decoding="async"
        />
      ) : (
        <svg
          width="150"
          height="78"
          viewBox="0 0 150 78"
          className="-mt-2 overflow-visible"
        >
          <defs>
            <linearGradient id="lampShade" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgb(var(--ash-700))" />
              <stop offset="70%" stopColor="rgb(var(--ash-850))" />
              <stop offset="100%" stopColor="rgb(var(--ash-900))" />
            </linearGradient>
            <radialGradient id="lampBulb">
              <stop offset="0%" stopColor="rgb(var(--ash-50))" />
              <stop offset="55%" stopColor="rgb(var(--accent-ds))" />
              <stop offset="100%" stopColor="rgb(var(--accent-ds) / 0)" />
            </radialGradient>
          </defs>

          {/* Dome */}
          <path d="M75 2 C 118 2, 148 44, 149 62 L1 62 C2 44, 32 2, 75 2 Z" fill="url(#lampShade)" />
          {/* Warm inner rim — the underside catching its own light */}
          <ellipse cx="75" cy="62" rx="74" ry="9" fill="rgb(var(--accent-ds) / 0.28)" />
          <ellipse cx="75" cy="62" rx="74" ry="9" fill="none" stroke="rgb(var(--ash-600))" strokeWidth="0.75" />
          {/* Bulb */}
          <circle cx="75" cy="62" r="13" fill="url(#lampBulb)" />
          <circle cx="75" cy="61" r="5.5" fill="rgb(var(--ash-50))" />
        </svg>
      )}

      {/* Light cone falling onto the cards below. */}
      <div className="light-cone -mt-4 h-[460px] w-[min(92vw,760px)]" />
    </div>
  );
}
