import { useMemo } from 'react';

export type Tier = 'high' | 'medium' | 'low';

export type DeviceProfile = {
  tier: Tier;
  /** Renderer pixel ratio clamp. */
  dpr: [number, number];
  /** Post-processing costs a full-screen pass or three — skip it when it hurts. */
  postProcessing: boolean;
  /** Transmission/refraction materials render the scene again per object. */
  transmission: boolean;
  /** Multiplier applied to every particle count in the scene. */
  particleScale: number;
  reducedMotion: boolean;
};

/**
 * Picks a quality tier once, at mount. Cheap heuristics only — a real
 * benchmark would cost more time than it saves, and getting this roughly
 * right is enough to keep mid-range phones above 30fps.
 */
export function useDeviceTier(): DeviceProfile {
  return useMemo(() => {
    if (typeof window === 'undefined') {
      return {
        tier: 'medium',
        dpr: [1, 1.5],
        postProcessing: false,
        transmission: false,
        particleScale: 0.6,
        reducedMotion: false,
      } as DeviceProfile;
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches;
    const cores = navigator.hardwareConcurrency ?? 4;
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
    const small = Math.min(window.innerWidth, window.innerHeight) < 700;

    let tier: Tier = 'high';
    if (coarse || small) tier = 'medium';
    if (cores <= 4 || mem <= 4) tier = tier === 'high' ? 'medium' : 'low';
    if (cores <= 2 || mem <= 2) tier = 'low';
    if (reducedMotion) tier = 'low';

    const profiles: Record<Tier, Omit<DeviceProfile, 'tier' | 'reducedMotion'>> = {
      high: { dpr: [1, 2], postProcessing: true, transmission: true, particleScale: 1 },
      medium: { dpr: [1, 1.5], postProcessing: true, transmission: false, particleScale: 0.55 },
      low: { dpr: [1, 1], postProcessing: false, transmission: false, particleScale: 0.3 },
    };

    return { tier, reducedMotion, ...profiles[tier] };
  }, []);
}
