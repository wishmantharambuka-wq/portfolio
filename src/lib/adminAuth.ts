/* ==========================================================================
 *  ADMIN SIGN-IN
 *
 *  ⚠️  READ THIS BEFORE RELYING ON IT.
 *
 *  This is a LOCK ON A DOOR IN A GLASS HOUSE. It is obscurity, not security,
 *  and it cannot be made into security on a static site:
 *
 *    • The credentials below ship inside the JavaScript bundle. Anyone can
 *      read them with View Source or DevTools in about ten seconds.
 *    • There is no server, so there is nothing to verify a password against.
 *    • Anyone can bypass the check entirely by editing localStorage.
 *
 *  It is fine here, because the admin panel has nothing worth stealing: it
 *  only edits the visitor's OWN browser copy of the content. Someone who
 *  defeats this gate can change what they personally see and nothing else.
 *  What the public sees changes only when you commit public/content.json,
 *  which requires access to your GitHub repository — that is the real
 *  security boundary, and it is not in this file.
 *
 *  So: use this to keep the panel out of the way of casual visitors. Do NOT
 *  reuse this password anywhere that matters, and do not put anything
 *  sensitive behind it.
 * ========================================================================== */

const USERNAME = 'admin';
const PASSWORD = 'admin123';

/** Session-scoped so closing the tab signs you out. */
const SESSION_KEY = 'portfolio:admin-session';

export function verify(username: string, password: string): boolean {
  return username.trim() === USERNAME && password === PASSWORD;
}

export function isSignedIn(): boolean {
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
    /* private browsing — the session simply won't persist across reloads */
  }
}

export function signOut() {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* nothing to do */
  }
}
