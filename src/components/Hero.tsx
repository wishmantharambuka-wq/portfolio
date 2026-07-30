import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useContent } from '../lib/contentStore';
import { scrollToSection } from '../lib/useSmoothScroll';
import { useFitText } from '../lib/useFitText';
import { SocialButtons } from './SocialButtons';
import { DUR, EASE, STAGGER, prefersReducedMotion } from '../lib/motion';

/**
 * The cover.
 *
 * Structured as an inset panel with a lit rim, the way a portfolio cover is
 * a page rather than a full-bleed screen: mark and search top, a dated badge,
 * the display word stacked in two lines — solid over outline — with a subject
 * threaded *between* the two lines, then role text on a rule, a scroll cue,
 * and socials. The name sits outside the panel entirely, like a caption.
 *
 * The interleave is the move worth protecting: the subject sits above the top
 * word and below the bottom word in z-order, so the type appears to pass
 * through it. Flatten those layers and the whole composition dies.
 */
export function Hero({ ready }: { ready: boolean }) {
  const { hero, profile, assets } = useContent();
  const root = useRef<HTMLDivElement>(null);

  const top = useFitText<HTMLSpanElement>({ min: 36, max: 260 });
  const bottom = useFitText<HTMLSpanElement>({ min: 36, max: 260 });

  useEffect(() => {
    top.refit();
    bottom.refit();
  }, [hero.wordTop, hero.wordBottom, top, bottom]);

  useEffect(() => {
    if (!ready || !root.current) return;

    if (prefersReducedMotion()) {
      gsap.set(root.current.querySelectorAll('[data-cover]'), {
        opacity: 1,
        y: 0,
        yPercent: 0,
        scale: 1,
        clipPath: 'inset(0% 0% 0% 0%)',
      });
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();

      // 1. The panel itself settles in first — everything else is content
      //    *on* it, so it has to exist before they arrive.
      tl.fromTo(
        '[data-cover="panel"]',
        { opacity: 0, scale: 0.985, y: 18 },
        { opacity: 1, scale: 1, y: 0, duration: DUR.heavy, ease: EASE.enterSoft },
      );

      // 2. Light travels around the rim once, then settles.
      tl.fromTo(
        '[data-cover="panel"]',
        { '--rim-angle': '0deg' },
        { '--rim-angle': '360deg', duration: 2.4, ease: 'power2.inOut' },
        0.1,
      );

      // 3. Chrome fades in around the edges.
      tl.fromTo(
        '[data-cover="chrome"]',
        { opacity: 0, y: -8 },
        { opacity: 1, y: 0, duration: DUR.quick, ease: EASE.enter, stagger: STAGGER.tight },
        '-=1.9',
      );

      // 4. The two display lines wipe up from behind their own masks,
      //    offset so they read as two beats rather than one block.
      tl.fromTo(
        '[data-cover="line"]',
        { yPercent: 112 },
        { yPercent: 0, duration: DUR.cinematic, ease: EASE.reveal, stagger: 0.13 },
        '-=1.75',
      );

      // 5. The subject rises into the gap between them.
      tl.fromTo(
        '[data-cover="subject"]',
        { opacity: 0, scale: 0.9, y: 40 },
        { opacity: 1, scale: 1, y: 0, duration: DUR.cinematic, ease: EASE.enter },
        '-=1.5',
      );

      // 6. Everything incidental last.
      tl.fromTo(
        '[data-cover="fade"]',
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: DUR.quick, ease: EASE.enter, stagger: STAGGER.base },
        '-=1.1',
      );

      // 7. Social buttons pop in last, each with a tiny overshoot so they
      //    read as physical objects arriving rather than fading up.
      tl.fromTo(
        '[data-cover="social"]',
        { opacity: 0, y: 16, scale: 0.7 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: DUR.base,
          ease: EASE.overshoot,
          stagger: STAGGER.base,
        },
        '-=0.7',
      );
    }, root);

    return () => ctx.revert();
  }, [ready]);

  const textureStyle = assets.heroTexture
    ? ({ '--type-texture': `url("${assets.heroTexture}")` } as React.CSSProperties)
    : undefined;

  return (
    <section
      id="hero"
      ref={root}
      className="relative flex min-h-[100svh] w-full flex-col items-center justify-center px-3 py-10 sm:px-6 sm:py-14"
    >
      <div
        data-cover="panel"
        className="cover-frame relative w-full max-w-6xl px-5 py-8 opacity-0 sm:px-10 sm:py-12"
      >
        {/* ---------- Top chrome ---------- */}
        <div className="flex items-start justify-between">
          <span
            data-cover="chrome"
            className="border border-ash-50/25 px-2.5 py-1 font-display text-[11px] font-bold uppercase tracking-[0.3em] text-ash-50 opacity-0"
          >
            {initials(profile.name)}
          </span>

          <button
            data-cover="chrome"
            type="button"
            onClick={() => scrollToSection('paths')}
            aria-label="Jump to sections"
            className="text-ash-100 opacity-0 transition hover:text-ash-50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* ---------- Badge ---------- */}
        <div data-cover="chrome" className="mt-6 flex justify-end opacity-0 sm:mt-2">
          <span className="flex items-stretch border border-ash-50/25">
            <span className="flex flex-col justify-center bg-ds px-2 py-1 font-display text-[10px] font-bold leading-[1.05] text-white">
              <span>{hero.yearRange.slice(0, 2)}</span>
              <span>{hero.yearRange.slice(2, 4)}</span>
            </span>
            <span className="flex items-center px-3 py-1 font-mono text-[9px] uppercase leading-tight tracking-[0.22em] text-ash-100">
              {hero.badge}
            </span>
          </span>
        </div>

        {/* ---------- Display type + subject ---------- */}
        <div className="relative mt-4 sm:mt-2">
          {/* Top line — solid, sits BEHIND the subject. */}
          <div className="relative z-0 overflow-hidden">
            <span
              data-cover="line"
              className="display-shadow block font-display font-bold uppercase leading-[0.82] tracking-tightest"
            >
              <span
                ref={top.ref}
                className="textured-type block whitespace-nowrap"
                style={textureStyle}
              >
                {hero.wordTop}
              </span>
            </span>
          </div>

          {/* The subject, threaded between the two lines. */}
          <div
            data-cover="subject"
            className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 justify-center opacity-0"
            aria-hidden
          >
            {assets.heroSubject ? (
              <img
                src={assets.heroSubject}
                alt=""
                className="h-[46vw] max-h-[420px] w-auto object-contain sm:h-[30vw]"
              />
            ) : (
              <CodedSubject />
            )}
          </div>

          {/* Bottom line — outlined, sits IN FRONT of the subject. */}
          <div className="relative z-20 overflow-hidden">
            <span
              data-cover="line"
              className="block font-display font-bold uppercase leading-[0.82] tracking-tightest"
            >
              <span ref={bottom.ref} className="type-outline block whitespace-nowrap">
                {hero.wordBottom}
              </span>
            </span>
          </div>
        </div>

        {/* ---------- Role text on a rule ---------- */}
        <div data-cover="fade" className="mt-10 flex items-start gap-5 opacity-0">
          <span className="mt-2 hidden h-px w-24 bg-ash-500/50 sm:block lg:w-40" aria-hidden />
          <div className="flex flex-col gap-1 text-left sm:text-right">
            {hero.roleLines.map((line) => (
              <span
                key={line}
                className="font-mono text-[9px] uppercase tracking-[0.42em] text-ash-300 sm:text-[10px]"
              >
                {line}
              </span>
            ))}
          </div>
          <span className="mt-2 hidden h-px flex-1 bg-ash-500/25 sm:block" aria-hidden />
        </div>

        {/* ---------- Scroll cue ---------- */}
        <button
          data-cover="fade"
          type="button"
          onClick={() => scrollToSection('paths')}
          className="mx-auto mt-10 flex flex-col items-center gap-2 opacity-0"
          aria-label="Scroll to career paths"
        >
          <span className="flex h-7 w-[18px] items-start justify-center rounded-full border border-ash-400/60 p-1">
            <span className="block h-1.5 w-[3px] animate-[floaty_2s_ease-in-out_infinite] rounded-full bg-ds" />
          </span>
          <span className="font-mono text-[8px] uppercase tracking-[0.3em] text-ash-400">
            Scroll
          </span>
        </button>

        {/* ---------- Socials ---------- */}
        <div className="mt-8 flex flex-wrap items-center justify-end gap-x-4 gap-y-3">
          <span
            data-cover="fade"
            className="font-mono text-[10px] tracking-[0.2em] text-ash-400 opacity-0"
          >
            {profile.location}
          </span>
          <span
            data-cover="fade"
            className="hidden h-px w-10 bg-ash-500/40 opacity-0 sm:block sm:w-16"
            aria-hidden
          />
          <SocialButtons />
        </div>
      </div>

      {/* ---------- Name, outside the panel ---------- */}
      <div data-cover="fade" className="mt-8 flex items-center gap-4 opacity-0">
        <span className="h-1 w-1 rounded-full bg-ds" aria-hidden />
        <span className="text-center font-display text-[10px] font-semibold uppercase tracking-[0.42em] text-ash-300 sm:text-xs">
          {hero.plateName}
        </span>
        <span className="h-1 w-1 rounded-full bg-ds" aria-hidden />
      </div>
    </section>
  );
}

/**
 * Fallback cover subject: concentric rings around a soft green core, echoing
 * the glowing ring on the reference. Coded rather than photographic so the
 * cover is complete with no assets, and so it follows the theme.
 */
function CodedSubject() {
  return (
    <div className="relative flex h-[42vw] max-h-[380px] w-[42vw] max-w-[380px] items-center justify-center sm:h-[26vw] sm:w-[26vw]">
      <span
        className="absolute inset-[18%] rounded-full blur-2xl"
        style={{ background: 'rgb(var(--accent-ds) / 0.5)' }}
      />
      <span
        className="absolute inset-[26%] rounded-full blur-md"
        style={{ background: 'rgb(var(--accent-ds) / 0.35)' }}
      />
      <span
        className="absolute inset-[30%] rounded-full border-[6px]"
        style={{ borderColor: 'rgb(var(--accent-ds) / 0.9)' }}
      />
      <span
        className="absolute inset-[8%] rounded-full border"
        style={{ borderColor: 'rgb(var(--accent-ds) / 0.28)' }}
      />
      <span
        className="absolute inset-0 rounded-full border"
        style={{ borderColor: 'rgb(var(--accent-ds) / 0.14)' }}
      />
    </div>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}
