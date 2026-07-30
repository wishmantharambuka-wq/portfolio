import { useCallback, useState } from 'react';
import { Scene } from './three/Scene';
import { Loader } from './components/Loader';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { CareerPaths } from './components/CareerPaths';
import { About } from './components/About';
import { DataScienceSection, GisSection } from './components/Work';
import { DesignSection } from './components/Design';
import { SkillsSection } from './components/Skills';
import { ContactSection } from './components/Contact';
import { CVPage } from './routes/CV';
import { AdminPage } from './routes/admin/Admin';
import { WorkPortal } from './routes/WorkPortal';
import { useSmoothScroll } from './lib/useSmoothScroll';
import { useDeviceTier } from './lib/useDeviceTier';
import { ThemeProvider, useTheme } from './lib/theme';
import { ContentProvider } from './lib/contentStore';
import { useLocation, type WorkCategory } from './lib/router';
import { RouteTransition } from './components/RouteTransition';

export default function App() {
  return (
    <ThemeProvider>
      <ContentProvider>
        <Router />
      </ContentProvider>
    </ThemeProvider>
  );
}

function Router() {
  const loc = useLocation();
  // The key changes on route AND category, so the curtain also plays when
  // moving between category portals.
  const key = loc.route === 'work' ? `work/${loc.category}` : loc.route;
  return <RouteTransition routeKey={key} render={renderKey} />;
}

/**
 * The 3D scene and smooth scrolling belong to the home route only. CV and
 * admin are documents — mounting a WebGL context behind them would burn
 * battery for no benefit, and Lenis would fight the admin form scrolling.
 */
function renderKey(key: string) {
  if (key === 'cv') return <CVPage />;
  if (key === 'admin') return <AdminPage />;
  if (key.startsWith('work/')) {
    return <WorkPortal category={key.slice('work/'.length) as WorkCategory} />;
  }
  return <Home />;
}

function Home() {
  const device = useDeviceTier();
  const { theme } = useTheme();
  const [ready, setReady] = useState(false);

  // Smooth scrolling is the delivery mechanism for the whole 3D sequence,
  // so it's disabled on reduced-motion rather than merely shortened.
  useSmoothScroll(!device.reducedMotion);

  const onLoaderDone = useCallback(() => setReady(true), []);

  return (
    <div className="grain relative">
      {!ready && <Loader onDone={onLoaderDone} />}

      {/* The 3D scene sits behind everything, fixed, and never scrolls
          itself — the camera moves instead. */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <Scene device={device} theme={theme} />
      </div>

      {/* A soft scrim keeps text legible over bright parts of the scene
          without flattening the 3D behind it. */}
      <div
        className="pointer-events-none fixed inset-0 z-[1]"
        aria-hidden
        style={{
          background:
            'linear-gradient(to bottom, rgb(var(--ash-950) / var(--scrim-alpha)), rgb(var(--ash-950) / calc(var(--scrim-alpha) * 0.45)), rgb(var(--ash-950) / calc(var(--scrim-alpha) * 1.25)))',
        }}
      />

      <Nav />

      <main className="relative z-10">
        <Hero ready={ready} />
        <CareerPaths />
        <About />
        <DataScienceSection />
        <GisSection />
        <DesignSection />
        <SkillsSection />
        <ContactSection />
      </main>
    </div>
  );
}
