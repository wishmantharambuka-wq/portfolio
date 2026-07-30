import { useEffect, useRef, useState } from 'react';
import {
  verify,
  signIn,
  lockoutRemaining,
  usingDefaultPassword,
  hasConfiguredPassword,
} from '../../lib/adminAuth';
import { navigate } from '../../lib/router';

/**
 * Sign-in screen for the admin panel.
 *
 * See src/lib/adminAuth.ts for what this does and does not protect. Short
 * version: the real protection is that the panel isn't in the public build —
 * this gate is defence in depth, with a hashed password and a lockout so the
 * password can't be read from the bundle or guessed by hand.
 */
export function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState(() => lockoutRemaining());
  const userRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    userRef.current?.focus();
  }, []);

  // Tick the cooldown down so the button re-enables on its own.
  useEffect(() => {
    if (locked <= 0) return;
    const id = window.setInterval(() => setLocked(lockoutRemaining()), 1000);
    return () => window.clearInterval(id);
  }, [locked]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || locked > 0) return;
    setBusy(true);
    setError('');

    const result = await verify(username, password);

    if (result.ok) {
      signIn();
      onSuccess();
      return;
    }

    setPassword('');
    setBusy(false);

    if (result.reason === 'locked') {
      setLocked(result.seconds);
      setError(`Too many attempts. Try again in ${result.seconds}s.`);
    } else if (result.reason === 'unconfigured') {
      setError('No admin password is configured. Run: npm run set-admin-password');
    } else {
      const wait = lockoutRemaining();
      setLocked(wait);
      setError(
        wait > 0
          ? `Incorrect. Too many attempts — locked for ${wait}s.`
          : 'Incorrect username or password.',
      );
    }
  };

  return (
    <div className="flex min-h-[100svh] items-center justify-center bg-ash-950 px-5 py-10">
      <div className="w-full max-w-sm">
        <button
          type="button"
          onClick={() => navigate('home')}
          className="mb-8 font-mono text-[11px] uppercase tracking-[0.2em] text-ash-400 transition hover:text-ash-50"
        >
          ← Back to site
        </button>

        <form onSubmit={submit} className="glass rounded-2xl p-6 sm:p-7">
          <h1 className="font-display text-xl font-semibold text-ash-50">Content admin</h1>
          <p className="mt-1.5 text-sm text-ash-400">Sign in to edit the site content.</p>

          <div className="mt-7 space-y-4">
            <div>
              <label htmlFor="admin-user" className="mb-1.5 block text-xs font-medium text-ash-300">
                Username
              </label>
              <input
                id="admin-user"
                ref={userRef}
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                className="field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="admin-pass" className="mb-1.5 block text-xs font-medium text-ash-300">
                Password
              </label>
              <input
                id="admin-pass"
                type="password"
                autoComplete="current-password"
                className="field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <p role="alert" className="mt-4 text-sm text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || locked > 0}
            className="btn-primary mt-6 w-full"
          >
            {locked > 0 ? `Locked — ${locked}s` : busy ? 'Checking…' : 'Sign in'}
          </button>

          {hasConfiguredPassword() && usingDefaultPassword() && (
            <div className="mt-5 rounded-lg border border-amber-500/25 bg-amber-500/[0.07] p-3 text-[12px] leading-relaxed text-amber-200/90">
              <strong className="text-amber-200">Still on the default password.</strong> Set your
              own — it takes one command:
              <code className="mt-1.5 block font-mono text-[11px] text-amber-100">
                npm run set-admin-password
              </code>
            </div>
          )}

          <p className="mt-5 border-t border-ash-700/60 pt-4 text-[11px] leading-relaxed text-ash-400">
            The password is stored as a PBKDF2 hash, never as plaintext, and repeated failures are
            locked out. Even so, a password checked in the browser is deterrence rather than real
            protection — which is why this panel is{' '}
            <strong className="text-ash-200">excluded from the public build</strong> by default.
            Nothing you do here reaches the live site until you publish from your own machine.
          </p>
        </form>
      </div>
    </div>
  );
}
