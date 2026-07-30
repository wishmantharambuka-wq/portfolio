import { useEffect, useState } from 'react';
import { useContent } from '../lib/contentStore';

/**
 * Entry curtain. Three.js compiles shaders and builds geometry on first
 * frame; without a curtain the user sees an empty rectangle and assumes the
 * page is broken. It holds for a moment after completing, because a loader
 * that vanishes instantly reads as a flicker.
 */
export function Loader({ onDone }: { onDone: () => void }) {
  const { profile } = useContent();
  const [pct, setPct] = useState(0);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    let raf = 0;
    let done = false;
    const start = performance.now();

    const tick = () => {
      const elapsed = performance.now() - start;
      // Perceived-progress curve — the assets here are procedural and build
      // in milliseconds, so this paces the reveal rather than tracking bytes.
      const p = Math.min(100, (1 - Math.exp(-elapsed / 520)) * 104);
      setPct(p);
      if (p < 99.5) {
        raf = requestAnimationFrame(tick);
      } else if (!done) {
        done = true;
        setPct(100);
        setLeaving(true);
        window.setTimeout(onDone, 700);
      }
    };
    raf = requestAnimationFrame(tick);

    // Safety net: if rAF is throttled (background tab), never trap the user
    // behind the curtain.
    const failsafe = window.setTimeout(() => {
      if (!done) {
        done = true;
        setPct(100);
        setLeaving(true);
        window.setTimeout(onDone, 300);
      }
    }, 4000);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(failsafe);
    };
  }, [onDone]);

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-ash-950 transition-all duration-700 ${
        leaving ? 'pointer-events-none opacity-0' : 'opacity-100'
      }`}
      role="status"
      aria-live="polite"
      aria-label="Loading portfolio"
    >
      <div className="w-[min(78vw,26rem)] px-6">
        <div className="mb-6 flex items-baseline justify-between">
          <span className="font-display text-lg font-semibold tracking-tight text-ash-100">
            {profile.name}
          </span>
          <span className="font-mono text-xs text-ash-500">{Math.round(pct)}%</span>
        </div>

        <div className="h-px w-full overflow-hidden bg-ash-500/20">
          <div
            className="h-full bg-gradient-to-r from-ds via-gis to-gfx"
            style={{ width: `${pct}%` }}
          />
        </div>

        <p className="mt-6 font-mono text-[10px] uppercase tracking-[0.25em] text-ash-500">
          {profile.roles.join(' · ')}
        </p>
      </div>
    </div>
  );
}
