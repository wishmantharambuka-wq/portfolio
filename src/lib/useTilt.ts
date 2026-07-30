import { useEffect, useRef } from 'react';

/* --------------------------------------------------------------------------
 *  useTilt — tactile 3D tilt on pointer.
 *
 *  The card leans in 3D toward the cursor and lifts slightly, and a soft
 *  specular highlight tracks the pointer (via the --glare-x/--glare-y custom
 *  properties, which the card's CSS turns into a radial sheen). It gives flat
 *  cards physical presence without any WebGL cost.
 *
 *  Written to `transform` on a damped rAF loop — never through React state,
 *  so moving the pointer costs nothing but a style write. Opts out entirely on
 *  touch (no hover to justify it) and reduced-motion.
 * ------------------------------------------------------------------------ */
export function useTilt<T extends HTMLElement = HTMLDivElement>({
  max = 7,
  scale = 1.02,
  lift = 6,
}: { max?: number; scale?: number; lift?: number } = {}) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let raf = 0;
    let hovering = false;
    // target vs current, damped each frame
    let trx = 0;
    let try_ = 0;
    let crx = 0;
    let cry = 0;
    let cs = 1;
    let cl = 0;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5; // -0.5 … 0.5
      const py = (e.clientY - r.top) / r.height - 0.5;
      trx = -py * max * 2;
      try_ = px * max * 2;
      hovering = true;
      el.style.setProperty('--glare-x', `${(px + 0.5) * 100}%`);
      el.style.setProperty('--glare-y', `${(py + 0.5) * 100}%`);
    };

    const onEnter = () => {
      hovering = true;
    };
    const onLeave = () => {
      hovering = false;
      trx = 0;
      try_ = 0;
    };

    const loop = () => {
      crx += (trx - crx) * 0.12;
      cry += (try_ - cry) * 0.12;
      const targetScale = hovering ? scale : 1;
      const targetLift = hovering ? lift : 0;
      cs += (targetScale - cs) * 0.12;
      cl += (targetLift - cl) * 0.12;

      el.style.transform = `perspective(1000px) rotateX(${crx.toFixed(2)}deg) rotateY(${cry.toFixed(2)}deg) translateY(${(-cl).toFixed(2)}px) scale(${cs.toFixed(3)})`;
      el.style.setProperty('--tilt', hovering ? '1' : `${cl > 0.05 ? 1 : 0}`);

      raf = requestAnimationFrame(loop);
    };

    el.addEventListener('pointermove', onMove, { passive: true });
    el.addEventListener('pointerenter', onEnter);
    el.addEventListener('pointerleave', onLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerenter', onEnter);
      el.removeEventListener('pointerleave', onLeave);
      el.style.transform = '';
    };
  }, [max, scale, lift]);

  return ref;
}
