import { useRef, useState } from 'react';
import type { Project } from '../data/content';
import type { Accent } from './Section';
import { useFocusRef } from '../lib/useFocusBlur';
import { CountUp } from './CountUp';

/* --------------------------------------------------------------------------
 *  A project as a listing row.
 *
 *  Two things this has to do that the earlier version didn't:
 *
 *  1. Stay READABLE off-centre. The depth effect is a cue, not a filter —
 *     an unfocused row is still fully legible.
 *  2. INVITE a click. A card that looks identical whether or not it leads
 *     somewhere gives no reason to explore. Hovering lifts the card, tints
 *     its rim with the section accent and slides up an "Open live site" bar.
 *
 *  The whole card is clickable via a stretched link — an absolutely
 *  positioned anchor covering the card, sitting *below* the explicit
 *  buttons in z-order so those still work. That avoids nesting interactive
 *  elements inside an anchor, which is invalid HTML and breaks keyboard nav.
 * ------------------------------------------------------------------------ */

const accentVar = {
  ds: 'var(--accent-ds)',
  gis: 'var(--accent-gis)',
  gfx: 'var(--accent-gfx)',
  none: 'var(--ash-400)',
} as const;

const accentDot = {
  ds: 'bg-ds',
  gis: 'bg-gis',
  gfx: 'bg-gfx',
  none: 'bg-ash-400',
} as const;

const accentText = {
  ds: 'text-ds',
  gis: 'text-gis',
  gfx: 'text-gfx',
  none: 'text-ash-300',
} as const;

const statusLabel: Record<Project['status'], string> = {
  live: 'Live',
  wip: 'In progress',
  draft: 'Planned',
};

