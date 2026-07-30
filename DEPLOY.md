# Deploying — and editing without VS Code

Two parts:

1. **One-time setup** — put the site online. Needs your GitHub + Vercel login,
   so only you can do these steps.
2. **Every day after that** — open `#/admin`, edit, click **Save to repo**, then
   run one command. No VS Code, no code editing, and **no credentials stored
   anywhere.**

---

## Part 1 — one-time setup (~8 minutes)

The repo is already initialised and committed locally on branch `main`.

### Step 1 · Create the GitHub repo and push

Open a terminal **in this folder** once. Using the GitHub CLI (already
installed here):

```bash
gh auth login
```

```bash
gh repo create portfolio --public --source=. --remote=origin --push
```

Prefer the manual route? Create an empty repo at github.com/new (no README),
then:

```bash
git remote add origin https://github.com/YOUR-USERNAME/portfolio.git
git push -u origin main
```

### Step 2 · Connect Vercel

1. Go to [vercel.com/new](https://vercel.com/new), sign in **with GitHub**.
2. Import the `portfolio` repo.
3. Change nothing — `vercel.json` already sets the framework, build command and
   output directory. Click **Deploy**.

Live in about a minute at `https://portfolio-xxxx.vercel.app`. Every push to
`main` redeploys automatically.

> **Share previews are automatic.** `vite.config.ts` reads Vercel's
> `VERCEL_PROJECT_PRODUCTION_URL` at build time, so the Open Graph tags get
> absolute URLs with no configuration. Adding a custom domain later? Set
> `VITE_SITE_URL` in Vercel → Settings → Environment Variables.

### Step 3 · Link the content file (once, in the admin panel)

1. Run the site locally: `npm run dev`, open `http://localhost:5173/#/admin`.
2. Sign in, go to the **Publish** tab, click **Save to repo**.
3. The browser asks which file to write. Pick
   **`public/content.json`** inside this project folder.
   *(If it doesn't exist yet, type the name in that folder to create it.)*

That choice is remembered. From then on it's a single click.

> Needs Chrome, Edge, Brave or Opera. Firefox and Safari can't write files
> directly — there the panel automatically shows **Download** instead, and you
> move the file into `public/` yourself.

---

## Part 2 — the everyday loop

```
#/admin  →  edit anything  →  Save to repo      (writes public/content.json)
         →  npm run deploy                       (commits + pushes)
         →  Vercel rebuilds (~1 min)  →  live
```

The **Copy** button in the panel copies the command for you.

Not comfortable with the terminal? After **Save to repo**, open **GitHub
Desktop** and click *Commit* then *Push* — same result.

**What you can change this way:** every word and every project — cover text,
career paths, all project fields (title, year, blurb, problem/approach/outcome,
stack, live + repo URLs, thumbnail path, status, metrics), the design gallery,
skills, and the whole CV.

**What still needs a file copy:** images. Content is data; images are files. Drop
them in `public/assets/projects/`, then point a project's thumbnail field at the
path from the admin panel. `npm run deploy` stages all of `public/`, so images
and content go up together.

---

## Why it works this way

Publishing needs write access to your repository, and a static site has no
server to keep a credential in. The two honest options were:

| | Store a GitHub token in the browser | **Save to disk, you push** ← chosen |
| --- | --- | --- |
| Credential at rest | Yes, in localStorage | **None** |
| Could leak | Yes (scoped, but real) | **Nothing to leak** |
| Publishing | One click | One click + one command |
| Accidental publish | Possible | **Impossible — you push** |

The extra command buys you a system with no secrets in it. Worth it.

What the browser is actually granted: permission to write **one file you picked
yourself**, on your own machine, while the page is open. Nothing more. Revoke it
any time with **Forget** in the panel, or in the browser's site settings.

## Admin panel security

The honest problem: a password checked in the browser can never be real
security, because the check runs in JavaScript the visitor can read or skip.
Making the password stronger doesn't fix that. So the protection is layered,
with the real measure first:

**1. It isn't in the public build.** `VITE_ENABLE_ADMIN` is a *compile-time*
flag. In a production build without it, Rollup proves the admin branch dead and
strips the whole editor — verified: the emitted `Admin` chunk is 0.19 kB
containing `return null`, and the strings "Content admin", "Save to repo",
"admin123" appear nowhere in the bundle. The nav link disappears too. There is
nothing on the live site to attack, and every visitor's first load is ~40 kB
lighter.

You don't need it there anyway: content is authored locally and published by
pushing from your machine.

**2. The password is hashed.** When the panel *is* enabled, sign-in checks a
PBKDF2-SHA-256 hash (600,000 iterations, random salt), so the bundle never
contains the password. Measured cost: ~545 ms per attempt — trivial once,
punishing for a brute-forcer.

**3. Failures are locked out.** Three free tries, then 15s / 60s / 300s / 900s.
The correct password is refused while locked.

### Set your own password

```bash
npm run set-admin-password
```

Writes `VITE_ADMIN_PW_SALT` / `VITE_ADMIN_PW_HASH` into `.env.local`
(gitignored), so the password never enters git or the bundle. Restart the dev
server afterwards. Until you do this the shipped default (`admin` / `admin123`)
applies and the login screen warns you.

### If you really want it on the live site

Add `VITE_ENABLE_ADMIN=true` plus your salt/hash to Vercel → Settings →
Environment Variables. Understand the trade-off first: you'd be shipping the
editor publicly, protected only by a bypassable client-side gate. Since editing
still requires your local repo to publish, there's little to gain.

---

## Alternative hosts

Anything that rebuilds on a GitHub push works identically:

- **GitHub Pages** — `.github/workflows/deploy.yml` is ready. Enable it at
  Settings → Pages → Source: **GitHub Actions**. It injects the `/<repo>/` base
  path automatically.
- **Netlify** — import the repo; build `npm run build`, publish `dist`.

## Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| No file picker appears | Browser doesn't support it (Firefox/Safari) — use **Download instead**, or switch to Chrome/Edge/Brave. |
| "Permission to write that file was denied" | Browsers drop file permission between sessions. Click **Save to repo** again and allow it. |
| Saved, but the live site is unchanged | You still need to push: `npm run deploy`. Then give Vercel ~1 min and hard-refresh (Ctrl+Shift+R). |
| `npm run deploy` says "nothing to commit" | The file didn't change — check the panel actually said *Saved at …*. |
| `npm run deploy` fails on push | Not connected to GitHub yet — do Part 1 Step 1. |
| Edits vanished | Drafts live in one browser's storage. Save + push to make them permanent; clearing site data loses them. |
| Wrong file linked | **Change file** in the panel, and re-pick `public/content.json`. |
