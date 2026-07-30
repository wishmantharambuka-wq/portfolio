import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useContent } from '../lib/contentStore';
import { useFocusRef } from '../lib/useFocusBlur';
import { useTilt } from '../lib/useTilt';
import { scrollToSection } from '../lib/useSmoothScroll';
import { Lamp } from './Lamp';
import { DUR, EASE, STAGGER, LIFT, TRIGGER_START, prefersReducedMotion } from '../lib/motion';
import type { CareerPath } from '../data/content';

gsap.registerPlugin(ScrollTrigger);

const accentText = { ds: 'text-ds', gis: 'text-gis', gfx: 'text-gfx' } as const;
const accentBar = { ds: 'bg-ds', gis: 'bg-gis', gfx: 'bg-gfx' } as const;

/**
 * Career Paths — the second screen.
 *
 * A single lamp hangs over three numbered columns, the ZAYTA structure. The
 * three paths are the portfolio's argument in one view: where I'm going,
 * what I trained in, and what makes both legible. Each column is a shortcut
 * into its section.
 */
export function CareerPaths() {
  const { careerPaths, profile } = useContent();
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: { trigger: el, start: TRIGGER_START, toggleActions: 'play none none none' },
      });

      // The lamp arrives first and the light "switches on" — the columns are
      // then revealed *by* the light rather than animating independently.
      tl.fromTo(
        '[data-paths="lamp"]',
        { yPercent: -22, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: DUR.heavy, ease: EASE.enterSoft },
      )
        .fromTo(
          '[data-paths="cone"]',
          { opacity: 0, scaleY: 0.75 },
          { opacity: 1, scaleY: 1, duration: DUR.heavy, ease: EASE.enter, transformOrigin: 'top center' },
          '-=0.7',
        )
        .fromTo(
          '[data-paths="col"]',
          { opacity: 0, y: LIFT.card, filter: 'blur(8px)' },
          {
            opacity: 1,
            y: 0,
            filter: 'blur(0px)',
            duration: DUR.base,
            ease: EASE.enter,
            stagger: STAGGER.loose,
          },
          '-=0.75',
        )
        // The big numerals count up into place last, slightly overshooting.
        .fromTo(
          '[data-paths="no"]',
          { opacity: 0, scale: 0.82 },
          { opacity: 1, scale: 1, duration: DUR.quick, ease: EASE.overshoot, stagger: STAGGER.loose },
          '-=0.85',
        );
    }, el);

    return () => ctx.revert();
  }, [careerPaths]);

  return (
    <section
      id="paths"
      ref={root}
      className="relative flex min-h-screen w-full items-center overflow-hidden px-5 py-24 sm:px-8 lg:px-16"
      aria-labelledby="paths-title"
    >
      {/* Lamp + cone, absolutely placed so the columns sit in its pool. */}
      <div data-paths="lamp" className="absolute inset-x-0 top-0 opacity-0">
        <div data-paths="cone">
          <Lamp />
        </div>
      </div>

      <div className="relative mx-auto w-full max-w-6xl">
        <div className="mb-16 text-center">
          <p className="eyebrow mb-4">01 — Career paths</p>
          <h2
            id="paths-title"
            className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tightest text-ash-50 sm:text-4xl lg:text-5xl"
          >
            Three disciplines, one direction.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-ash-300 sm:text-base">
            {profile.tagline}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3 sm:gap-5">
          {careerPaths.map((path) => (
            <PathColumn key={path.id} path={path} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PathColumn({ path }: { path: CareerPath }) {
  const focusRef = useFocusRef<HTMLButtonElement>();
  // Tilt lives on a wrapper so it never fights the button's reveal (GSAP `y`)
  // or its focus-glass scale — those animate the button; this rotates the box.
  const tiltRef = useTilt<HTMLDivElement>({ max: 8, scale: 1.03, lift: 8 });

  return (
    <div ref={tiltRef} className="tilt-card relative h-full rounded-2xl">
      <button
        ref={focusRef}
        data-paths="col"
        type="button"
        onClick={() => scrollToSection(path.target)}
        className="lit-surface group focus-glass relative flex h-full flex-col rounded-2xl p-6 text-left opacity-0 transition-colors duration-500 sm:p-7"
      >
        <span className={`absolute inset-x-0 top-0 h-px ${accentBar[path.accent]} opacity-40`} aria-hidden />

        <span
          data-paths="no"
          className="font-display text-4xl font-bold leading-none tracking-tightest text-ash-700 sm:text-5xl"
        >
          {path.no}
          <span className={accentText[path.accent]}>.</span>
        </span>

        <span className="mt-5 font-mono text-[10px] uppercase tracking-[0.25em] text-ash-400">
          {path.subtitle}
        </span>

        <h3 className={`mt-2 font-display text-xl font-semibold ${accentText[path.accent]}`}>
          {path.title}
        </h3>

        <p className="mt-3 flex-1 text-sm leading-relaxed text-ash-300">{path.body}</p>

        <span className="mt-6 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-ash-400 transition-colors group-hover:text-ash-100">
          See the work
          <span className="transition-transform duration-300 group-hover:translate-x-1" aria-hidden>
            →
          </span>
        </span>
      </button>
    </div>
  );
}
