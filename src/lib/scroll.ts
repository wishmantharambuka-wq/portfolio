/* -------------------------------------------------------------------------- *
 *  A single mutable scroll record, read every frame by the 3D scene.          *
 *                                                                            *
 *  Deliberately NOT React state: the camera reads this 60 times a second and  *
 *  re-rendering the component tree at that rate would tank the frame budget.  *
 *  React owns the DOM; this object owns the animation loop.                   *
 * -------------------------------------------------------------------------- */

import { SECTION_COUNT } from '../data/sections';

export const scrollState = {
  /** 0 → 1 across the whole page. */
  progress: 0,
  /** Fractional section index, e.g. 2.4 = 40% between section 2 and 3. */
  position: 0,
  /** Nearest whole section index. */
  section: 0,
  /** Scroll velocity, used for motion-reactive effects. */
  velocity: 0,
  /** Pointer in normalised device coords, for the parallax sway. */
  pointer: { x: 0, y: 0 },
};

export function setScroll(progress: number, velocity: number) {
  const p = Math.min(1, Math.max(0, progress));
  scrollState.progress = p;
  scrollState.position = p * (SECTION_COUNT - 1);
  scrollState.section = Math.round(scrollState.position);
  scrollState.velocity = velocity;
}

/** Bell curve peaking when the camera is parked at `index`. Range 0 → 1. */
export function sectionWeight(index: number, falloff = 1) {
  const d = Math.abs(scrollState.position - index) / falloff;
  return Math.max(0, 1 - d);
}

export const damp = (current: number, target: number, lambda: number, dt: number) =>
  current + (target - current) * (1 - Math.exp(-lambda * dt));
