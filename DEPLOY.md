# Deploying — and then editing without VS Code

Two parts:

1. **One-time setup** (below) — put the site online. Needs your GitHub + Vercel
   login, so only you can do these steps.
2. **Every day after that** — open `#/admin`, edit, click **Deploy now**. No
   terminal, no VS Code, no git.

---

## Part 1 — one-time setup (~10 minutes)

The repo is already initialised and committed locally on branch `main`.

### Step 1 · Create the GitHub repo and push

Open a terminal **in this folder** once. Easiest route, using the GitHub CLI
(already installed here):

```bash
gh auth login
```

Then create the repo and push in one command:

```bash
gh repo create portfolio --public --source=. --remote=origin --push
```

Prefer doing it by hand? Create an empty repo at github.com/new (don't add a
README), then:

```bash
git remote add origin https://github.com/YOUR-USERNAME/portfolio.git
git push -u origin main
```

### Step 2 · Connect Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and sign in **with GitHub**.
2. Import the `portfolio` repo.
3. Change nothing — `vercel.json` already sets framework, build command and
   output directory. Click **Deploy**.

You get a live URL like `https://portfolio-xxxx.vercel.app` in about a minute.

Every push to `main` now redeploys automatically. That is the hook the admin
panel's Deploy button uses.

> **Open Graph URLs are automatic.** `vite.config.ts` reads Vercel's
> `VERCEL_PROJECT_PRODUCTION_URL` at build time, so share previews resolve to
> absolute URLs with no configuration. If you add a custom domain later, set
> `VITE_SITE_URL` in Vercel → Settings → Environment Variables.

### Step 3 · Create the deploy token

1. GitHub → **Settings** → **Developer settings** → **Personal access tokens** →
   **Fine-grained tokens** → **Generate new token**.
2. Set it up exactly like this:
   - **Repository access** → *Only select repositories* → pick `portfolio`
   - **Permissions** → Repository permissions → **Contents: Read and write**
     (leave everything else alone)
   - **Expiration** → 90 days
3. Copy the token (`github_pat_…`) — GitHub shows it once.
4. Open your live site at `/#/admin`, sign in, go to the **Publish** tab, fill
   in owner + repo, paste the token, click **Test connection**.

You should see *Connected to your-name/portfolio*.

---

## Part 2 — the everyday loop

```
#/admin  →  edit anything  →  Publish tab  →  Deploy now
         →  commits public/content.json to GitHub
         →  Vercel rebuilds (~1 min)
         →  live site updated
```

Only that. No VS Code.

**What you can change this way:** every word and every project — cover text,
career paths, all project fields (title, year, blurb, problem/approach/outcome,
stack, live + repo URLs, thumbnail path, status, metrics), the design gallery,
skills, and the whole CV.

**What still needs a real commit:** code and image *files*. Content is data;
images are files, and the browser can't add files to the repo. To add a
screenshot, drop it in `public/assets/projects/`, push once, then point the
project's thumbnail field at it from the admin panel.

---

## Security — read this once

The Deploy button needs a GitHub token, and on a static site there is **no
server to hide it in**. It is stored in your browser's `localStorage`. That is
a real trade-off, not something to wave away, so the design keeps the blast
radius as small as possible:

- The token is **fine-grained** and scoped to **one repository** with **only**
  `Contents: Read and write`. If it ever leaked, someone could edit files in
  that one repo — not your account, not your other repos, nothing private.
- It has an **expiry**. When it lapses, generate another and paste it again.
- It is stored under its own key, is **never** written into `content.json`, and
  is never logged. **Forget** removes it.
- **Never paste a _classic_ token here** — those are account-wide, and that
  would turn a small risk into a large one.

Verified during build: the token does not leak into the exported content or the
deploy config.

Also worth knowing: the admin **password** (`admin` / `admin123` in
`src/lib/adminAuth.ts`) is obscurity, not security — it ships in the JavaScript
bundle and can be bypassed. It doesn't need to be strong, because the panel only
edits the visitor's own browser copy. The real security boundary is the token,
which is why the scoping above is what actually matters. Change the password in
that file if you like.

---

## Alternative hosts

Everything above works the same on any host that rebuilds on a GitHub push:

- **GitHub Pages** — `.github/workflows/deploy.yml` is already set up. Enable
  it at Settings → Pages → Source: **GitHub Actions**. It injects the
  `/<repo>/` base path automatically.
- **Netlify** — import the repo; build `npm run build`, publish `dist`.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| `Token rejected (401)` | Expired, mistyped or revoked — generate a new fine-grained token. |
| `Forbidden (403)` | Token lacks `Contents: Read and write` on this repo. |
| `Not found (404)` | Check owner/repo spelling, that branch `main` exists, and that the token lists this repo. |
| `Conflict (409)` | The file changed on GitHub since the page loaded. Click **Deploy now** again. |
| Deploy succeeded but the site looks unchanged | Vercel takes ~1 min. Then hard-refresh (Ctrl+Shift+R). |
| Edits vanished | Drafts live in one browser's storage. Deploy to make them permanent; clearing site data loses them. |
