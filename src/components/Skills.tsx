import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Section } from './Section';
import { Reveal } from './Reveal';
import { useContent } from '../lib/contentStore';
import { useFocusRef } from '../lib/useFocusBlur';
import { DUR, EASE, STAGGER, TRIGGER_START } from '../lib/motion';
import type { SkillGroup } from '../data/content';

gsap.registerPlugin(ScrollTrigger);

const barColor = {
  ds: 'bg-ds/70',
  gis: 'bg-gis/70',
  gfx: 'bg-gfx/70',
} as const;

const labelColor = {
  ds: 'text-ds',
  gis: 'text-gis',
  gfx: 'text-gfx',
} as const;

export function SkillsSection() {
  const { skills, sectionCopy } = useContent();
  const root = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;

    const ctx = gsap.context(() => {
      // Bars grow from zero to their data-level as the block scrolls in.
      // Bars in a group fill as one wave rather than each on its own trigger,
      // so the card reads as a single object filling up.
      gsap.utils.toArray<HTMLElement>('[data-skill-group]').forEach((group) => {
        const bars = gsap.utils.toArray<HTMLElement>('[data-bar]', group);
        gsap.to(bars, {
          scaleX: (_i: number, el: HTMLElement) => Number(el.dataset.bar ?? 0),
          duration: DUR.heavy,
          ease: EASE.enter,
          stagger: STAGGER.tight,
          scrollTrigger: { trigger: group, start: TRIGGER_START, toggleActions: 'play none none none' },
        });
      });
    }, el);

    return () => ctx.revert();
    // Re-run when the skill set changes so admin edits animate correctly.
  }, [skills]);

  return (
    <Section
      id="skills"
      index={6}
      eyebrow="Toolkit"
      title={sectionCopy.skills.title}
      lede={sectionCopy.skills.lede}
      accent="none"
      ghost="TOOLKIT"
      wide
    >
      <div ref={root} className="grid gap-5 lg:grid-cols-3">
        {skills.map((group, gi) => (
          <Reveal key={group.id} weight="card" delay={gi * 0.09}>
            <SkillCard group={group} />
          </Reveal>
        ))}
      </div>
    </Section>
  );
}

function SkillCard({ group }: { group: SkillGroup }) {
  const ref = useFocusRef<HTMLDivElement>();

  return (
    <div ref={ref} data-skill-group className="focus-glass h-full rounded-2xl p-6">
      <h3
        className={`font-display text-sm font-semibold uppercase tracking-[0.18em] ${labelColor[group.accent]}`}
      >
        {group.label}
      </h3>

      <ul className="mt-6 space-y-4">
        {group.items.map((item, i) => (
          <li key={`${item.name}-${i}`}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3">
              <span className="text-sm text-ash-200">{item.name}</span>
              <span className="font-mono text-[10px] text-ash-500">
                {Math.round(item.level * 100)}
              </span>
            </div>
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-ash-500/15">
              <div
                data-bar={item.level}
                className={`h-full origin-left rounded-full ${barColor[group.accent]}`}
                style={{ transform: 'scaleX(0)' }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
