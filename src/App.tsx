import { Suspense, lazy, useCallback, useState } from 'react';
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
 * Admin is lazy-loaded *inside* a `__ADMIN_ENABLED__` guard. That constant is
 * substituted at build time, so when it's false Rollup proves this branch dead
 * and never emits the admin chunk — the editor is absent from the public
 * bundle, not just switched off. It also keeps the editor's weight out of every
 * visitor's first load.
 */
const AdminPage = lazy(() => import('./routes/admin/Admin').then((m) => ({ default: m.AdminPage })));

/**
 * The 3D scene and smooth scrolling belong to the home route only. CV and
 * admin are documents — mounting a WebGL context behind them would burn
 * battery for no benefit, and Lenis would fight the admin form scrolling.
 */
function renderKey(key: string) {
  if (key === 'cv') return <CVPage />;
  if (key === 'admin') {
    if (!__ADMIN_ENABLED__) return <AdminNotShipped />;
    return (
      <Suspense fallback={<RouteFallback />}>
        <AdminPage />
      </Suspense>
    );
  }
  if (key.startsWith('work/')) {
    return <WorkPortal category={key.slice('work/'.length) as WorkCategory} />;
  }
  return <Home />;
}

function RouteFallback() {
  return <div className="min-h-[100svh] bg-ash-950" />;
}

/** Shown when someone guesses /#/admin on a build that excludes the editor. */
function AdminNotShipped() {
  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-ash-950 px-6 text-center">
      <div className="max-w-sm">
        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-ash-500">
          Not available
        </p>
        <h1 className="mt-3 font-display text-2xl font-semibold text-ash-50">
          The editor isn&apos;t part of this site
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ash-400">
          Content is authored locally and published by pushing to the repository, so the admin
          panel is deliberately left out of the public build.
        </p>
        <a href="#/" className="btn-primary mt-6 inline-flex">
          Back to the portfolio
        </a>
      </div>
    </div>
  );
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
