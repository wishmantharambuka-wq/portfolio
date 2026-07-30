import { useEffect, useRef, useState } from 'react';
import { verify, signIn } from '../../lib/adminAuth';
import { navigate } from '../../lib/router';

/**
 * Sign-in screen for the admin panel.
 *
 * See src/lib/adminAuth.ts for what this does and does not protect — short
 * version: it keeps casual visitors out of the editor, and that is all it
 * can do on a static site.
 */
export function AdminLogin({ onSuccess }: { onSuccess: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const userRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    userRef.current?.focus();
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');

    // Small delay so a wrong password doesn't flash instantly — and so
    // hammering the form isn't free.
    window.setTimeout(() => {
      if (verify(username, password)) {
        signIn();
        onSuccess();
      } else {
        setError('Incorrect username or password.');
        setPassword('');
        setBusy(false);
      }
    }, 350);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-ash-950 px-5">
      <div className="w-full max-w-sm">
        <button
          type="button"
          onClick={() => navigate('home')}
          className="mb-8 font-mono text-[11px] uppercase tracking-[0.2em] text-ash-400 transition hover:text-ash-50"
        >
          ← Back to site
        </button>

        <form onSubmit={submit} className="glass rounded-2xl p-7">
          <h1 className="font-display text-xl font-semibold text-ash-50">Content admin</h1>
          <p className="mt-1.5 text-sm text-ash-400">Sign in to edit the site content.</p>

          <div className="mt-7 space-y-4">
            <div>
              <label
                htmlFor="admin-user"
                className="mb-1.5 block text-xs font-medium text-ash-300"
              >
                Username
              </label>
              <input
                id="admin-user"
                ref={userRef}
                type="text"
                autoComplete="username"
                className="field"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label
                htmlFor="admin-pass"
                className="mb-1.5 block text-xs font-medium text-ash-300"
              >
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

          <button type="submit" disabled={busy} className="btn-primary mt-6 w-full">
            {busy ? 'Checking…' : 'Sign in'}
          </button>

          <p className="mt-6 border-t border-ash-700/60 pt-4 text-[11px] leading-relaxed text-ash-400">
            <strong className="text-ash-200">This is not real security.</strong> On a static
            site the password ships in the page source, so treat it as a way to keep the
            editor out of the way — not as protection. Nothing sensitive sits behind it: the
            panel only edits your own browser&apos;s copy, and publishing still requires a
            commit to your repository.
          </p>
        </form>
      </div>
    </div>
  );
}
