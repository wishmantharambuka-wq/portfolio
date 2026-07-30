import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Base path. Vercel (and any root-domain host) serves from '/', which is the
// default. The GitHub Pages workflow sets VITE_BASE to '/<repo>/' because
// project pages are served from a subdirectory.
const base = process.env.VITE_BASE ?? '/';

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

// Set before defineConfig so it is in place by the time Vite loads env for the
// index.html %VITE_SITE_URL% substitution.
const siteUrl = resolveSiteUrl();
if (siteUrl) process.env.VITE_SITE_URL = siteUrl;

export default defineConfig({
  base,
  plugins: [react()],
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
});
