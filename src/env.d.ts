/// <reference types="vite/client" />

/**
 * Compile-time flag injected by vite.config.ts (`define`).
 *
 * Because it is substituted as a literal `true`/`false`, Rollup can eliminate
 * the admin branch in App.tsx when it's false — so the admin panel is absent
 * from the production bundle rather than merely disabled at runtime.
 */
declare const __ADMIN_ENABLED__: boolean;

interface ImportMetaEnv {
  /** Opt the admin panel into a production build. */
  readonly VITE_ENABLE_ADMIN?: string;
  /** Admin username (defaults to "admin"). */
  readonly VITE_ADMIN_USER?: string;
  /** PBKDF2 salt, base64 — see `npm run set-admin-password`. */
  readonly VITE_ADMIN_PW_SALT?: string;
  /** PBKDF2 hash, base64 — see `npm run set-admin-password`. */
  readonly VITE_ADMIN_PW_HASH?: string;
  /** Absolute site URL for Open Graph tags. */
  readonly VITE_SITE_URL?: string;
  /** Base path for subdirectory hosting (GitHub Pages project sites). */
  readonly VITE_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
