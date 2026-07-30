import type { ReactNode } from 'react';
import { Reveal } from './Reveal';
import { SplitWords } from './SplitWords';
import type { SectionId } from '../data/sections';

const accentText = {
  ds: 'text-ds',
  gis: 'text-gis',
  gfx: 'text-gfx',
  none: 'text-ash-300',
} as const;

const accentGlow = {
  ds: 'shadow-[0_0_24px_-6px_rgba(94,234,212,0.55)]',
  gis: 'shadow-[0_0_24px_-6px_rgba(163,230,53,0.55)]',
  gfx: 'shadow-[0_0_24px_-6px_rgba(196,181,253,0.55)]',
  none: '',
} as const;

const accentDot = {
  ds: 'bg-ds',
  gis: 'bg-gis',
  gfx: 'bg-gfx',
  none: 'bg-ash-400',
} as const;

export type Accent = keyof typeof accentText;

/**
 * The shell every content section shares: full-viewport-height stage, a
 * numbered eyebrow, a display heading, and a slot. Keeping the chrome here
 * means the section components below contain only their actual content.
 */
export function Section({
  id,
  index,
  eyebrow,
  title,
  lede,
  accent = 'none',
  children,
  wide = false,
  ghost,
}: {
  id: SectionId;
  index: number;
  eyebrow: string;
  title: string;
  lede?: string;
  accent?: Accent;
  children: ReactNode;
  wide?: boolean;
  /** Oversized outlined word behind the heading. Keep it to one short word. */
  ghost?: string;
}) {
  return (
    <section
      id={id}
      className="relative flex min-h-screen w-full items-center px-5 py-24 sm:px-8 lg:px-16"
      aria-labelledby={`${id}-title`}
    >
      <div className={`mx-auto w-full ${wide ? 'max-w-7xl' : 'max-w-5xl'}`}>
        <Reveal weight="chip">
          <div className="mb-3 flex items-center gap-3">
            <span
              className={`h-1.5 w-1.5 rounded-full ${accentDot[accent]} ${accentGlow[accent]}`}
              aria-hidden
            />
            <span className="eyebrow">
              {String(index).padStart(2, '0')} — {eyebrow}
            </span>
          </div>
        </Reveal>

        {/* `isolate` gives the ghost word its own stacking context so its
            negative z-index sits behind the heading but still above the
            page background — without it the word disappears entirely.
            The heading animates itself word-by-word, so no Reveal wrapper. */}
        <div className="relative isolate">
          {ghost && (
            <span className="ghost-word font-display" aria-hidden>
              {ghost}
            </span>
          )}
          <SplitWords
            id={`${id}-title`}
            text={title}
            className="relative font-display text-4xl font-semibold tracking-tightest text-ash-50 sm:text-5xl lg:text-6xl"
          />
        </div>

        {lede && (
          <Reveal weight="card" delay={0.14}>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-ash-300 sm:text-lg">
              {lede}
            </p>
          </Reveal>
        )}

        <Reveal weight="chip" delay={0.22}>
          <div className="hairline my-10" />
        </Reveal>

        {children}
      </div>
    </section>
  );
}

export { accentText, accentDot, accentGlow };
