import { navigate, type WorkCategory } from '../lib/router';
import { Reveal } from './Reveal';

const accentText = {
  ds: 'text-ds',
  gis: 'text-gis',
  gfx: 'text-gfx',
} as const;

const accentBorder = {
  ds: 'hover:border-ds/50',
  gis: 'hover:border-gis/50',
  gfx: 'hover:border-gfx/50',
} as const;

/**
 * "See all" — opens the category's 3D portal. Shown under each home section's
 * listing; the arrow slides on hover to signal it leads somewhere.
 */
export function SeeAll({
  category,
  count,
  accent,
}: {
  category: WorkCategory;
  count: number;
  accent: 'ds' | 'gis' | 'gfx';
}) {
  return (
    <Reveal weight="chip" delay={0.1}>
      <button
        type="button"
        onClick={() => navigate('work', category)}
        className={`group mt-8 flex w-full items-center justify-between gap-4 rounded-2xl border border-ash-600/40 px-6 py-5 text-left transition-colors ${accentBorder[accent]}`}
      >
        <span>
          <span className="block font-display text-base font-semibold text-ash-50">
            Explore all in 3D
          </span>
          <span className="mt-0.5 block font-mono text-[11px] text-ash-400">
            {count} {count === 1 ? 'project' : 'projects'} · fly through the full set
          </span>
        </span>
        <span
          className={`flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.2em] ${accentText[accent]}`}
        >
          See all
          <span className="transition-transform duration-300 group-hover:translate-x-1.5" aria-hidden>
            →
          </span>
        </span>
      </button>
    </Reveal>
  );
}
