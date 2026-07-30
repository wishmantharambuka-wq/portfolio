import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Absolute site URL, injected into the Open Graph tags in index.html as
 * %VITE_SITE_URL%. Social scrapers don't run JS, so og:image/og:url must be
 * absolute.
 *
 * Resolution order:
 *   1. VITE_SITE_URL — set it explicitly once you have a custom domain.
 *   2. VERCEL_PROJECT_PRODUCTION_URL — Vercel's stable production domain, so
 *      preview deploys still advertise the production URL rather than their
 *      own throwaway one.
 *   3. VERCEL_URL — per-deployment domain (fallback).
 *   4. left unset — local dev; the %VITE_SITE_URL% literal stays, which is
 *      harmless because scrapers only ever hit the deployed site.
 */
function resolveSiteUrl(): string | undefined {
  const explicit = process.env.VITE_SITE_URL;
  if (explicit) return explicit.endsWith('/') ? explicit : `${explicit}/`;

  const vercelHost = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  if (vercelHost) return `https://${vercelHost}/`;

  return undefined;
}

export default defineConfig(({ command }) => {
  const isDev = command === 'serve';

  // Base path. Vercel (and any root-domain host) serves from '/', the default.
  // The GitHub Pages workflow sets VITE_BASE to '/<repo>/' because project
  // pages live in a subdirectory.
  const base = process.env.VITE_BASE ?? '/';

  // Set before the HTML transform reads env for %VITE_SITE_URL%.
  const siteUrl = resolveSiteUrl();
  if (siteUrl) process.env.VITE_SITE_URL = siteUrl;

  /**
   * Is the admin panel part of this build?
   *
   * Dev: always. Production: only with VITE_ENABLE_ADMIN=true.
   *
   * This is a compile-time constant on purpose. Because `__ADMIN_ENABLED__`
   * is substituted literally, Rollup can prove the admin branch in App.tsx is
   * dead and drop the dynamic import entirely — so the panel's code is not
   * merely disabled in production, it is *not shipped*. That is the difference
   * between deterrence and actually removing the attack surface (and it keeps
   * the editor's weight off every visitor's first load).
   */
  const adminEnabled =
    isDev || String(process.env.VITE_ENABLE_ADMIN ?? '').toLowerCase() === 'true';

  if (!isDev) {
    console.log(`[build] admin panel: ${adminEnabled ? 'INCLUDED' : 'excluded'}`);
  }

  return {
    base,
    plugins: [react()],
    define: {
      __ADMIN_ENABLED__: JSON.stringify(adminEnabled),
    },
    build: {
      target: 'es2020',
      chunkSizeWarningLimit: 1200,
      rollupOptions: {
        output: {
          manualChunks: {
            three: ['three'],
            r3f: ['@react-three/fiber', '@react-three/drei', '@react-three/postprocessing'],
          },
        },
      },
    },
  };
});
