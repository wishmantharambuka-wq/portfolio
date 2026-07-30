import { useLayoutEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DUR, EASE, LIFT, BLUR, TRIGGER_START, prefersReducedMotion } from '../lib/motion';

gsap.registerPlugin(ScrollTrigger);

type Weight = 'chip' | 'card' | 'heading';

type Props = {
  children: ReactNode;
  delay?: number;
  /** Visual weight — drives distance, duration and ease together. */
  weight?: Weight;
  className?: string;
  as?: 'div' | 'li' | 'section' | 'article' | 'header';
};

/**
 * Fades and lifts a block into view once, on first scroll past.
 *
 * The weight prop is the point of this rewrite: previously everything
 * animated 28px over 1.05s on power3.out, which made a one-line eyebrow and
 * a full project card feel like the same object. Now distance, duration and
 * ease all scale with what's actually moving.
 *
 * Deliberately one-shot — content that re-animates every time it re-enters
 * the viewport is distracting when you scroll back to re-read something.
 */
export function Reveal({ children, delay = 0, weight = 'card', className, as = 'div' }: Props) {
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      gsap.set(el, { opacity: 1, y: 0, filter: 'none' });
      return;
    }

    const spec = {
      chip: { y: LIFT.chip, duration: DUR.quick, ease: EASE.enter, blur: 0 },
      card: { y: LIFT.card, duration: DUR.base, ease: EASE.enter, blur: BLUR.subtle },
      heading: { y: LIFT.heading, duration: DUR.heavy, ease: EASE.enterSoft, blur: BLUR.subtle },
    }[weight];

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        {
          opacity: 0,
          y: spec.y,
          ...(spec.blur ? { filter: `blur(${spec.blur}px)` } : {}),
        },
        {
          opacity: 1,
          y: 0,
          ...(spec.blur ? { filter: 'blur(0px)' } : {}),
          duration: spec.duration,
          delay,
          ease: spec.ease,
          scrollTrigger: {
            trigger: el,
            start: TRIGGER_START,
            toggleActions: 'play none none none',
          },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [delay, weight]);

  const Tag = as as 'div';
  return (
    <Tag ref={ref as React.RefObject<HTMLDivElement>} className={className}>
      {children}
    </Tag>
  );
}
