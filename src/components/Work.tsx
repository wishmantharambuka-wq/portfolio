import type { ReactNode } from 'react';
import { Section } from './Section';
import { ProjectRow } from './ProjectRow';
import { SeeAll } from './SeeAll';
import { useContent } from '../lib/contentStore';
import type { Project } from '../data/content';
import type { Accent } from './Section';

/**
 * The two project sections. They share a component because they share a
 * shape — only the copy, the accent and the data source differ.
 *
 * No per-row `Reveal` wrapper here: the rows already animate continuously
 * with scroll position via `.listing-row`, and layering a one-shot fade on
 * top fought that — rows would arrive opaque and then be dimmed back down
 * by the depth system.
 */

function Listing({ projects, accent }: { projects: Project[]; accent: Accent }) {
  return (
    <div className="relative">
      {/* The rail the rows hang off. */}
      <span
        className="listing-rail absolute bottom-0 left-[0.4rem] top-0 w-px sm:left-[1.55rem]"
        aria-hidden
      />
      <div className="flex flex-col gap-4 sm:gap-6">
        {projects.map((p, i) => (
          <ProjectRow key={p.id} project={p} accent={accent} index={i} />
        ))}
      </div>
    </div>
  );
}

export function DataScienceSection() {
  const { dataScience, sectionCopy } = useContent();

  return (
    <Section
      id="data-science"
      index={3}
      eyebrow="Priority 01 — Data Science"
      title={sectionCopy.dataScience.title}
      lede={sectionCopy.dataScience.lede}
      accent="ds"
      ghost="DATA"
      wide
    >
      {dataScience.length > 0 ? (
        <Listing projects={dataScience} accent="ds" />
      ) : (
        <EmptyNote label="data science projects" />
      )}
      <SeeAll category="data-science" count={dataScience.length} accent="ds" />
    </Section>
  );
}

export function GisSection() {
  const { gis, sectionCopy } = useContent();

  return (
    <Section
      id="gis"
      index={4}
      eyebrow="Priority 02 — GIS & Geospatial"
      title={sectionCopy.gis.title}
      lede={sectionCopy.gis.lede}
      accent="gis"
      ghost="SPATIAL"
      wide
    >
      {gis.length > 0 ? (
        <Listing projects={gis} accent="gis" />
      ) : (
        <EmptyNote label="GIS projects" />
      )}
      <SeeAll category="gis" count={gis.length} accent="gis" />
    </Section>
  );
}

function EmptyNote({ label }: { label: string }): ReactNode {
  return (
    <p className="glass rounded-xl p-6 text-sm text-ash-400">
      No {label} yet — add them from the admin panel at{' '}
      <code className="text-ash-200">#/admin</code>.
    </p>
  );
}
