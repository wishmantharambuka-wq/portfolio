/* ==========================================================================
 *  MOTION TOKENS
 *
 *  The problem with the previous choreography wasn't GSAP — it was that every
 *  animation used the same duration (1.05s), the same ease (power3.out) and
 *  the same 28px lift. Uniform motion reads as a template no matter how good
 *  the individual transition is.
 *
 *  This file gives motion a vocabulary: things that are heavy move slowly on
 *  a decelerating ease, things that are incidental snap. Import the tokens
 *  rather than typing literals, so the whole site stays in one rhythm.
 * ========================================================================== */

/** Durations, in seconds. Named by weight, not by number. */
export const DUR = {
  /** Chips, toggles, hover states — should feel instant. */
  snap: 0.32,
  /** Standard UI element entering. */
  quick: 0.55,
  /** Body copy, cards, list rows. */
  base: 0.85,
  /** Section headings and other heavy objects. */
  heavy: 1.25,
  /** Hero display type — the one thing allowed to take its time. */
  cinematic: 1.8,
} as const;

/**
 * Easing. GSAP's built-ins only (no CustomEase — that's a Club plugin in
 * 3.12, and pulling it in for three curves isn't worth the dependency).
 *
 * `expo.out` is the workhorse: it covers ~80% of its distance in the first
 * fifth of its duration, which is what makes an element feel like it *lands*
 * rather than drifts into place.
 */
export const EASE = {
  /** Default entrance — decisive arrival. */
  enter: 'expo.out',
  /** Softer entrance for large areas, where expo reads as a jolt. */
  enterSoft: 'power3.out',
  /** Type sliding up from behind a mask. */
  reveal: 'power4.out',
  /** Anything reversible (open/close, toggle). */
  inOut: 'power2.inOut',
  /** Slight overshoot, for objects with implied mass. */
  overshoot: 'back.out(1.4)',
} as const;

/** Stagger spacing between siblings. */
export const STAGGER = {
  tight: 0.04,
  base: 0.075,
  loose: 0.13,
} as const;

/**
 * Distances, in px. Elements lift proportionally to their visual weight — a
 * heading travelling the same 28px as a chip is what made everything feel
 * like it moved on rails.
 */
export const LIFT = {
  chip: 12,
  card: 26,
  heading: 44,
} as const;

/** Blur used on entrance, in px. Small values read as focus, large as fog. */
export const BLUR = {
  subtle: 5,
  strong: 12,
} as const;

/** ScrollTrigger start position — how far up the viewport an element triggers. */
export const TRIGGER_START = 'top 86%';

/** True when the user has asked for reduced motion. */
export const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;
