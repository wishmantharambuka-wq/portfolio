import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { sectionWeight, damp, scrollState } from '../lib/scroll';

/**
 * The Toolkit station: a node-and-edge graph.
 *
 * Skills aren't a list, they're a network — Python touches GIS touches
 * visualisation touches design. Nodes sit on a jittered sphere; edges are
 * drawn between any pair closer than a threshold, which produces the
 * uneven, organic connectivity of a real dependency graph rather than the
 * uniform mesh you'd get from connecting nearest-k.
 */

const NODE_COUNT = 90;
const LINK_DISTANCE = 1.55;
const RADIUS = 3.2;

export function Lattice({
  sectionIndex,
  position,
  nodeColor = '#c2c9d3',
  linkColor = '#6d7787',
}: {
  sectionIndex: number;
  position: [number, number, number];
  nodeColor?: string;
  linkColor?: string;
}) {
  const group = useRef<THREE.Group>(null);
  const nodesRef = useRef<THREE.Points>(null);
  const linksRef = useRef<THREE.LineSegments>(null);
  const visibility = useRef(0);

  const { nodeGeometry, linkGeometry } = useMemo(() => {
    const nodes: THREE.Vector3[] = [];
    const golden = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < NODE_COUNT; i++) {
      const y = 1 - (i / (NODE_COUNT - 1)) * 2;
      const r = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;
      // Radial jitter breaks the perfect shell so edges vary in length.
      const rad = RADIUS * (0.75 + Math.random() * 0.35);
      nodes.push(
        new THREE.Vector3(Math.cos(theta) * r * rad, y * rad, Math.sin(theta) * r * rad),
      );
    }

    const nodePositions = new Float32Array(NODE_COUNT * 3);
    nodes.forEach((n, i) => n.toArray(nodePositions, i * 3));

    const edges: number[] = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      for (let j = i + 1; j < NODE_COUNT; j++) {
        if (nodes[i].distanceTo(nodes[j]) < LINK_DISTANCE) {
          edges.push(...nodes[i].toArray(), ...nodes[j].toArray());
        }
      }
    }

    const ng = new THREE.BufferGeometry();
    ng.setAttribute('position', new THREE.BufferAttribute(nodePositions, 3));

    const lg = new THREE.BufferGeometry();
    lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(edges), 3));

    return { nodeGeometry: ng, linkGeometry: lg };
  }, []);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    visibility.current = damp(visibility.current, sectionWeight(sectionIndex, 1.25), 4, dt);
    const v = visibility.current;

    if (group.current) {
      group.current.visible = v > 0.01;
      group.current.rotation.y += dt * 0.08;
      group.current.rotation.x = scrollState.pointer.y * 0.15;
      group.current.scale.setScalar(0.85 + v * 0.15);
    }
    if (nodesRef.current) {
      (nodesRef.current.material as THREE.PointsMaterial).opacity = v;
    }
    if (linksRef.current) {
      (linksRef.current.material as THREE.LineBasicMaterial).opacity = v * 0.28;
    }
  });

  return (
    <group ref={group} position={position}>
      <lineSegments ref={linksRef} geometry={linkGeometry}>
        <lineBasicMaterial color={linkColor} transparent opacity={0} depthWrite={false} />
      </lineSegments>
      <points ref={nodesRef} geometry={nodeGeometry}>
        <pointsMaterial
          color={nodeColor}
          size={0.075}
          sizeAttenuation
          transparent
          opacity={0}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
