import { useEffect, useRef } from 'react';

/**
 * Magnetic hover: the element leans toward the cursor while it's nearby and
 * springs back when it leaves.
 *
 * Written straight to `transform` on a rAF-damped loop rather than through
 * React state — a magnetic element that re-rendered on pointermove would
 * cost more than the whole 3D scene.
 */
export function useMagnetic<T extends HTMLElement = HTMLDivElement>(strength = 0.32) {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Pointer-follow is meaningless on touch and costs battery.
    if (window.matchMedia('(pointer: coarse)').matches) return;

    let targetX = 0;
    let targetY = 0;
    let x = 0;
    let y = 0;
    let raf = 0;
    let active = false;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      // Engage within roughly one and a half element-widths of the centre.
      const radius = Math.max(r.width, r.height) * 1.5;
      const dist = Math.hypot(dx, dy);

      if (dist < radius) {
        const falloff = 1 - dist / radius;
        targetX = dx * strength * falloff;
        targetY = dy * strength * falloff;
        active = true;
      } else if (active) {
        targetX = 0;
        targetY = 0;
      }
    };

    const loop = () => {
      x += (targetX - x) * 0.14;
      y += (targetY - y) * 0.14;
      if (Math.abs(x) < 0.01 && Math.abs(y) < 0.01 && targetX === 0 && targetY === 0) {
        el.style.transform = '';
        active = false;
      } else {
        el.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0)`;
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
      el.style.transform = '';
    };
  }, [strength]);

  return ref;
}
