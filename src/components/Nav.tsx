import { useEffect, useState } from 'react';
import { scrollState } from '../lib/scroll';
import { scrollToSection } from '../lib/useSmoothScroll';
import { useContent } from '../lib/contentStore';
import { ThemeToggle } from './ThemeToggle';
import { SideRail } from './SideRail';
import { MobileNav } from './MobileNav';

/**
 * Fixed chrome shared across breakpoints: wordmark (mobile), progress bar,
 * theme toggle, plus the desktop side rail and the mobile menu.
 *
 * The progress bar polls `scrollState` on rAF but only re-renders when the
 * quantised value actually changes.
 */
export function Nav() {
  const { profile } = useContent();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    let lastBucket = -1;

    const loop = () => {
      // Quantise the bar to 0.5% steps — visually identical, far cheaper.
      const bucket = Math.round(scrollState.progress * 200);
      if (bucket !== lastBucket) {
        lastBucket = bucket;
        setProgress(bucket / 2);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <>
      {/* Top progress hairline */}
      <div
        className="pointer-events-none fixed inset-x-0 top-0 z-50 h-px bg-ash-500/20"
        aria-hidden
      >
        <div
          className="h-full bg-gradient-to-r from-ds via-gis to-gfx transition-[width] duration-150 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Wordmark */}
      <a
        href="#hero"
        onClick={(e) => {
          e.preventDefault();
          scrollToSection('hero');
        }}
        // Hidden on desktop — the side rail carries the mark there.
        className="fixed left-5 top-5 z-50 font-display text-sm font-semibold tracking-tight text-ash-100 transition hover:text-ash-50 sm:left-8 sm:top-7 lg:hidden"
      >
        {profile.shortName}
        <span className="text-ds">.</span>
      </a>

      {/* Top-right controls — theme toggle on all sizes. */}
      <div className="fixed right-5 top-5 z-50 flex items-center gap-2 sm:right-8 sm:top-6">
        <ThemeToggle compact />
      </div>

      {/* Desktop: expanding icon rail. */}
      <SideRail />

      {/* Mobile: bottom pill that opens a full-screen menu. */}
      <MobileNav />
    </>
  );
}
