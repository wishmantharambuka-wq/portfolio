import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { simplex3d } from './glsl/noise';
import { sectionWeight, damp } from '../lib/scroll';

/**
 * The Geospatial station: a terrain surface drawn the way GIS actually draws
 * terrain — contour bands and a graticule over a hypsometric ramp, rather
 * than a generic shiny mesh. The elevation field is animated noise, so it
 * reads as "a surface being analysed" instead of a static model.
 */

export const terrainVertexShader = /* glsl */ `
uniform float uTime;
uniform float uHeight;

varying float vElevation;
varying vec2 vUv;

${simplex3d}

float terrain(vec2 p) {
  // Ridged noise for the mountain spine, plus a gentler basin layer.
  float ridge = 1.0 - abs(snoise(vec3(p * 0.28, uTime * 0.03)));
  ridge = pow(ridge, 2.4);
  float base = fbm(vec3(p * 0.16, uTime * 0.02)) * 0.6;
  return ridge * 0.7 + base;
}

void main() {
  vUv = uv;
  vec3 pos = position;
  float e = terrain(pos.xy);

  // Fade the surface to flat at the rim so it dissolves into the fog
  // instead of ending on a hard cut edge.
  float rim = 1.0 - smoothstep(0.55, 1.0, length(uv - 0.5) * 2.0);
  e *= rim;

  pos.z += e * uHeight;
  vElevation = e;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

export const terrainFragmentShader = /* glsl */ `
uniform vec3 uLow;
uniform vec3 uHigh;
uniform vec3 uLine;
uniform float uOpacity;

varying float vElevation;
varying vec2 vUv;

/** Anti-aliased periodic line — the standard fwidth trick. */
float band(float value, float spacing, float thickness) {
  float f = fract(value / spacing);
  float d = min(f, 1.0 - f) * spacing;
  return 1.0 - smoothstep(0.0, thickness + fwidth(value), d);
}

void main() {
  float e = clamp(vElevation, 0.0, 1.0);

  // Hypsometric ramp: low ground ash, high ground lime.
  vec3 base = mix(uLow, uHigh, smoothstep(0.05, 0.8, e));

  // Contour lines every 0.08 elevation units, with heavier index contours.
  float minor = band(e, 0.08, 0.002);
  float major = band(e, 0.32, 0.004);

  // Graticule — the map grid.
  float gx = band(vUv.x, 0.0625, 0.0004);
  float gy = band(vUv.y, 0.0625, 0.0004);
  float grid = max(gx, gy) * 0.22;

  vec3 color = base;
  color = mix(color, uLine, minor * 0.35);
  color = mix(color, uLine, major * 0.7);
  color = mix(color, uLine, grid);

  // Circular vignette so the tile has no visible boundary.
  float rim = 1.0 - smoothstep(0.45, 1.0, length(vUv - 0.5) * 2.0);
  float alpha = uOpacity * rim * (0.25 + e * 0.85);

  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
}
`;

export function TerrainGrid({
  sectionIndex,
  position,
  segments = 220,
  colorLow,
  colorHigh,
  colorLine,
}: {
  sectionIndex: number;
  position: [number, number, number];
  segments?: number;
  colorLow: string;
  colorHigh: string;
  colorLine: string;
}) {
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.ShaderMaterial>(null);

  const geometry = useMemo(
    () => new THREE.PlaneGeometry(26, 26, segments, segments),
    [segments],
  );

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uHeight: { value: 2.4 },
      uOpacity: { value: 0 },
      uLow: { value: new THREE.Color(colorLow) },
      uHigh: { value: new THREE.Color(colorHigh) },
      uLine: { value: new THREE.Color(colorLine) },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Update colours in place so a theme toggle doesn't recompile the shader.
  useEffect(() => {
    uniforms.uLow.value.set(colorLow);
    uniforms.uHigh.value.set(colorHigh);
    uniforms.uLine.value.set(colorLine);
  }, [colorLow, colorHigh, colorLine, uniforms]);

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    if (material.current) {
      material.current.uniforms.uTime.value += dt;
      // Capped well below 1: this sits directly behind the GIS project cards
      // and at full strength its contour lines read straight through them.
      // It's a backdrop, not a subject.
      material.current.uniforms.uOpacity.value = damp(
        material.current.uniforms.uOpacity.value,
        sectionWeight(sectionIndex, 1.3) * 0.42,
        4,
        dt,
      );
    }
    if (mesh.current) {
      mesh.current.rotation.z += dt * 0.012;
    }
  });

  return (
    <mesh
      ref={mesh}
      geometry={geometry}
      position={position}
      // Laid flat and tilted — a map table, not a wall.
      rotation={[-Math.PI / 2.35, 0, 0]}
      frustumCulled={false}
    >
      <shaderMaterial
        ref={material}
        vertexShader={terrainVertexShader}
        fragmentShader={terrainFragmentShader}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
