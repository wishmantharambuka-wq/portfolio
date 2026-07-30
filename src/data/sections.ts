/* ---------------------------------------------------------------------- *
 *  SECTIONS — the spine of the site.
 *
 *  Order here controls BOTH the DOM order and the camera flight path in
 *  the 3D scene. Each section owns a station in 3D space; the camera
 *  travels station-to-station as you scroll. Add or reorder here and the
 *  nav, the scroll progress and the camera all follow automatically.
 *
 *  If you add a station, give its 3D object a position in `stations` and
 *  wire it into src/three/Scene.tsx — and check the IDX map there, which
 *  has to agree with this order.
 * ---------------------------------------------------------------------- */

export type SectionId =
  | 'hero'
  | 'paths'
  | 'about'
  | 'data-science'
  | 'gis'
  | 'design'
  | 'skills'
  | 'contact';

export type SectionDef = {
  id: SectionId;
  /** Label in the dial nav. */
  label: string;
  /** Camera station in world space. */
  camera: [number, number, number];
  /** Point the camera looks at while parked here. */
  target: [number, number, number];
};

/** Spacing between stations along -Z. */
const GAP = 13;
const z = (i: number) => -GAP * i;

export const sections: SectionDef[] = [
  { id: 'hero',         label: 'Cover',        camera: [0, 0, 7],              target: [0, 0, z(0)] },
  { id: 'paths',        label: 'Paths',        camera: [0, 1.6, z(1) + 6.5],   target: [0, 0.4, z(1)] },
  { id: 'about',        label: 'About',        camera: [2.2, 0.5, z(2) + 6.5], target: [0, 0, z(2)] },
  { id: 'data-science', label: 'Data Science', camera: [-2, 0.2, z(3) + 6.5],  target: [0, 0, z(3)] },
  { id: 'gis',          label: 'Geospatial',   camera: [1.8, 2.2, z(4) + 6.5], target: [0, -1.2, z(4)] },
  { id: 'design',       label: 'Design',       camera: [-2.2, -0.4, z(5) + 6.5], target: [0, 0, z(5)] },
  { id: 'skills',       label: 'Toolkit',      camera: [0.8, 0.8, z(6) + 6.5], target: [0, 0, z(6)] },
  { id: 'contact',      label: 'Contact',      camera: [0, 0, z(7) + 6.5],     target: [0, 0, z(7)] },
];

/** Where each section's 3D centrepiece lives. Mirrors the `target` values. */
export const stations: Record<SectionId, [number, number, number]> = {
  hero: [0, 0, z(0)],
  paths: [0, 0.4, z(1)],
  about: [0, 0, z(2)],
  'data-science': [0, 0, z(3)],
  gis: [0, -1.2, z(4)],
  design: [0, 0, z(5)],
  skills: [0, 0, z(6)],
  contact: [0, 0, z(7)],
};

export const SECTION_COUNT = sections.length;

/** Total corridor depth, used by the ambient dust to size its wrap window. */
export const CORRIDOR_DEPTH = GAP * (sections.length - 1);
