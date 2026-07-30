import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { simplex3d } from './glsl/noise';
import { scrollState, sectionWeight, damp } from '../lib/scroll';

/**
 * The hero centrepiece, and the Data Science station's object.
 *
 * It is one point cloud with two resting shapes baked into attributes: a
 * sphere (the "everything is connected" hero read) and a 3D scatter cloud
 * (the data-science read). Scrolling from the hero to the Data Science
 * section morphs one into the other, so the object *is* the transition
 * rather than being swapped out for a different mesh.
 */

export const orbVertexShader = /* glsl */ `
uniform float uTime;
uniform float uMorph;      // 0 = sphere, 1 = scatter cloud
uniform float uAmplitude;  // noise displacement strength
uniform float uSize;
uniform float uPixelRatio;
uniform vec2  uCursor;         // pointer, in the view-space plane
uniform float uCursorStrength; // how hard the cloud reacts (0 = off)

attribute vec3 aScatter;
attribute float aSeed;

varying float vDepth;
varying float vSeed;
varying float vTurbulence;
varying float vCursor;

${simplex3d}

void main() {
  // Ease the morph per-point so the cloud reorganises in a wave, not a snap.
  float stagger = smoothstep(0.0, 1.0, clamp(uMorph * 1.6 - aSeed * 0.6, 0.0, 1.0));
  vec3 pos = mix(position, aScatter, stagger);

  // Living surface: low-frequency noise pushed along the point's own axis.
  float n = fbm(pos * 0.55 + vec3(0.0, 0.0, uTime * 0.12));
  vTurbulence = n;
  pos += normalize(position) * n * uAmplitude;

  // Slow breathing, independent of scroll so the scene never looks frozen.
  pos *= 1.0 + sin(uTime * 0.6 + aSeed * 6.28) * 0.012;

  vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);

  // ---- Cursor interaction --------------------------------------------------
  // Done in view space so it stays anchored under the pointer no matter how
  // the cloud is rotating in model space. Points near the cursor are pushed
  // radially away (parting the cloud like a hand through mist) and popped
  // slightly toward the camera, so the reaction reads as depth, not a 2D nudge.
  vec2 toCursor = mvPosition.xy - uCursor;
  float cd = length(toCursor);
  float infl = exp(-cd * cd * 0.32) * uCursorStrength;
  mvPosition.xy += normalize(toCursor + vec2(0.0001)) * infl;
  mvPosition.z += infl * 0.5;
  vCursor = clamp(infl, 0.0, 1.0);

  vDepth = -mvPosition.z;
  vSeed = aSeed;

  gl_Position = projectionMatrix * mvPosition;
  // Points under the cursor swell a touch, reinforcing the interaction.
  gl_PointSize = uSize * uPixelRatio * (1.0 + aSeed * 0.8 + vCursor * 1.4) * (14.0 / max(vDepth, 0.1));
}
`;

export const orbFragmentShader = /* glsl */ `
uniform vec3 uColorCore;
uniform vec3 uColorEdge;
uniform float uOpacity;

varying float vDepth;
varying float vSeed;
varying float vTurbulence;
varying float vCursor;

void main() {
  // Round, soft-edged points. Discarding early beats blending a full quad.
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;

  float falloff = smoothstep(0.5, 0.0, d);
  vec3 color = mix(uColorEdge, uColorCore, clamp(vTurbulence * 0.5 + 0.5, 0.0, 1.0));
  // Points the cursor is disturbing brighten toward the core colour.
  color = mix(color, uColorCore, vCursor * 0.8);

  // Fade distant points so the cloud reads as volume, not a flat sticker.
  float depthFade = smoothstep(34.0, 5.0, vDepth);
  float alpha = falloff * uOpacity * depthFade * (0.45 + vSeed * 0.55 + vCursor * 0.4);

  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
}
`;

type Props = {
  /** Section index this object belongs to, used to compute its own visibility. */
  heroIndex: number;
  dataIndex: number;
  count?: number;
  colorCore: string;
  colorEdge: string;
};

