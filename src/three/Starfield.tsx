import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollState } from '../lib/scroll';
import { CORRIDOR_DEPTH } from '../data/sections';

/**
 * Ambient dust filling the corridor the camera flies down.
 *
 * Its only job is to make the camera's travel legible — without particles
 * streaming past, a move through empty space reads as nothing happening.
 * Points are recycled: when one falls behind the camera it wraps to the far
 * end, so a few thousand points cover an eighty-unit corridor.
 */

/** Slightly deeper than the corridor so dust never runs out at the far end. */
const DEPTH = CORRIDOR_DEPTH + 18;

export function Starfield({ count = 2200, color = '#98a1ae' }: { count?: number; color?: string }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 46;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 30;
      arr[i * 3 + 2] = 8 - Math.random() * DEPTH;
    }
    return arr;
  }, [count]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [positions]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const dt = Math.min(delta, 0.1);
    const attr = geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;

    // Drift forward, plus a kick proportional to scroll velocity so fast
    // scrolling feels fast.
    const speed = dt * (0.35 + Math.min(Math.abs(scrollState.velocity) * 0.02, 3));
    const camZ = 8 - scrollState.progress * CORRIDOR_DEPTH;

    for (let i = 0; i < count; i++) {
      const zi = i * 3 + 2;
      arr[zi] += speed;
      if (arr[zi] > camZ + 12) arr[zi] -= DEPTH;
      else if (arr[zi] < camZ - DEPTH + 12) arr[zi] += DEPTH;
    }
    attr.needsUpdate = true;

    ref.current.rotation.z += dt * 0.005;
  });

  return (
    <points ref={ref} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        color={color}
        size={0.035}
        sizeAttenuation
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </points>
  );
}
