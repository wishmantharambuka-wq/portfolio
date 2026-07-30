import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { scrollState, damp } from '../lib/scroll';
import { sections } from '../data/sections';

/**
 * Flies the camera along a smooth spline through every section's station.
 *
 * A Catmull-Rom curve rather than lerping between waypoints: straight
 * segments with corners at each station make the motion feel like a slide
 * deck, while a continuous curve reads as one uninterrupted shot — which is
 * the "scrolling plays a 3D video" effect we're after.
 *
 * The pointer adds a small parallax offset on top. It's damped, never
 * absolute, so the camera always settles back onto the path.
 */
export function CameraRig() {
  const { camera } = useThree();
  const lookAt = useRef(new THREE.Vector3(0, 0, 0));
  const swayX = useRef(0);
  const swayY = useRef(0);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  const { path, aim } = useMemo(() => {
    const p = new THREE.CatmullRomCurve3(
      sections.map((s) => new THREE.Vector3(...s.camera)),
      false,
      'catmullrom',
      0.35,
    );
    const a = new THREE.CatmullRomCurve3(
      sections.map((s) => new THREE.Vector3(...s.target)),
      false,
      'catmullrom',
      0.35,
    );
    return { path: p, aim: a };
  }, []);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const t = THREE.MathUtils.clamp(scrollState.progress, 0, 1);

    path.getPointAt(t, tmp);

    swayX.current = damp(swayX.current, scrollState.pointer.x * 0.55, 2.5, dt);
    swayY.current = damp(swayY.current, scrollState.pointer.y * 0.35, 2.5, dt);

    // A slow idle bob keeps the frame alive when the user stops scrolling.
    const idle = state.clock.elapsedTime;
    camera.position.set(
      tmp.x + swayX.current + Math.sin(idle * 0.31) * 0.08,
      tmp.y + swayY.current + Math.cos(idle * 0.24) * 0.06,
      tmp.z,
    );

    aim.getPointAt(t, tmp);
    lookAt.current.x = damp(lookAt.current.x, tmp.x + swayX.current * 0.3, 3, dt);
    lookAt.current.y = damp(lookAt.current.y, tmp.y + swayY.current * 0.3, 3, dt);
    lookAt.current.z = damp(lookAt.current.z, tmp.z, 6, dt);
    camera.lookAt(lookAt.current);

    // Very slight roll into the direction of travel.
    camera.rotation.z = damp(camera.rotation.z, -swayX.current * 0.03, 2, dt);
  });

  return null;
}
