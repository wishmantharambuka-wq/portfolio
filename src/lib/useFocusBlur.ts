import { useEffect, useRef } from 'react';

/* --------------------------------------------------------------------------
 *  Centre-of-screen focus.
 *
 *  As a card passes through the middle of the viewport it writes a `--focus`
 *  value (0 → 1) onto itself. The stylesheet turns that into a stronger
 *  backdrop-blur and a more opaque surface.
 *
 *  The key property the user asked for — "blur only behind the card, not the
 *  whole page" — comes free from `backdrop-filter`, which by definition only
 *  samples the area behind the element it's on. No overlay, no masking.
 *
 *  One shared rAF loop and one IntersectionObserver for every card. Cards
 *  outside the viewport are not measured at all, so cost scales with what's
 *  on screen rather than with how many projects you add.
 * ------------------------------------------------------------------------ */

const registered = new Set<HTMLElement>();
const visible = new Set<HTMLElement>();

let observer: IntersectionObserver | null = null;
let raf = 0;
let disabled = false;

function ensureRunning() {
  if (observer) return;

  disabled =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) {
          visible.add(el);
        } else {
          visible.delete(el);
          el.style.setProperty('--focus', '0');
        }
      }
    },
    { rootMargin: '10% 0px' },
  );

  for (const el of registered) observer.observe(el);

  const loop = () => {
    const centre = window.innerHeight / 2;
    // Cards reach full focus within ~21% of viewport height of the centre,
    // and fall to zero by ~42%. Tight enough that only one card is ever
    // strongly focused, wide enough that the transition isn't a flicker.
    const falloff = window.innerHeight * 0.42;

    for (const el of visible) {
      const rect = el.getBoundingClientRect();

      // Tall cards count as centred whenever the viewport centre is anywhere
      // inside them — otherwise a long case-study card could never focus.
      const distance =
        rect.top <= centre && rect.bottom >= centre
          ? 0
          : Math.min(Math.abs(rect.top - centre), Math.abs(rect.bottom - centre));

      const raw = 1 - Math.min(distance / falloff, 1);
      // Smoothstep so the blur eases in rather than ramping linearly.
      const focus = disabled ? 0 : raw * raw * (3 - 2 * raw);

      // Only write when it actually changes — style writes invalidate layout
      // bookkeeping even when the value is identical.
      const prev = el.dataset.focusValue;
      const next = focus.toFixed(3);
      if (prev !== next) {
        el.dataset.focusValue = next;
        el.style.setProperty('--focus', next);
      }
    }

    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);
}

function teardownIfEmpty() {
  if (registered.size > 0) return;
  observer?.disconnect();
  observer = null;
  cancelAnimationFrame(raf);
  raf = 0;
  visible.clear();
}

/**
 * Attach the returned ref to any element that should focus when centred.
 * Cheap enough to use on every card.
 */
export function useFocusRef<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.style.setProperty('--focus', '0');
    registered.add(el);
    ensureRunning();
    observer?.observe(el);

    return () => {
      observer?.unobserve(el);
      registered.delete(el);
      visible.delete(el);
      teardownIfEmpty();
    };
  }, []);

  return ref;
}
