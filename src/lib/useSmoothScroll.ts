import { useEffect } from 'react';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { setScroll, scrollState } from './scroll';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;

/** Programmatic navigation used by the nav and the scroll cue. */
export function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  if (lenis) lenis.scrollTo(el, { offset: 0, duration: 1.6 });
  else el.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Installs Lenis smooth scrolling and pipes its progress into `scrollState`.
 * GSAP's ticker drives Lenis so DOM reveals and the 3D camera stay on the
 * same clock — otherwise text lags behind the scene by a frame or two.
 */
export function useSmoothScroll(enabled: boolean) {
  useEffect(() => {
    if (!enabled) {
      // Reduced-motion / low-power: native scroll, but still feed the scene.
      const onScroll = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        setScroll(max > 0 ? window.scrollY / max : 0, 0);
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll);
      return () => {
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('resize', onScroll);
      };
    }

    lenis = new Lenis({
      duration: 1.15,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });

    lenis.on('scroll', (e: { progress: number; velocity: number }) => {
      setScroll(e.progress, e.velocity);
      ScrollTrigger.update();
    });

    const tick = (time: number) => lenis?.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tick);
      lenis?.destroy();
      lenis = null;
    };
  }, [enabled]);

  // Pointer parallax — subtle, and only a write to a plain object.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      scrollState.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      scrollState.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => window.removeEventListener('pointermove', onMove);
  }, []);
}
