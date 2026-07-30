/* ==========================================================================
 *  ADMIN ACCESS
 *
 *  ── THE HONEST PICTURE ───────────────────────────────────────────────────
 *
 *  A static site has no server, so a password checked in the browser can
 *  never be real security: the check runs in JavaScript the visitor can read,
 *  and they can skip it by editing storage. Hardening the password does not
 *  change that.
 *
 *  So the actual protection is LAYER 1 — the admin panel is not in the
 *  public build at all:
 *
 *   1. NOT SHIPPED (real security).  `adminEnabled()` is false in production
 *      builds unless you opt in with VITE_ENABLE_ADMIN=true. With it off, the
 *      route refuses to render and the nav link is hidden, so there is
 *      nothing on the public site to attack. The panel is an authoring tool
 *      for your own machine — which is where it needs to be anyway, because
 *      publishing writes to your local repo and pushes from there.
 *
 *   2. HASHED PASSWORD (defence in depth).  When the panel *is* enabled, the
 *      password is verified against a PBKDF2-SHA-256 hash (600k iterations,
 *      random salt) instead of a plaintext string. The bundle therefore never
 *      contains the password itself. Someone determined can still bypass the
 *      gate — but they cannot read your password out of the source, which
 *      matters because people reuse passwords.
 *
 *   3. LOCKOUT.  Failed attempts are throttled with an escalating cooldown,
 *      which stops casual guessing.
 *
 *  Set your own password with:  npm run set-admin-password
 *  That prints VITE_ADMIN_PW_SALT / VITE_ADMIN_PW_HASH for `.env.local`
 *  (gitignored), so the values never enter git.
 * ========================================================================== */

const SESSION_KEY = 'portfolio:admin-session';
const ATTEMPTS_KEY = 'portfolio:admin-attempts';

const PBKDF2_ITERATIONS = 600_000;
const KEY_BITS = 256;

/* --------------------------- availability -------------------------------- */

/**
 * Is the admin panel part of this build?
 *
 * `__ADMIN_ENABLED__` is a compile-time constant (see vite.config.ts), so when
 * it is false Rollup drops the admin code from the bundle entirely — the panel
 * isn't disabled, it isn't there. This is the one measure here that is
 * genuinely security rather than deterrence.
 */
export function adminEnabled(): boolean {
  return __ADMIN_ENABLED__;
}

/* ------------------------------ credentials ------------------------------ */

const USERNAME = String(import.meta.env.VITE_ADMIN_USER ?? 'admin');

/**
 * Default credentials, used only when no VITE_ADMIN_PW_* values are supplied.
 * This is the PBKDF2 hash of "admin123" — the same weak default as before, but
 * at least not readable as plaintext. Replace it: npm run set-admin-password
 */
const DEFAULT_SALT = 'ZGV2LW9ubHktZGVmYXVsdC1zYWx0';
const DEFAULT_HASH = 'Mugp0DBY8Dc3qHSUPy8REly6BriEVq7yew+8OoYjjSo=';

const SALT_B64 = String(import.meta.env.VITE_ADMIN_PW_SALT ?? DEFAULT_SALT);
const HASH_B64 = String(import.meta.env.VITE_ADMIN_PW_HASH ?? DEFAULT_HASH);

/** True when a hash is available to check against at all. */
export function hasConfiguredPassword(): boolean {
  return HASH_B64.length > 0;
}

/**
 * True while the shipped fallback (admin/admin123) is still in use. The login
 * screen surfaces this so it can't be forgotten.
 */
export function usingDefaultPassword(): boolean {
  return HASH_B64 === DEFAULT_HASH;
}

/**
 * Returns an ArrayBuffer rather than a Uint8Array: WebCrypto's `salt` wants a
 * BufferSource backed by a plain ArrayBuffer, and a bare `new Uint8Array(n)` is
 * typed as possibly SharedArrayBuffer-backed, which TS rejects.
 */
function b64ToBuffer(b64: string): ArrayBuffer {
  const bin = atob(b64);
  const buf = new ArrayBuffer(bin.length);
  const view = new Uint8Array(buf);
  for (let i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
  return buf;
}

function bytesToB64(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

/** PBKDF2-SHA-256 → base64. Shared with the password-generator script. */
export async function deriveHash(password: string, saltB64: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: b64ToBuffer(saltB64),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    key,
    KEY_BITS,
  );
  return bytesToB64(new Uint8Array(bits));
}

/** Constant-time-ish comparison, so timing doesn't leak the hash. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/* ------------------------------- lockout -------------------------------- */

type Attempts = { count: number; until: number };

function readAttempts(): Attempts {
  try {
    const raw = localStorage.getItem(ATTEMPTS_KEY);
    if (!raw) return { count: 0, until: 0 };
    return { count: 0, until: 0, ...(JSON.parse(raw) as Partial<Attempts>) };
  } catch {
    return { count: 0, until: 0 };
  }
}

function writeAttempts(a: Attempts) {
  try {
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(a));
  } catch {
    /* ignore */
  }
}

/** Seconds remaining in a cooldown, or 0 if sign-in is allowed. */
export function lockoutRemaining(): number {
  const { until } = readAttempts();
  const ms = until - Date.now();
  return ms > 0 ? Math.ceil(ms / 1000) : 0;
}

function recordFailure() {
  const a = readAttempts();
  const count = a.count + 1;
  // First 3 tries free, then 15s, 60s, 300s, 900s.
  const ladder = [0, 0, 0, 15, 60, 300, 900];
  const wait = ladder[Math.min(count, ladder.length - 1)];
  writeAttempts({ count, until: wait ? Date.now() + wait * 1000 : 0 });
}

function clearFailures() {
  try {
    localStorage.removeItem(ATTEMPTS_KEY);
  } catch {
    /* ignore */
  }
}

/* ------------------------------- sign-in -------------------------------- */

export type VerifyResult =
  | { ok: true }
  | { ok: false; reason: 'locked'; seconds: number }
  | { ok: false; reason: 'bad' }
  | { ok: false; reason: 'unconfigured' };

export async function verify(username: string, password: string): Promise<VerifyResult> {
  const locked = lockoutRemaining();
  if (locked > 0) return { ok: false, reason: 'locked', seconds: locked };

  if (!hasConfiguredPassword()) {
    // Nothing to check against. Refuse rather than let anyone in.
    return { ok: false, reason: 'unconfigured' };
  }

  const userOk = username.trim().toLowerCase() === USERNAME.toLowerCase();
  let passOk = false;
  try {
    passOk = safeEqual(await deriveHash(password, SALT_B64), HASH_B64);
  } catch {
    passOk = false;
  }

  // Evaluate both before returning so a wrong username and a wrong password
  // are indistinguishable.
  if (userOk && passOk) {
    clearFailures();
    return { ok: true };
  }
  recordFailure();
  return { ok: false, reason: 'bad' };
}

export function isSignedIn(): boolean {
  if (!adminEnabled()) return false;
  try {
    return sessionStorage.getItem(SESSION_KEY) === 'ok';
  } catch {
    return false;
  }
}

export function signIn() {
  try {
    sessionStorage.setItem(SESSION_KEY, 'ok');
  } catch {
    /* private browsing — the session just won't survive a reload */
  }
}

export function signOut() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* nothing to do */
  }
}
