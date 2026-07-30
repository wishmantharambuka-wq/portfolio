import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { DUR, EASE, TRIGGER_START, prefersReducedMotion } from '../lib/motion';

gsap.registerPlugin(ScrollTrigger);

/* --------------------------------------------------------------------------
 *  Reveals a heading word-by-word, each word wiping up from behind its own
 *  mask on a stagger. Replaces the block fade on section headings — a
 *  heading that assembles itself reads as more deliberate than one that
 *  simply appears.
 *
 *  Accessibility: every word stays a text node inside the heading element,
 *  so the accessible name is the full string. The per-word wrappers are
 *  presentational only.
 * ------------------------------------------------------------------------ */
export function SplitWords({
  text,
  className,
  id,
}: {
  text: string;
  className?: string;
  id?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const inners = el.querySelectorAll<HTMLElement>('[data-word-inner]');
    if (prefersReducedMotion()) {
      gsap.set(inners, { yPercent: 0 });
      return;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        inners,
        { yPercent: 115 },
        {
          yPercent: 0,
          duration: DUR.heavy,
          ease: EASE.reveal,
          stagger: 0.08,
          // immediateRender:false is the safety net. Without it, the words
          // snap to their hidden `from` state at mount and stay there until
          // the ScrollTrigger fires — so a trigger that never fires (a
          // backgrounded tab, an edge-case scroll position) leaves the
          // heading invisible. With it, the words render at their natural
          // position and only drop-and-wipe once the tween actually plays.
          immediateRender: false,
          scrollTrigger: { trigger: el, start: TRIGGER_START, toggleActions: 'play none none none' },
        },
      );
    }, el);

    return () => ctx.revert();
  }, [text]);

  const words = text.split(' ');

  return (
    <h2 ref={ref} id={id} className={className}>
      {words.map((word, i) => (
        <span key={i} className="inline-flex overflow-hidden align-bottom leading-[1.05]">
          <span data-word-inner className="inline-block will-change-transform">
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </span>
        </span>
      ))}
    </h2>
  );
}
