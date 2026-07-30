import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { simplex3d } from './glsl/noise';
import { scrollState, sectionWeight, damp } from '../lib/scroll';

/* --------------------------------------------------------------------------
 *  FLOW FIELD — the opening background.
 *
 *  Replaces the drifting-dust opener, which had no motion of its own: dust
 *  only moved when *you* scrolled, so a stationary visitor saw a still image.
 *
 *  This is living topography. A domain-warped noise field is contoured into
 *  bands the way an elevation map is, then the warp itself is animated, so
 *  the contours continuously flow, split and merge. It reads as spatial data
 *  and as water at the same time — which is exactly the overlap this
 *  portfolio sits in — and it never stops moving.
 *
 *  Everything is one full-screen-ish plane and one draw call. The cost is
 *  entirely in the fragment shader, so it scales with resolution rather than
 *  with geometry, and drops out cleanly on low tiers via `octaves`.
 * ------------------------------------------------------------------------ */

export const flowVertexShader = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const flowFragmentShader = /* glsl */ `
uniform float uTime;
uniform float uOpacity;
uniform float uAspect;
uniform vec2  uPointer;
uniform vec3  uInk;      // contour line colour
uniform vec3  uDeep;     // low ground
uniform vec3  uHigh;     // high ground / accent
uniform int   uOctaves;

varying vec2 vUv;

${simplex3d}

/** fbm with a controllable octave count, so low-end devices pay less. */
float fbmN(vec3 p, int octaves) {
  float f = 0.0, a = 0.5;
  for (int i = 0; i < 6; i++) {
    if (i >= octaves) break;
    f += a * snoise(p);
    p *= 2.03;
    a *= 0.5;
  }
  return f;
}

void main() {
  // Correct for viewport aspect so the field never looks stretched.
  vec2 p = vUv - 0.5;
  p.x *= uAspect;

  float t = uTime * 0.045;

  // --- Domain warp -------------------------------------------------------
  // Two chained warps. One alone gives smooth blobs; chaining produces the
  // folded, braided structure that makes the contours look like a current
  // rather than a lava lamp.
  vec3 q = vec3(p * 1.6, t);
  vec2 warp1 = vec2(fbmN(q, uOctaves), fbmN(q + vec3(5.2, 1.3, 0.0), uOctaves));

  vec3 r = vec3(p * 1.6 + warp1 * 0.9, t * 1.3);
  vec2 warp2 = vec2(fbmN(r + vec3(1.7, 9.2, 0.0), uOctaves),
                    fbmN(r + vec3(8.3, 2.8, 0.0), uOctaves));

  // The pointer pushes the field very slightly — enough to feel alive on
  // hover without becoming a toy.
  vec2 pointerPush = uPointer * 0.06;

  float h = fbmN(vec3(p * 1.6 + warp2 * 1.1 + pointerPush, t * 0.8), uOctaves);
  h = h * 0.5 + 0.5;

  // --- Contour banding ---------------------------------------------------
  // fwidth keeps the line one pixel wide wherever the gradient is steep or
  // shallow, so lines stay crisp without aliasing into moiré.
  float spacing = 0.055;
  float band = h / spacing;
  float edge = abs(fract(band) - 0.5);
  float line = 1.0 - smoothstep(0.0, fwidth(band) * 1.6, edge);

  // Every fifth contour is an index line, drawn heavier — standard
  // cartographic convention, and it gives the field a visual hierarchy.
  float majorBand = h / (spacing * 5.0);
  float majorEdge = abs(fract(majorBand) - 0.5);
  float majorLine = 1.0 - smoothstep(0.0, fwidth(majorBand) * 1.6, majorEdge);

  // --- Colour ------------------------------------------------------------
  vec3 ground = mix(uDeep, uHigh, smoothstep(0.25, 0.85, h));
  vec3 color = ground;
  color = mix(color, uInk, line * 0.35);
  color = mix(color, uInk, majorLine * 0.6);

  // Radial falloff so the field has no visible edges and sits behind the
  // type rather than competing with it.
  float d = length(vec2(p.x / uAspect, p.y)) * 2.0;
  float vignette = 1.0 - smoothstep(0.35, 1.05, d);

  float alpha = uOpacity * vignette * (0.16 + line * 0.5 + majorLine * 0.6);

  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
}
`;

export function FlowField({
  sectionIndex,
  position,
  colorInk,
  colorDeep,
  colorHigh,
  octaves = 4,
}: {
  sectionIndex: number;
  position: [number, number, number];
  colorInk: string;
  colorDeep: string;
  colorHigh: string;
  octaves?: number;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uOpacity: { value: 0 },
      uAspect: { value: 1 },
      uPointer: { value: new THREE.Vector2() },
      uOctaves: { value: octaves },
      uInk: { value: new THREE.Color(colorInk) },
      uDeep: { value: new THREE.Color(colorDeep) },
      uHigh: { value: new THREE.Color(colorHigh) },
    }),
    // Values are updated imperatively below; rebuilding this object would
    // force a shader recompile on every theme toggle.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    uniforms.uInk.value.set(colorInk);
    uniforms.uDeep.value.set(colorDeep);
    uniforms.uHigh.value.set(colorHigh);
    uniforms.uOctaves.value = octaves;
  }, [colorInk, colorDeep, colorHigh, octaves, uniforms]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1);
    const m = material.current;
    if (!m) return;

    m.uniforms.uTime.value += dt;
    m.uniforms.uAspect.value = state.viewport.aspect;
    m.uniforms.uPointer.value.set(scrollState.pointer.x, scrollState.pointer.y);

    // Present at the opening and fading out as you leave it. A wide falloff
    // so it lingers behind the second section rather than cutting.
    const target = Math.max(sectionWeight(sectionIndex, 1.8), 0);
    m.uniforms.uOpacity.value = damp(m.uniforms.uOpacity.value, target, 3, dt);

    if (mesh.current) mesh.current.visible = m.uniforms.uOpacity.value > 0.01;
  });

  return (
    <mesh ref={mesh} position={position} frustumCulled={false}>
      <planeGeometry args={[34, 22]} />
      <shaderMaterial
        ref={material}
        vertexShader={flowVertexShader}
        fragmentShader={flowFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
