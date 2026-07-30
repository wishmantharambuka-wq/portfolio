import { useCallback, useEffect, useRef } from 'react';

/**
 * Sizes a single line of text to exactly fill its container's width.
 *
 * Why this exists: the cover word is set at display size AND is editable from
 * the admin panel. Any fixed or `vw` font-size is a guess about how many
 * characters the word has — "PORTFOLIO" at `14rem` overflows its container by
 * 116px at a 1024px viewport, and the hero's reveal mask (`overflow-hidden`)
 * silently clips it. Change the word to something longer and it gets worse.
 *
 * So instead of guessing, measure: render at a reference size, measure the
 * real glyph width with a Range (the element is a block, so its own
 * getBoundingClientRect is the container width, not the text width), then
 * scale font-size by the ratio needed to fit.
 */
export function useFitText<T extends HTMLElement = HTMLElement>({
  min = 28,
  max = 320,
  /** Fraction of the container to fill. A hair under 1 avoids sub-pixel clipping. */
  fill = 0.98,
}: { min?: number; max?: number; fill?: number } = {}) {
  const ref = useRef<T>(null);

  const fit = useCallback(() => {
    const el = ref.current;
    const parent = el?.parentElement;
    if (!el || !parent) return;

    const available = parent.clientWidth;
    if (available <= 0) return;

    // Measure at a known size so the ratio is independent of current state.
    const REF = 100;
    el.style.fontSize = `${REF}px`;

    const range = document.createRange();
    range.selectNodeContents(el);
    const glyphWidth = range.getBoundingClientRect().width;
    range.detach?.();

    if (glyphWidth <= 0) return;

    const widthPerPx = glyphWidth / REF;
    const size = Math.max(min, Math.min(max, (available * fill) / widthPerPx));
    el.style.fontSize = `${size.toFixed(2)}px`;
  }, [min, max, fill]);

  useEffect(() => {
    fit();

    // Web fonts land after first paint; measuring before they do produces a
    // ratio for the fallback face and the word ends up the wrong size.
    document.fonts?.ready.then(fit).catch(() => {});

    const parent = ref.current?.parentElement;
    const ro = new ResizeObserver(fit);
    if (parent) ro.observe(parent);
    window.addEventListener('resize', fit);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [fit]);

  // Re-fit when the text content itself changes (admin panel edits).
  return { ref, refit: fit };
}