export function ProjectRow({
  project,
  accent = 'none',
  index,
}: {
  project: Project;
  accent?: Accent;
  index: number;
}) {
  const [open, setOpen] = useState(false);
  const focusRef = useFocusRef<HTMLDivElement>();
  const inner = useRef<HTMLDivElement>(null);

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = inner.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
    el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
  };

  const hasDetail = project.problem || project.approach || project.outcome;
  const target = project.live || project.repo;
  const targetLabel = project.live ? 'Open live site' : project.repo ? 'View the code' : '';

  return (
    <div ref={focusRef} className="listing-row group/card relative pl-8 sm:pl-14">
      {/* Node on the rail */}
      <span
        className="absolute left-0 top-9 flex h-3 w-3 items-center justify-center sm:left-[1.15rem]"
        aria-hidden
      >
        <span
          className={`block h-1.5 w-1.5 rounded-full transition-transform duration-300 group-hover/card:scale-150 ${accentDot[accent]}`}
        />
      </span>
      <span
        className="absolute left-[0.35rem] top-[2.65rem] h-px w-4 bg-ash-600/50 sm:left-[1.5rem] sm:w-7"
        aria-hidden
      />

      <div
        ref={inner}
        onPointerMove={onPointerMove}
        className="project-card focus-glass overflow-hidden rounded-2xl p-5 sm:p-7"
        style={{ '--accent': accentVar[accent] } as React.CSSProperties}
      >
        {/* Stretched link — covers the card, sits under the real controls. */}
        {target && (
          <a
            href={target}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={`${targetLabel}: ${project.title}`}
            className="absolute inset-0 z-0"
          />
        )}

        <div className="pointer-events-none relative z-10 flex flex-col gap-5 sm:flex-row sm:gap-7">
          <ProjectThumb project={project} accent={accent} index={index} />
          <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-[10px] tracking-[0.2em] text-ash-300">
                  {String(index + 1).padStart(2, '0')}
                </span>
                {project.year && (
                  <span className="font-mono text-[10px] tracking-[0.2em] text-ash-300">
                    {project.year}
                  </span>
                )}
                <span
                  className={`flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.2em] ${accentText[accent]}`}
                >
                  {project.status === 'live' && (
                    <span
                      className={`h-1.5 w-1.5 animate-pulse rounded-full ${accentDot[accent]}`}
                      aria-hidden
                    />
                  )}
                  {statusLabel[project.status]}
                </span>
              </div>

              <h3 className="font-display text-xl font-semibold tracking-tight text-ash-50 sm:text-2xl">
                {project.title}
              </h3>

              {project.blurb && (
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ash-200">
                  {project.blurb}
                </p>
              )}
            </div>

            {/* Explicit controls sit above the stretched link. */}
            <div className="pointer-events-auto relative z-20 flex shrink-0 gap-2">
              {project.live && (
                <a
                  href={project.live}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="tap rounded-lg border border-ash-600/60 px-3 py-2 text-xs font-medium text-ash-100 transition hover:border-ash-400 hover:text-ash-50"
                >
                  Live ↗
                </a>
              )}
              {project.repo && (
                <a
                  href={project.repo}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="tap rounded-lg border border-ash-600/60 px-3 py-2 text-xs font-medium text-ash-100 transition hover:border-ash-400 hover:text-ash-50"
                >
                  Code ↗
                </a>
              )}
            </div>
          </div>

          {project.metrics.length > 0 && (
            <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-3">
              {project.metrics.map((m, i) => (
                <div key={`${m.label}-${i}`}>
                  <dt className="font-mono text-[10px] uppercase tracking-widest text-ash-300">
                    {m.label}
                  </dt>
                  <dd className="font-display text-lg text-ash-100">
                    <CountUp value={m.value} />
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {hasDetail && (
            <div
              className="grid transition-all duration-500 ease-out"
              style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <div className="space-y-4 pt-6">
                  {project.problem && <Detail label="Problem" body={project.problem} />}
                  {project.approach && <Detail label="Approach" body={project.approach} />}
                  {project.outcome && <Detail label="Outcome" body={project.outcome} />}
                </div>
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
            <ul className="flex flex-wrap gap-1.5">
              {project.stack.map((s, i) => (
                <li
                  key={`${s}-${i}`}
                  className="rounded-md border border-ash-600/40 bg-ash-800/60 px-2 py-1 font-mono text-[10px] text-ash-200"
                >
                  {s}
                </li>
              ))}
            </ul>

            {hasDetail && (
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-expanded={open}
                className="tap pointer-events-auto relative z-20 shrink-0 font-mono text-[10px] uppercase tracking-[0.2em] text-ash-300 transition hover:text-ash-50"
              >
                {open ? '— Less' : '+ Case study'}
              </button>
            )}
          </div>

          {/* Hover affordance — the reason to click. */}
          {target && (
            <div className="open-live mt-5 flex items-center gap-2.5 border-t pt-4"
              style={{ borderColor: 'rgb(var(--accent) / 0.25)' }}
            >
              <span
                className="flex h-7 w-7 items-center justify-center rounded-full"
                style={{ background: 'rgb(var(--accent) / 0.18)' }}
                aria-hidden
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M7 17 17 7M9 7h8v8"
                    stroke={`rgb(${accentVar[accent] === 'var(--ash-400)' ? 'var(--ash-200)' : accentVar[accent]})`}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <span
                className="font-mono text-[10px] uppercase tracking-[0.22em]"
                style={{ color: 'rgb(var(--accent))' }}
              >
                {targetLabel}
              </span>
              <span
                className="ml-auto truncate font-mono text-[10px] text-ash-400"
                title={target}
              >
                {target.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '')}
              </span>
            </div>
          )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Project thumbnail. Shows the supplied image, or a generated placeholder so
 * the listing never has an empty frame while screenshots are still being
 * added. The placeholder is themed by accent and stamped with a monogram +
 * a faint contour/grid pattern, so it reads as "spatial work" rather than a
 * missing image.
 */
function ProjectThumb({
  project,
  accent,
  index,
}: {
  project: Project;
  accent: Accent;
  index: number;
}) {
  const monogram = project.title
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className="relative aspect-[16/10] w-full shrink-0 self-start overflow-hidden rounded-xl border border-ash-600/30 sm:aspect-[4/3] sm:w-52 md:w-60"
      style={{ '--accent': accentVar[accent] } as React.CSSProperties}
    >
      {project.image ? (
        <img
          src={project.image}
          alt={project.title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 group-hover/card:scale-[1.05]"
        />
      ) : (
        <div className="absolute inset-0 transition-transform duration-700 group-hover/card:scale-[1.04]">
          {/* Accent wash */}
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(120% 120% at 20% 12%, rgb(var(--accent) / 0.45), transparent 60%), linear-gradient(150deg, rgb(var(--ash-800)) 0%, rgb(var(--ash-900)) 100%)',
            }}
          />
          {/* Contour-ish concentric rings + grid, echoing the map language */}
          <svg
            className="absolute inset-0 h-full w-full opacity-[0.5]"
            viewBox="0 0 240 180"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden
          >
            <defs>
              <pattern id={`grid-${index}`} width="20" height="20" patternUnits="userSpaceOnUse">
                <path
                  d="M20 0H0V20"
                  fill="none"
                  stroke="rgb(var(--accent))"
                  strokeOpacity="0.18"
                  strokeWidth="0.75"
                />
              </pattern>
            </defs>
            <rect width="240" height="180" fill={`url(#grid-${index})`} />
            {[18, 34, 52, 72].map((r) => (
              <circle
                key={r}
                cx="188"
                cy="150"
                r={r}
                fill="none"
                stroke="rgb(var(--accent))"
                strokeOpacity="0.28"
                strokeWidth="0.9"
              />
            ))}
          </svg>
          {/* Monogram */}
          <span
            className="absolute left-4 top-3 font-display text-4xl font-bold tracking-tightest sm:text-5xl"
            style={{ color: 'rgb(var(--ash-50) / 0.9)' }}
          >
            {monogram}
          </span>
          <span className="absolute bottom-3 left-4 font-mono text-[9px] uppercase tracking-[0.2em] text-ash-300">
            {project.image ? '' : 'Preview soon'}
          </span>
        </div>
      )}
      {/* Subtle inner border for depth over both image and fallback */}
      <span
        className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-inset ring-ash-50/10"
        aria-hidden
      />
    </div>
  );
}

function Detail({ label, body }: { label: string; body: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[100px_1fr] sm:gap-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-ash-400 sm:pt-1">
        {label}
      </div>
      <p className="text-sm leading-relaxed text-ash-200">{body}</p>
    </div>
  );
}
