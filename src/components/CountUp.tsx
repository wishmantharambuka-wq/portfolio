import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { DUR, prefersReducedMotion } from '../lib/motion';

/* --------------------------------------------------------------------------
 *  Counts a numeric value up from zero when it scrolls into view.
 *
 *  Visibility is polled with getBoundingClientRect on a rAF loop — the same
 *  mechanism useFocusBlur uses, and the only one that proved reliable here.
 *  In this Lenis setup the window 'scroll' event never fires (Lenis changes
 *  scrollY without emitting it), IntersectionObserver never reports
 *  intersection, and ScrollTrigger misfires at creation and flashes a stuck
 *  "0". A rAF rect check sidesteps all three. It runs only while the counter
 *  is still below the fold, then animates once and stops — so a revealed
 *  counter costs nothing.
 *
 *  Only values that START with a digit and have no further digit animate
 *  ("331", "450k ha", "5 months"). Everything else ("— %", "Landsat 8/9",
 *  "R²") renders verbatim.
 * ------------------------------------------------------------------------ */

const NUMERIC = /^(\d[\d,]*(?:\.\d+)?)(\D*)$/;

export function CountUp({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const match = value.match(NUMERIC);
    if (!match || prefersReducedMotion()) {
      el.textContent = value;
      return;
    }

    const numStr = match[1];
    const suffix = match[2];
    const target = parseFloat(numStr.replace(/,/g, ''));
    const decimals = numStr.includes('.') ? numStr.split('.')[1].length : 0;
    const render = (n: number) => n.toFixed(decimals) + suffix;

    // Real value shown until the count genuinely starts, so an element that
    // never scrolls into view stays correct.
    el.textContent = value;

    let raf = 0;
    let tween: gsap.core.Tween | null = null;
    const counter = { n: 0 };

    const start = () => {
      counter.n = 0;
      el.textContent = render(0);
      tween = gsap.to(counter, {
        n: target,
        duration: DUR.heavy,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = render(counter.n);
        },
        onComplete: () => {
          el.textContent = value;
        },
      });
    };

    const tick = () => {
      const r = el.getBoundingClientRect();
      // Trigger a little before the element reaches the vertical centre.
      if (r.top < window.innerHeight * 0.9 && r.bottom > 0) {
        start();
        return; // stop polling — the reveal is one-shot
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      tween?.kill();
    };
  }, [value]);

  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
