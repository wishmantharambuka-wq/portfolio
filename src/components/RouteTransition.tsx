import { useEffect, useRef, useState, type ReactNode } from 'react';

/* --------------------------------------------------------------------------
 *  ROUTE TRANSITION
 *
 *  A brand-green curtain that fades in over the outgoing route, swaps the
 *  content underneath while it's covered, then fades away to reveal the new
 *  one. Without it, home ↔ CV ↔ admin hard-cut — and the cut is ugly on the
 *  home route in particular, which flashes a mounting WebGL canvas. The
 *  curtain hides that swap entirely.
 *
 *  It intentionally does NOT keep both routes mounted (the home route owns a
 *  WebGL context and Lenis; running two at once is wasteful and buggy). It
 *  swaps a single `displayed` route at the moment the curtain is fully down.
 * ------------------------------------------------------------------------ */

const COVER_MS = 320; // curtain fade-in / fade-out duration (matches the CSS)

export function RouteTransition({
  routeKey,
  render,
}: {
  /** A string that changes whenever the destination changes (route + params). */
  routeKey: string;
  render: (key: string) => ReactNode;
}) {
  const route = routeKey;
  const [displayed, setDisplayed] = useState<string>(route);
  const [covering, setCovering] = useState(false);

  // Latest `displayed` without making it an effect dependency — otherwise the
  // swap below (which sets `displayed`) would re-run the effect and its
  // cleanup would cancel the still-pending "lift" timer, freezing the curtain
  // down. The effect must react to `route` ONLY.
  const displayedRef = useRef(displayed);
  useEffect(() => {
    displayedRef.current = displayed;
  }, [displayed]);

  useEffect(() => {
    if (route === displayedRef.current) return; // no-op on first mount

    // Respect reduced-motion: swap instantly, no curtain.
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplayed(route);
      return;
    }

    setCovering(true); // curtain fades down
    const swap = window.setTimeout(() => setDisplayed(route), COVER_MS);
    const lift = window.setTimeout(() => setCovering(false), COVER_MS + 40);

    return () => {
      clearTimeout(swap);
      clearTimeout(lift);
    };
  }, [route]);

  return (
    <>
      {render(displayed)}

      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[80] flex items-center justify-center transition-opacity duration-300 ease-out"
        style={{
          opacity: covering ? 1 : 0,
          background:
            'linear-gradient(160deg, rgb(31 163 124) 0%, rgb(12 107 82) 42%, rgb(6 52 41) 82%, rgb(2 22 17) 100%)',
        }}
      >
        {/* Brand mark, quietly present while the curtain is down. */}
        <span
          className="transition-transform duration-500 ease-out"
          style={{ transform: covering ? 'scale(1)' : 'scale(0.85)' }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M20 4C10 4 4 9 4 15a5 5 0 0 0 5 5c6 0 11-6 11-16Z"
              stroke="white"
              strokeOpacity="0.85"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
            <path d="M16 8 7 17" stroke="white" strokeOpacity="0.85" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
        </span>
      </div>
    </>
  );
}
