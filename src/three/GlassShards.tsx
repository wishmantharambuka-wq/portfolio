import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshTransmissionMaterial, RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { scrollState, sectionWeight, damp } from '../lib/scroll';

/**
 * The Graphic Design station: a drifting stack of frosted glass panels.
 *
 * Design work is layers — type over image over grid — so the object is
 * literally a set of layers you fly between. Real transmission (refraction)
 * is beautiful and expensive: it re-renders the scene per material, so on
 * anything below the top tier we fall back to a physical material with
 * heavy roughness, which reads nearly the same at this distance.
 */

type ShardSpec = {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  drift: number;
};

// Tinted across the palette's sand → copper → slate range so the stack reads
// as layered material samples rather than coloured plastic.
const SHARDS: ShardSpec[] = [
  { position: [-2.6, 0.9, 1.4], rotation: [0.1, 0.35, -0.14], scale: [3.0, 4.0, 0.1], color: '#d3c3b9', drift: 1.0 },
  { position: [1.9, -0.6, 0.2], rotation: [-0.08, -0.28, 0.2], scale: [3.6, 2.4, 0.1], color: '#f3f0ec', drift: 0.7 },
  { position: [0.2, 1.8, -1.6], rotation: [0.22, 0.1, 0.06], scale: [2.6, 2.6, 0.1], color: '#a79e9c', drift: 1.3 },
  { position: [-1.4, -1.9, -2.6], rotation: [-0.16, 0.44, -0.3], scale: [4.2, 2.0, 0.1], color: '#b58863', drift: 0.5 },
  { position: [2.8, 1.6, -3.4], rotation: [0.05, -0.5, 0.12], scale: [2.2, 3.2, 0.1], color: '#3d4d55', drift: 0.9 },
];

function Shard({
  spec,
  index,
  useTransmission,
  visibility,
}: {
  spec: ShardSpec;
  index: number;
  useTransmission: boolean;
  visibility: React.MutableRefObject<number>;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const base = useMemo(() => new THREE.Vector3(...spec.position), [spec.position]);

  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime;

    // Each panel drifts on its own slow orbit and leans toward the pointer.
    ref.current.position.set(
      base.x + Math.sin(t * 0.22 * spec.drift + index) * 0.28 + scrollState.pointer.x * 0.35 * spec.drift,
      base.y + Math.cos(t * 0.18 * spec.drift + index * 1.7) * 0.32 + scrollState.pointer.y * 0.25 * spec.drift,
      base.z,
    );
    ref.current.rotation.x = spec.rotation[0] + Math.sin(t * 0.14 + index) * 0.06;
    ref.current.rotation.y = spec.rotation[1] + Math.cos(t * 0.11 + index) * 0.08;

    // Panels fan apart as the section comes into view.
    const v = visibility.current;
    ref.current.scale.setScalar(0.82 + v * 0.18);

    const mat = ref.current.material as THREE.Material;
    mat.opacity = v;
    mat.transparent = true;
    ref.current.visible = v > 0.01;
  });

  return (
    <RoundedBox
      ref={ref}
      args={spec.scale}
      radius={0.06}
      smoothness={3}
      position={spec.position}
      rotation={spec.rotation}
    >
      {useTransmission ? (
        <MeshTransmissionMaterial
          samples={4}
          resolution={256}
          thickness={0.4}
          roughness={0.22}
          anisotropy={0.3}
          chromaticAberration={0.06}
          distortion={0.2}
          distortionScale={0.3}
          temporalDistortion={0.1}
          color={spec.color}
          backside={false}
          transparent
        />
      ) : (
        <meshPhysicalMaterial
          color={spec.color}
          roughness={0.35}
          metalness={0.05}
          transmission={0}
          transparent
          opacity={0.22}
          clearcoat={0.6}
          clearcoatRoughness={0.4}
          side={THREE.DoubleSide}
        />
      )}
    </RoundedBox>
  );
}

export function GlassShards({
  sectionIndex,
  position,
  useTransmission,
}: {
  sectionIndex: number;
  position: [number, number, number];
  useTransmission: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const visibility = useRef(0);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    visibility.current = damp(visibility.current, sectionWeight(sectionIndex, 1.25), 4, dt);
    if (group.current) {
      group.current.rotation.y += dt * 0.03;
      group.current.visible = visibility.current > 0.01;
    }
  });

  return (
    <group ref={group} position={position}>
      {SHARDS.map((spec, i) => (
        <Shard
          key={i}
          spec={spec}
          index={i}
          useTransmission={useTransmission}
          visibility={visibility}
        />
      ))}
    </group>
  );
}
