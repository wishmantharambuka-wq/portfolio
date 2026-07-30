import { Section } from './Section';
import { Reveal } from './Reveal';
import { useContent } from '../lib/contentStore';
import { useFocusRef } from '../lib/useFocusBlur';

export function About() {
  const { profile, sectionCopy } = useContent();

  return (
    <Section
      id="about"
      index={2}
      eyebrow="About"
      title={sectionCopy.about.title}
      lede={sectionCopy.about.lede}
      accent="none"
      ghost="ABOUT"
    >
      <div className="grid gap-10 lg:grid-cols-[1.35fr_1fr]">
        <Reveal>
          <p className="whitespace-pre-line text-base leading-[1.85] text-ash-300 sm:text-lg">
            {profile.intro}
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="space-y-4">
            {profile.education.map((e) => (
              <EducationCard key={e.id} {...e} />
            ))}
          </div>
        </Reveal>
      </div>

      {/* The priority statement — the thesis of the whole portfolio. */}
      <Reveal delay={0.15}>
        <div className="mt-12 grid gap-3 sm:grid-cols-3">
          {[
            { n: '01', label: 'Data Science', note: 'Where I want to build my career.', tone: 'text-ds', bar: 'bg-ds' },
            { n: '02', label: 'GIS & Geospatial', note: 'My native language for spatial problems.', tone: 'text-gis', bar: 'bg-gis' },
            { n: '03', label: 'Graphic Design', note: 'The habit that makes the rest legible.', tone: 'text-gfx', bar: 'bg-gfx' },
          ].map((d) => (
            <PriorityCard key={d.n} {...d} />
          ))}
        </div>
      </Reveal>
    </Section>
  );
}

function EducationCard({
  degree,
  org,
  period,
  note,
}: {
  degree: string;
  org: string;
  period: string;
  note: string;
}) {
  const ref = useFocusRef<HTMLDivElement>();
  return (
    <div ref={ref} className="focus-glass rounded-xl p-5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-ash-500">{period}</p>
      <h3 className="mt-2 font-display text-base font-semibold text-ash-50">{degree}</h3>
      {org && <p className="mt-1 text-sm text-ash-400">{org}</p>}
      {note && <p className="mt-3 text-sm leading-relaxed text-ash-400">{note}</p>}
    </div>
  );
}

function PriorityCard({
  n,
  label,
  note,
  tone,
  bar,
}: {
  n: string;
  label: string;
  note: string;
  tone: string;
  bar: string;
}) {
  const ref = useFocusRef<HTMLDivElement>();
  return (
    <div ref={ref} className="focus-glass relative overflow-hidden rounded-xl p-5">
      <span className={`absolute inset-x-0 top-0 h-px ${bar} opacity-50`} aria-hidden />
      <span className="font-mono text-[10px] tracking-widest text-ash-500">{n}</span>
      <h3 className={`mt-2 font-display text-lg font-semibold ${tone}`}>{label}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ash-400">{note}</p>
    </div>
  );
}
