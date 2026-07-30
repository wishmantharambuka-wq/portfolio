/* ==========================================================================
 *  ONE-CLICK DEPLOY  —  commit content.json straight from the admin panel.
 *
 *  How it works:
 *    admin edit  →  Deploy  →  PUT public/content.json via the GitHub
 *    Contents API  →  the host (Vercel / GitHub Pages) sees the commit and
 *    rebuilds  →  live site updated.
 *
 *  No terminal, no VS Code, no local git.
 *
 *  ── SECURITY, PLAINLY ────────────────────────────────────────────────────
 *  This needs a GitHub token, and that token lives in this browser's
 *  localStorage. There is no server to hide it in — that is the honest cost
 *  of a static site with in-browser publishing.
 *
 *  To keep the blast radius small, the token MUST be a *fine-grained* PAT:
 *      • Repository access: ONLY the portfolio repo
 *      • Permissions:       Contents → Read and write   (nothing else)
 *      • Expiration:        set one (90 days is sensible)
 *
 *  Worst case if that token leaks, someone can edit files in that ONE repo.
 *  They cannot touch your other repos, your account, or anything private.
 *  Never paste a *classic* token here — those are account-wide.
 *
 *  The token is stored under its own localStorage key, is never written into
 *  content.json, and is never logged. `forgetToken()` removes it.
 * ========================================================================== */

const TOKEN_KEY = 'portfolio:deploy:token';
const CONFIG_KEY = 'portfolio:deploy:config';

export type DeployConfig = {
  owner: string;
  repo: string;
  branch: string;
  path: string;
};

export const defaultDeployConfig: DeployConfig = {
  owner: '',
  repo: '',
  branch: 'main',
  path: 'public/content.json',
};

/* ------------------------------ storage --------------------------------- */

export function loadConfig(): DeployConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (!raw) return { ...defaultDeployConfig };
    return { ...defaultDeployConfig, ...(JSON.parse(raw) as Partial<DeployConfig>) };
  } catch {
    return { ...defaultDeployConfig };
  }
}

export function saveConfig(config: DeployConfig) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch {
    /* private browsing — settings just won't persist */
  }
}

export function loadToken(): string {
  try {
    return localStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    return '';
  }
}

export function saveToken(token: string) {
  try {
    localStorage.setItem(TOKEN_KEY, token.trim());
  } catch {
    /* ignore */
  }
}

export function forgetToken() {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function hasToken(): boolean {
  return loadToken().length > 0;
}

/** Never render a token in full. */
export function maskToken(token: string): string {
  if (!token) return '';
  if (token.length <= 12) return '••••••••';
  return `${token.slice(0, 7)}…${token.slice(-4)}`;
}

/* ------------------------------ helpers --------------------------------- */

/**
 * UTF-8 safe base64. `btoa` alone throws on characters outside Latin-1, and
 * the content is full of them (em dashes, ², ‘smart’ quotes), so encode to
 * UTF-8 bytes first.
 */
function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  const CHUNK = 0x8000; // avoid blowing the argument limit on large files
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

const API = 'https://api.github.com';

function headers(token: string) {
  return {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'X-GitHub-Api-Version': '2022-11-28',
    'Content-Type': 'application/json',
  };
}

/** Turn an API failure into something a human can act on. */
async function describeError(res: Response): Promise<string> {
  let detail = '';
  try {
    const body = (await res.json()) as { message?: string };
    detail = body.message ?? '';
  } catch {
    /* non-JSON body */
  }

  switch (res.status) {
    case 401:
      return 'Token rejected (401). It may be expired, mistyped, or revoked — generate a new fine-grained token.';
    case 403:
      return `Forbidden (403). The token is valid but lacks permission. Check it grants "Contents: Read and write" on this repo.${detail ? ` — ${detail}` : ''}`;
    case 404:
      return 'Not found (404). Check the owner and repo names, that the branch exists, and that the token can access this repository.';
    case 409:
      return 'Conflict (409). The file changed on GitHub since this page loaded. Click Deploy again to retry with the latest version.';
    case 422:
      return `Rejected (422). ${detail || 'The branch or file path may be invalid.'}`;
    default:
      return `GitHub returned ${res.status}. ${detail}`;
  }
}

/* ------------------------------- API ------------------------------------ */

export type ConnectionInfo = {
  repoFullName: string;
  defaultBranch: string;
  canWrite: boolean;
  fileExists: boolean;
};

/**
 * Read-only check: confirms the token can see the repo, reports whether it can
 * write, and whether content.json already exists. Safe to run any time.
 */
export async function testConnection(
  config: DeployConfig,
  token: string,
): Promise<ConnectionInfo> {
  const { owner, repo, branch, path } = config;
  if (!owner || !repo) throw new Error('Enter both the GitHub owner and repository name.');
  if (!token) throw new Error('Paste a fine-grained GitHub token first.');

  const repoRes = await fetch(`${API}/repos/${owner}/${repo}`, { headers: headers(token) });
  if (!repoRes.ok) throw new Error(await describeError(repoRes));

  const repoData = (await repoRes.json()) as {
    full_name: string;
    default_branch: string;
    permissions?: { push?: boolean; admin?: boolean; maintain?: boolean };
  };

  // Fine-grained tokens don't always report `permissions`; absence isn't proof
  // of no access, so treat it as unknown-but-probably-fine rather than failing.
  const perms = repoData.permissions;
  const canWrite = perms ? Boolean(perms.push || perms.admin || perms.maintain) : true;

  const fileRes = await fetch(
    `${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`,
    { headers: headers(token) },
  );
  if (!fileRes.ok && fileRes.status !== 404) throw new Error(await describeError(fileRes));

  return {
    repoFullName: repoData.full_name,
    defaultBranch: repoData.default_branch,
    canWrite,
    fileExists: fileRes.ok,
  };
}

export type DeployResult = {
  commitUrl: string;
  commitSha: string;
  created: boolean;
};

/**
 * Commit the given JSON to the configured path. Creates the file if it does
 * not exist yet, otherwise updates it (GitHub requires the current blob SHA
 * for updates, so fetch that first).
 */
export async function deployContent(
  config: DeployConfig,
  token: string,
  json: string,
  message?: string,
): Promise<DeployResult> {
  const { owner, repo, branch, path } = config;
  if (!owner || !repo) throw new Error('Enter both the GitHub owner and repository name.');
  if (!token) throw new Error('Paste a fine-grained GitHub token first.');

  const contentsUrl = `${API}/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;

  // 1. Current SHA (absent => first publish).
  let sha: string | undefined;
  const getRes = await fetch(`${contentsUrl}?ref=${encodeURIComponent(branch)}`, {
    headers: headers(token),
  });
  if (getRes.ok) {
    const data = (await getRes.json()) as { sha?: string };
    sha = data.sha;
  } else if (getRes.status !== 404) {
    throw new Error(await describeError(getRes));
  }

  // 2. Commit.
  const putRes = await fetch(contentsUrl, {
    method: 'PUT',
    headers: headers(token),
    body: JSON.stringify({
      message:
        message ??
        `Update portfolio content — ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
      content: toBase64(json),
      branch,
      ...(sha ? { sha } : {}),
    }),
  });
  if (!putRes.ok) throw new Error(await describeError(putRes));

  const result = (await putRes.json()) as {
    commit?: { sha?: string; html_url?: string };
  };

  return {
    commitSha: (result.commit?.sha ?? '').slice(0, 7),
    commitUrl: result.commit?.html_url ?? `https://github.com/${owner}/${repo}/commits/${branch}`,
    created: !sha,
  };
}
