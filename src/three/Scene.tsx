import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { AdaptiveDpr, AdaptiveEvents, Environment, Lightformer, Preload } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import * as THREE from 'three';

import { CameraRig } from './CameraRig';
import { Starfield } from './Starfield';
import { FlowField } from './FlowField';
import { DataOrb } from './DataOrb';
import { TerrainGrid } from './TerrainGrid';
import { GlassShards } from './GlassShards';
import { Lattice } from './Lattice';
import { Halo } from './Halo';
import { stations } from '../data/sections';
import type { DeviceProfile } from '../lib/useDeviceTier';
import { scenePalette, type Theme } from '../lib/theme';

/** Section indices — must match the order in src/data/sections.ts. */
const IDX = {
  hero: 0,
  paths: 1,
  about: 2,
  dataScience: 3,
  gis: 4,
  design: 5,
  skills: 6,
  contact: 7,
} as const;

export function Scene({ device, theme }: { device: DeviceProfile; theme: Theme }) {
  const palette = scenePalette[theme];
  const isLight = theme === 'light';

  return (
    <Canvas
      dpr={device.dpr}
      gl={{
        antialias: device.tier === 'high',
        alpha: true,
        powerPreference: 'high-performance',
        stencil: false,
        depth: true,
      }}
      camera={{ fov: 55, near: 0.1, far: 160, position: [0, 0, 7] }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      {/* Fog is declarative so it follows the theme. It does the heavy lifting
          for depth: objects at other stations dissolve into the background
          instead of popping in and out. */}
      <fogExp2 attach="fog" args={[palette.fog, 0.022]} />

      <Suspense fallback={null}>
        <CameraRig />

        <ambientLight intensity={isLight ? 0.7 : 0.35} />
        <directionalLight position={[5, 8, 6]} intensity={1.1} color={palette.keyLight} />
        <directionalLight
          position={[-6, -3, -4]}
          intensity={isLight ? 0.3 : 0.5}
          color={palette.orbCore}
        />

        {/* Environment built from in-scene light cards rather than a preset:
            drei's presets fetch an HDR from an external CDN at runtime, which
            adds a megabyte and a third-party dependency for what is, here,
            just "something for the glass to reflect". `frames={1}` bakes it
            once instead of re-rendering the probe every frame. */}
        {device.transmission && (
          <Environment resolution={128} frames={1}>
            <Lightformer
              intensity={isLight ? 3 : 2.2}
              position={[0, 4, -6]}
              scale={[12, 12, 1]}
              color={palette.keyLight}
            />
            <Lightformer intensity={1.4} position={[-6, 1, 2]} scale={[8, 8, 1]} color="#b58863" />
            <Lightformer intensity={1.1} position={[6, -2, 1]} scale={[8, 8, 1]} color="#3d4d55" />
          </Environment>
        )}

        <Starfield
          count={Math.round(2200 * device.particleScale)}
          color={palette.star}
        />

        {/* The opening background: continuously flowing contours. Animates on
            its own clock, so the cover is alive before you touch anything. */}
        <FlowField
          sectionIndex={IDX.hero}
          position={stations.hero}
          colorInk={palette.terrainLine}
          colorDeep={palette.terrainLow}
          colorHigh={palette.terrainHigh}
          octaves={device.tier === 'high' ? 5 : device.tier === 'medium' ? 4 : 3}
        />

        {/* Hero → Data Science: one object that morphs between both stations. */}
        <DataOrb
          heroIndex={IDX.hero}
          dataIndex={IDX.dataScience}
          count={Math.round(9000 * device.particleScale)}
          colorCore={palette.orbCore}
          colorEdge={palette.orbEdge}
        />

        {/* Career Paths gets a warm halo — the 3D echo of the lamp that
            lights that section in the DOM. */}
        <Halo
          sectionIndex={IDX.paths}
          position={stations.paths}
          color={palette.orbCore}
          scale={0.9}
        />

        <Halo sectionIndex={IDX.about} position={stations.about} color={palette.halo} />

        <TerrainGrid
          sectionIndex={IDX.gis}
          position={stations.gis}
          segments={device.tier === 'high' ? 220 : device.tier === 'medium' ? 140 : 80}
          colorLow={palette.terrainLow}
          colorHigh={palette.terrainHigh}
          colorLine={palette.terrainLine}
        />

        <GlassShards
          sectionIndex={IDX.design}
          position={stations.design}
          useTransmission={device.transmission}
        />

        <Lattice
          sectionIndex={IDX.skills}
          position={stations.skills}
          nodeColor={palette.lattice}
          linkColor={palette.latticeLink}
        />

        <Halo
          sectionIndex={IDX.contact}
          position={stations.contact}
          color={palette.orbCore}
          scale={1.2}
        />

        {device.postProcessing && (
          <EffectComposer multisampling={0} enableNormalPass={false}>
            <Bloom
              // Light mode has far less headroom above the threshold, so bloom
              // is pulled back hard — at dark-mode settings it turns the pale
              // background into a milky wash.
              intensity={isLight ? 0.18 : 0.55}
              luminanceThreshold={isLight ? 0.75 : 0.25}
              luminanceSmoothing={0.5}
              mipmapBlur
            />
            <ChromaticAberration
              blendFunction={BlendFunction.NORMAL}
              offset={new THREE.Vector2(0.0004, 0.0006)}
              radialModulation={false}
              modulationOffset={0}
            />
            <Vignette eskil={false} offset={0.22} darkness={isLight ? 0.35 : 0.75} />
          </EffectComposer>
        )}

        <Preload all />
      </Suspense>

      {/* Drop resolution rather than frames when the GPU falls behind. */}
      <AdaptiveDpr pixelated />
      <AdaptiveEvents />
    </Canvas>
  );
}
