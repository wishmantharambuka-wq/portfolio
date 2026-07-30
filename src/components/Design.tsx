import { Section } from './Section';
import { Reveal } from './Reveal';
import { useContent } from '../lib/contentStore';
import { useFocusRef } from '../lib/useFocusBlur';
import { useTilt } from '../lib/useTilt';
import { SeeAll } from './SeeAll';
import type { DesignPiece } from '../data/content';

/**
 * Graphic design gallery.
 *
 * Any piece without an `image` renders a generated gradient tile built from
 * its `hue`, so the grid looks intentional while it's still empty. Drop
 * files into /public/assets/design/ and set the image path in the admin
 * panel to swap a placeholder for real artwork.
 */
function Tile({ piece, index }: { piece: DesignPiece; index: number }) {
  const focusRef = useFocusRef<HTMLElement>();
  const tiltRef = useTilt<HTMLElement>({ max: 6, scale: 1.03, lift: 5 });
  // One element, two ref-based systems (focus-blur + tilt) — merge them.
  const attach = (el: HTMLElement | null) => {
    (focusRef as React.MutableRefObject<HTMLElement | null>).current = el;
    (tiltRef as React.MutableRefObject<HTMLElement | null>).current = el;
  };

  // Vary the tile footprint so the grid reads as a designed layout rather
  // than a spreadsheet.
  const span =
    index % 5 === 0 ? 'sm:col-span-2 sm:row-span-2' : index % 3 === 0 ? 'sm:col-span-2' : '';

  return (
    <article
      ref={attach}
      className={`group tilt-card focus-glass relative overflow-hidden rounded-2xl ${span}`}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {piece.image ? (
          <img
            src={piece.image}
            alt={piece.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div
            className="h-full w-full transition-transform duration-700 group-hover:scale-[1.04]"
            aria-hidden
            style={{
              background: `
                radial-gradient(120% 90% at 20% 15%, hsl(${piece.hue} 55% 62% / 0.38), transparent 62%),
                radial-gradient(100% 80% at 85% 80%, hsl(${(piece.hue + 55) % 360} 50% 58% / 0.28), transparent 60%),
                linear-gradient(145deg, rgb(var(--glass-tint) / 0.06), rgb(var(--glass-tint) / 0.01))
              `,
            }}
          >
            {/* A faint grid so empty tiles still look like design surfaces. */}
            <div
              className="h-full w-full opacity-[0.13]"
              style={{
                backgroundImage:
                  'linear-gradient(rgb(var(--glass-tint) / .5) 1px, transparent 1px), linear-gradient(90deg, rgb(var(--glass-tint) / .5) 1px, transparent 1px)',
                backgroundSize: '34px 34px',
              }}
            />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-ash-950 via-ash-950/25 to-transparent" />

        {piece.kind && (
          <span className="absolute left-4 top-4 rounded-full border border-ash-500/25 bg-ash-950/60 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-ash-200 backdrop-blur">
            {piece.kind}
          </span>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-display text-base font-semibold text-ash-50">{piece.title}</h3>
          {piece.year && (
            <span className="shrink-0 font-mono text-[10px] text-ash-400">{piece.year}</span>
          )}
        </div>
        {piece.note && (
          <p className="mt-1.5 text-sm leading-relaxed text-ash-300">{piece.note}</p>
        )}
      </div>
    </article>
  );
}

export function DesignSection() {
  const { design, sectionCopy } = useContent();

  return (
    <Section
      id="design"
      index={5}
      eyebrow="Priority 03 — Graphic Design"
      title={sectionCopy.design.title}
      lede={sectionCopy.design.lede}
      accent="gfx"
      ghost="DESIGN"
      wide
    >
      <div className="grid auto-rows-[minmax(0,1fr)] grid-cols-1 gap-4 sm:grid-cols-3">
        {design.map((piece, i) => (
          <Reveal key={piece.id} weight="card" delay={i * 0.05}>
            <Tile piece={piece} index={i} />
          </Reveal>
        ))}
      </div>
      <SeeAll category="design" count={design.length} accent="gfx" />
    </Section>
  );
}
