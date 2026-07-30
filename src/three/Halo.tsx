import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Torus } from '@react-three/drei';
import * as THREE from 'three';
import { sectionWeight, damp, scrollState } from '../lib/scroll';

/**
 * A quiet marker object for the sections that carry mostly text (About,
 * Contact). Concentric rings, slowly counter-rotating — enough presence to
 * confirm you've arrived somewhere without competing with the copy.
 */
export function Halo({
  sectionIndex,
  position,
  color = '#c2c9d3',
  scale = 1,
}: {
  sectionIndex: number;
  position: [number, number, number];
  color?: string;
  scale?: number;
}) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.Mesh>(null);
  const outer = useRef<THREE.Mesh>(null);
  const mid = useRef<THREE.Mesh>(null);
  const visibility = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    visibility.current = damp(visibility.current, sectionWeight(sectionIndex, 1.3), 4, dt);
    const v = visibility.current;

    if (group.current) {
      group.current.visible = v > 0.01;
      group.current.rotation.x = 0.4 + scrollState.pointer.y * 0.2;
      group.current.rotation.y = scrollState.pointer.x * 0.25;
      group.current.scale.setScalar(scale * (0.9 + v * 0.1));
    }
    for (const [i, r] of [inner, mid, outer].entries()) {
      if (!r.current) continue;
      r.current.rotation.z += dt * (0.12 - i * 0.05) * (i % 2 === 0 ? 1 : -1);
      const mat = r.current.material as THREE.MeshBasicMaterial;
      mat.opacity = v * (0.5 - i * 0.13);
    }
  });

  return (
    <group ref={group} position={position}>
      <Torus ref={inner} args={[2.0, 0.006, 8, 128]}>
        <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
      </Torus>
      <Torus ref={mid} args={[3.0, 0.004, 8, 128]} rotation={[0.5, 0.2, 0]}>
        <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
      </Torus>
      <Torus ref={outer} args={[4.2, 0.003, 8, 128]} rotation={[-0.35, 0.4, 0]}>
        <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
      </Torus>
    </group>
  );
}