export function DataOrb({ heroIndex, dataIndex, count = 9000, colorCore, colorEdge }: Props) {
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.ShaderMaterial>(null);
  const morph = useRef(0);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const sphere = new Float32Array(count * 3);
    const scatter = new Float32Array(count * 3);
    const seeds = new Float32Array(count);

    // Fibonacci sphere — even coverage without the pole clustering you get
    // from naive lat/long sampling.
    const golden = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < count; i++) {
      const y = 1 - (i / (count - 1)) * 2;
      const radius = Math.sqrt(Math.max(0, 1 - y * y));
      const theta = golden * i;

      // Slight radial jitter gives the shell thickness.
      const r = 2.1 + Math.random() * 0.22;
      sphere[i * 3] = Math.cos(theta) * radius * r;
      sphere[i * 3 + 1] = y * r;
      sphere[i * 3 + 2] = Math.sin(theta) * radius * r;

      // Target shape: a correlated 3D scatter — it should look like data,
      // not like static. Two loose clusters along a diagonal trend.
      const cluster = Math.random() < 0.55 ? -1 : 1;
      const t = Math.random();
      const gauss = () =>
        (Math.random() + Math.random() + Math.random() + Math.random() - 2) * 0.55;
      scatter[i * 3] = (t * 5.6 - 2.8) + gauss() * 0.5;
      scatter[i * 3 + 1] = (t * 3.4 - 1.7) * cluster * 0.8 + gauss() * 0.8;
      scatter[i * 3 + 2] = gauss() * 1.4 + cluster * 0.6;

      seeds[i] = Math.random();
    }

    geo.setAttribute('position', new THREE.BufferAttribute(sphere, 3));
    geo.setAttribute('aScatter', new THREE.BufferAttribute(scatter, 3));
    geo.setAttribute('aSeed', new THREE.BufferAttribute(seeds, 1));
    geo.computeBoundingSphere();
    return geo;
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMorph: { value: 0 },
      uAmplitude: { value: 0.28 },
      uSize: { value: 2.4 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      uOpacity: { value: 1 },
      uCursor: { value: new THREE.Vector2(0, 0) },
      uCursorStrength: { value: 0 },
      uColorCore: { value: new THREE.Color(colorCore) },
      uColorEdge: { value: new THREE.Color(colorEdge) },
    }),
    // Colours are updated imperatively below — rebuilding the uniform object
    // would force a shader recompile on every theme toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Theme changes only touch the uniform values, so the compiled program and
  // the 9k-point geometry are both retained across a toggle.
  useEffect(() => {
    uniforms.uColorCore.value.set(colorCore);
    uniforms.uColorEdge.value.set(colorEdge);
  }, [colorCore, colorEdge, uniforms]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    if (material.current) {
      material.current.uniforms.uTime.value += dt;

      // Morph tracks how far we are between the hero and the data station.
      const span = dataIndex - heroIndex;
      const raw = THREE.MathUtils.clamp((scrollState.position - heroIndex) / span, 0, 1);
      morph.current = damp(morph.current, raw, 4, dt);
      material.current.uniforms.uMorph.value = morph.current;

      // Calm the noise as it becomes a scatter plot — data points don't wobble.
      material.current.uniforms.uAmplitude.value = 0.28 * (1 - morph.current * 0.75);

      // Visible around both of its stations, faded out everywhere else.
      const vis = Math.max(sectionWeight(heroIndex, 1.4), sectionWeight(dataIndex, 1.4));
      material.current.uniforms.uOpacity.value = damp(
        material.current.uniforms.uOpacity.value,
        Math.max(vis, 0.05),
        5,
        dt,
      );

      // Cursor reaction. Map the pointer (-1..1) into the orb's view plane and
      // damp toward it so the cloud follows the cursor smoothly rather than
      // snapping. Strongest on the hero, easing off as it becomes a scatter
      // plot (data points shouldn't be swattable) and as it scrolls away.
      const cur = material.current.uniforms.uCursor.value as THREE.Vector2;
      cur.x = damp(cur.x, scrollState.pointer.x * 2.6, 6, dt);
      cur.y = damp(cur.y, scrollState.pointer.y * 2.6, 6, dt);
      const heroVis = sectionWeight(heroIndex, 1.2);
      material.current.uniforms.uCursorStrength.value = damp(
        material.current.uniforms.uCursorStrength.value,
        heroVis * (1 - morph.current) * 0.7,
        5,
        dt,
      );
    }

    if (points.current) {
      points.current.rotation.y += dt * 0.05 * (1 - morph.current * 0.8);
      points.current.rotation.x = Math.sin(performance.now() * 0.0001) * 0.1;
      // Drift toward the Data Science station as the morph completes.
      points.current.position.z = -28 * morph.current;
    }
  });

  return (
    <points ref={points} geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={material}
        vertexShader={orbVertexShader}
        fragmentShader={orbFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
