# Chamod Wismantha — 3D Portfolio

A scroll-driven 3D portfolio covering **Data Science** (priority 1), **GIS &
Geospatial** (2), and **Graphic Design** (3), plus a printable CV portal and a
built-in content admin panel.

Scrolling doesn't move the page past a static scene — it flies a camera along a
spline through seven stations in 3D space, one per section, so the whole thing
reads as a single continuous shot rather than a slideshow.

## Routes

| URL | What it is |
| --- | --- |
| `#/` | The 3D portfolio |
| `#/work/<category>` | **3D "see all" portal** for a category (`data-science`, `gis`, `design`) — a coverflow you fly through, with per-project detail + live preview |
| `#/cv` | Full CV — a designed two-column template sheet, print/save-as-PDF ready |
| `#/admin` | Content admin: add, edit, remove and reorder everything |

### Work portals (`src/routes/WorkPortal.tsx`)

Each category's "See all" opens a full-screen 3D coverflow. Projects are panels
(their screenshot, or a generated preview drawn to a canvas texture) floating in
the green void; the focused one faces you, the rest recede and angle away.
Arrow keys / on-screen buttons / wheel / drag move focus; clicking the focused
panel opens a detail overlay with the full case study, metrics, stack, links,
and an inline **live preview** (a sandboxed iframe of the real site).

Panels use generated canvas textures on plain planes — no external fonts, no
texture-loader suspense that could hang on a 404. If a screenshot path is set,
the image is drawn over the generated preview once it loads.

Hash routing is used because it works on GitHub Pages with no server rewrite
rules. Routes are namespaced with a leading slash (`#/cv`) so they never
collide with the in-page scroll anchors (`#gis`).

## Stack

| Concern | Choice |
| --- | --- |
| Build | Vite + TypeScript |
| 3D | three.js + React Three Fiber + drei |
| Post FX | @react-three/postprocessing |
| Animation | GSAP + ScrollTrigger, choreographed from `src/lib/motion.ts` |
| Scrolling | Lenis |
| Styling | Tailwind CSS |

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production bundle into dist/
npm run preview  # serve the built bundle locally
```

Node 20+.

---

## The admin panel

Open `#/admin`. Tabs cover Profile, Data Science, GIS, Design, Skills, CV and
Publish. You can add, edit, reorder (↑ ↓) and delete every item, and edits
apply to the live site instantly so you can see them in context.

### How saving works — read this once

This site is **static hosting**. There is no server to save to, so publishing
is deliberately a two-step you do on purpose:

```
edit in #/admin  →  saved to your browser (localStorage)  →  instantly visible to you
      ↓
Publish tab → "Save to repo"   (writes public/content.json directly, via the
      ↓                         File System Access API — no token, no Downloads
      ↓                         folder; the file is picked once and remembered)
npm run deploy                 (git add public && commit && push)
      ↓
host rebuilds → visitors see it
```

Full walkthrough: **[DEPLOY.md](DEPLOY.md)**.

There is deliberately **no stored credential**. An earlier version committed
straight to GitHub with a fine-grained token held in `localStorage`; that was
removed in favour of writing to disk and letting you push. The browser is
granted only permission to write the one file you picked, and nothing reaches
the public site without your push — so an accidental publish is impossible.
Browsers without the API (Firefox, Safari) fall back to a download.

The app layers content in three levels, highest wins:

1. `src/data/content.ts` — bundled defaults, always present, no network
2. `public/content.json` — what visitors see, once you publish one
3. `localStorage` — your unpublished draft, this browser only

A header badge shows **Unpublished draft** whenever level 3 is active.

**Your drafts live in one browser.** Clearing site data loses them — export
from the Publish tab first. The Publish tab also has Import (to move a draft
between machines), Discard draft, and Reset to defaults.

### Sign-in

The panel is behind a sign-in (`admin` / `admin123`, in
`src/lib/adminAuth.ts`). The session is `sessionStorage`-scoped, so closing the
tab signs you out.

**This is obscurity, not security, and it cannot be otherwise on a static
site.** The credentials ship in the JS bundle — anyone can read them in
DevTools, and anyone can bypass the gate by editing storage. That's acceptable
because the panel has nothing worth protecting: it only edits *the viewer's own
browser copy*. What the world sees changes only when you commit
`public/content.json`, which requires access to your GitHub repo — that commit
is the real security boundary, and it is not in the client.

To change the credentials, edit `USERNAME` / `PASSWORD` in
`src/lib/adminAuth.ts`. To remove the panel from the public build entirely,
delete the `route === 'admin'` branch in `src/App.tsx`.

---

## Editing without the panel

Everything the admin edits lives in `src/data/content.ts` as typed defaults.
Hand-editing that file works exactly the same.

`src/data/sections.ts` is separate — it's structural, not content. Each section
owns a `camera` position and a `target` to look at. Reorder or add entries and
the nav, scroll progress and camera path follow; if you add a section, give its
3D object a station in `stations` and wire it up in `src/three/Scene.tsx`.

### Design artwork

Drop images into `public/assets/design/`, then set the image path on the piece
(admin → Design tab, or the `design` array). Pieces without an image render a
generated gradient tile, so the grid never looks broken. See
`public/assets/design/README.md` for sizing.

---

## Design system

**Light-first, green.** The palette is sampled from the reference rail —
`#1FA37C → #0C6B52 → #064435 → #02100C` — and is the source of every colour on
the site, including the 3D scene.

Light mode is the *default*, not an alternative. `initialTheme()` deliberately
does **not** follow `prefers-color-scheme`: a visitor whose OS is dark would
otherwise never see the site as designed. Dark is available from the toggle and
is remembered once chosen.

| Role | Light | Dark |
| --- | --- | --- |
| Page ground (`--ash-950`) | `#F4F9F6` | `#02100C` |
| Strongest text (`--ash-50`) | `#061610` | `#F0FAF5` |
| Data Science accent | `#0A6B51` | `#2EC898` |
| GIS accent | `#14544A` | `#7AC88C` |
| Design accent | `#3E6B4B` | `#A8D6B0` |

The three discipline accents are all greens, separated by hue-lean and value
rather than by being different colours — emerald (blue-green) for Data Science,
deep teal-green for GIS, sage for Design.

One structural note: light mode needs `--glass-line` **separate** from
`--glass-tint`, because the surfaces are white and a white border on a white
card is invisible. Tint carries the fill; line carries the hairline.

### Page structure

| # | Section | Built from |
| --- | --- | --- |
| — | **Cover** (`#hero`) | Centred typographic lockup: micro-tracked label, one enormous textured word, inverted name plate |
| 01 | **Career Paths** (`#paths`) | Hanging lamp over three numbered columns — Data Science, Informatics & GIS, Design. Each links into its section |
| 02 | About | Intro + education |
| 03 | Data Science | Depth-blurred project listing |
| 04 | GIS & Geospatial | Depth-blurred project listing |
| 05 | Design | Gallery grid |
| 06 | Toolkit | Skill groups |
| 07 | Contact | Links + CV |

Device patterns borrowed from the reference images:

- **Display typography** (`.display-fill`, `.display-shadow`, `.name-plate`) —
  heavy condensed caps with a gradient fill and a long soft drop shadow, a
  micro-tracked label above and an inverted name plate below. The shadow is a
  two-stop `drop-shadow` filter, not the classic 30-layer `text-shadow` ladder,
  which would repaint every layer on each animated frame.
- **Ghost word** (`.ghost-word`) — an oversized outlined word behind each
  section heading. Pass `ghost="DATA"` to `<Section>`. Needs `isolate` on the
  wrapper: without it the negative z-index drops the word behind the page
  entirely.
- **Cover panel** (`.cover-frame`, `src/components/Hero.tsx`) — an inset panel
  with light travelling around its rim, mark and search top, a dated badge, the
  display word stacked solid-over-outline, role text on a rule, scroll cue and
  socials. The name sits *outside* the panel like a caption.
  The move worth protecting is the **interleave**: the subject sits at `z-10`
  between the top word (`z-0`) and the bottom word (`z-20`), so the type appears
  to pass through it. Flatten those layers and the composition dies.
- **Side rail** (`src/components/SideRail.tsx`) — the desktop nav. A narrow
  column of circular icon buttons that widens to 216px on hover, labels fading
  in, with the active item as a solid white pill cut out of the green panel.
  It keeps its own dark-green gradient in *both* themes, because it's a
  floating object rather than a page surface and the white pill needs a dark
  ground to read against. Replaced the radial dial: with eight sections, a
  persistent index that shows where you are beats a flourish that hides the
  list behind a click.
- **Listing rows** (`.listing-row`, `src/components/ProjectRow.tsx`) — projects
  are a vertical stack hanging off a rail, not a card grid. The row crossing
  the centre of the screen is sharp and forward; the rest recede *slightly*
  (`blur 0 → 0.9px`, `opacity 1 → 0.86`, `scale 1 → 0.985`). The depth is a
  **cue, not a filter** — an early version dropped unfocused rows to 0.32
  opacity / 2.6px blur, which made off-centre projects unreadable and killed
  any reason to scroll through them. Hover or keyboard focus overrides the
  depth entirely and brings a row fully forward.
- **Project card hover** (`.project-card`) — a card that looked identical
  whether or not it led anywhere gave no reason to click. On hover / focus the
  card lifts, its rim takes the section accent, an accent wash rises from the
  bottom, and an "Open live site" bar slides up. The **whole card** is a link
  to the live project (stretched `<a>` under the explicit buttons in z-order,
  so nested-interactive HTML stays valid and keyboard nav works).
- **Lamp** (`src/components/Lamp.tsx`) — cord, shade, bulb and light cone,
  drawn in SVG/CSS so they stay theme-aware and sharp at any size. A supplied
  image replaces only the shade; the cord and beam stay coded.

### Fitting the cover word

`src/lib/useFitText.ts` measures the cover word and sets its font-size to fill
the container exactly. This is not over-engineering: the word is editable from
the admin panel, so *any* fixed or `vw` size is a guess about character count.
`PORTFOLIO` at `14rem` overflowed its container by 116px at a 1024px viewport
and the reveal mask silently clipped it. Measuring handles any word at any
width — verified with a 12-character word at four breakpoints.

`src/lib/useMagnetic.ts` adds cursor-following lean to the dial knob and the
hero's primary button. It writes `transform` on a damped rAF loop and opts out
entirely on coarse pointers and reduced-motion.

### Interactive 3D

- **Card tilt** (`src/lib/useTilt.ts`, `.tilt-card`) — the career-path cards and
  design tiles lean in 3D toward the cursor and lift, with a specular sheen
  that tracks the pointer. `perspective` + `preserve-3d`, written on a damped
  rAF loop; opts out on touch and reduced-motion. On cards that already carry a
  ref-based system (focus-blur) the two refs are merged onto one element.
- **Cursor-reactive hero cloud** (`DataOrb`) — the point cloud reacts to the
  pointer: points near the cursor are pushed radially away and popped toward the
  camera (parting like a hand through mist) and brighten to the accent. Done in
  **view space** so the reaction stays anchored under the cursor regardless of
  the cloud's rotation. Strength eases off as the sphere morphs into the scatter
  plot and as you scroll away. Verified: shader compiles, links and draws with
  the new `uCursor`/`uCursorStrength` uniforms, zero GL errors.

## Animation

GSAP stayed; the choreography was rebuilt. **`src/lib/motion.ts` is the source
of truth** — import `DUR`, `EASE`, `STAGGER`, `LIFT` rather than typing
literals, so the whole site moves in one rhythm.

The previous problem was uniformity: everything animated 28px over 1.05s on
`power3.out`, which made a one-line eyebrow and a full project card feel like
the same object. Now motion scales with visual weight — `<Reveal weight="chip"
| "card" | "heading">` sets distance, duration and ease together (12px/0.55s
up to 44px/1.25s).

`expo.out` is the default entrance: it covers ~80% of its distance in the first
fifth of its duration, which is what makes an element *land* rather than drift.

### Content animations (added, and why they're safe)

- **Cover social buttons** (`src/components/SocialButtons.tsx`) — GitHub,
  LinkedIn, WhatsApp, Email. Each is a magnetic circular button whose hover
  interaction is layered: an accent fill sweeps up, the icon rolls over (two
  stacked copies sliding vertically), and the label pops above. All CSS
  transform/opacity, mirrored on `:focus-visible` for keyboard users. They
  enter as the final beat of the hero's GSAP timeline with a slight overshoot.
- **Word-by-word heading reveal** (`src/components/SplitWords.tsx`) — section
  headings wipe up a word at a time on scroll-in.
- **Metric count-up** (`src/components/CountUp.tsx`) — numeric metric values
  ("331", "450k ha", "5 months") count from zero when scrolled into view.
  Non-numeric values ("— %", "Landsat 8/9", "R²") are shown verbatim.

Both scroll-in animations are **safe by design**, because the preview
environment (and any backgrounded tab) pauses `requestAnimationFrame`, which
freezes GSAP's ticker and ScrollTrigger:

- `SplitWords` uses `immediateRender: false`, so words render at their natural
  (visible) position and only drop-and-wipe when the tween actually plays. A
  trigger that never fires leaves the heading **readable**, never blank.
- `CountUp` shows the **real value** until the count genuinely starts, and only
  resets to zero at the instant it begins animating. It detects visibility with
  a `getBoundingClientRect` rAF poll rather than ScrollTrigger or
  IntersectionObserver — both of which proved unreliable under Lenis here.

Sequences are timelines with intent rather than parallel fades — the hero draws
its centre rules first to establish the axis, then tracks the label open, then
wipes the word up behind its mask over 1.8s, and only then lets the UI fade in.
Career Paths turns the lamp on before the columns it lights appear.

## Light / dark mode

Toggle is top-right on every route, persisted to localStorage, defaulting to
your OS preference (dark unless the OS explicitly asks for light).

The implementation is worth knowing about before you restyle anything: **the
ash colour ramp is semantic, not literal.** `--ash-950` always means "page
background" and `--ash-50` always means "strongest text" — the light theme
*inverts* the ramp in `src/index.css`. That's why no component contains a
single `dark:` variant, and why adding one would break light mode.

The 3D scene has its own palette in `src/lib/theme.tsx` (`scenePalette`). Theme
changes update shader **uniform values** in place rather than rebuilding
materials, so toggling doesn't recompile shaders or rebuild the 9k-point cloud.

Measured contrast against the page background, both themes:

| Token | Light (default) | Dark |
| --- | --- | --- |
| `--ash-300` | 8.04 | 10.63 |
| `--ash-400` (secondary/eyebrow) | 4.96 | 7.07 |
| `--ash-500` (decorative only) | 3.18 | — |
| `--accent-ds` emerald | 6.10 | 9.09 |
| `--accent-gis` teal-green | 8.23 | 9.67 |
| `--accent-gfx` sage | 5.79 | 11.93 |

Everything carrying real text clears WCAG AA in both themes. `--ash-500` is
reserved for decorative metadata (years, hints) — don't promote it to body copy
without re-measuring.

### Cards over the 3D scene

Project cards sit directly over the animated scene, so their fill is a
**legibility floor**, not a style choice — `--card-bg` (0.78 light / 0.82 dark)
over `--ash-900`, with the glass tint as a thin highlight on top. Below ~0.7
the terrain reads through the body copy. The worst case — an unfocused row over
the brightest part of the terrain — was composited numerically and still clears
AA: titles ~12:1, body/chips ~8:1, small mono metadata 5.6–6.7:1.

The GIS terrain behind those cards is deliberately held at 0.42 max opacity
(was 0.95). It's a backdrop; at full strength its contour lines read straight
through the cards in front of it.

## The centre-focus effect

As a card crosses the middle of the viewport it writes a `--focus` value (0→1)
onto itself, and the stylesheet turns that into a stronger backdrop blur and a
more opaque surface — blur ramps `6px → 32px`.

The "blur only behind the card, not the whole page" property comes free from
`backdrop-filter`, which by definition only samples the area behind its own
element. No overlay, no masking.

One shared rAF loop and one IntersectionObserver serve every card, and cards
outside the viewport aren't measured at all — cost scales with what's on
screen, not with how many projects you add. See `src/lib/useFocusBlur.ts`.

## The 3D scene

| Object | Section | What it is |
| --- | --- | --- |
| `FlowField` | Cover | **The opening background.** Living topography: a domain-warped noise field contoured into elevation bands, with the warp itself animated so contours continuously flow, split and merge. Index contours every fifth line, cartographic convention. One plane, one draw call — cost is in the fragment shader, so it scales with resolution not geometry, and drops octaves on low tiers |
| `DataOrb` | Hero → Data Science | 9k-point cloud that morphs from a sphere into a 3D scatter plot as you scroll between the two stations |
| `Halo` | About, Contact | Quiet counter-rotating rings |
| `TerrainGrid` | GIS | Animated elevation surface with contour bands and a graticule |
| `GlassShards` | Design | Drifting frosted glass panels with real refraction |
| `Lattice` | Toolkit | Node-and-edge skill graph |
| `Starfield` | Everywhere | Recycled ambient dust that makes camera travel legible |

## Performance

`src/lib/useDeviceTier.ts` picks a quality tier once at mount from pointer
type, core count and device memory:

- **high** — full DPR, post-processing, real transmission/refraction
- **medium** — DPR capped at 1.5, post-processing on, transmission off, 55% particles
- **low** — DPR 1, no post-processing, 30% particles

`prefers-reduced-motion` forces the low tier, disables Lenis (native scroll),
and pins `--focus` at 0. `AdaptiveDpr` drops resolution rather than frames if
the GPU falls behind. CV and admin routes don't mount a WebGL context at all.

## Social share (Open Graph)

Pasting the site link into LinkedIn / WhatsApp / X shows a preview card. The
Open Graph + Twitter tags live in `index.html`; `og:image` and `og:url` are
absolute URLs (scrapers don't run JS), injected at build time from
`VITE_SITE_URL`. The deploy workflow sets that automatically to
`https://<owner>.github.io/<repo>/`, so it just works once deployed. Locally
(env unset) the `%VITE_SITE_URL%` literal remains — harmless, since scrapers
only hit the deployed URL.

The image itself is `public/og-image.png` (1200×630). It isn't committed yet —
generate it from the ready-made template:

1. Open `public/og-preview.html` (e.g. `http://localhost:5173/og-preview.html`).
2. Export the 1200×630 `#card` element to `public/og-image.png` — easiest via
   DevTools → right-click the node → **Capture node screenshot**.
3. Commit the PNG. The template matches the cover (green, PORTFOLIO, your name)
   and its text is editable inline.

## Deploying to GitHub Pages

`.github/workflows/deploy.yml` handles it. Push to `main` and it builds,
injects the correct base path from the repo name, writes a `404.html` fallback
and `.nojekyll`, then deploys.

One-time setup: **Settings → Pages → Build and deployment → Source: GitHub
Actions**.

Local production test of a project-page build:

```bash
VITE_BASE=/your-repo-name/ npm run build && npm run preview
```

---

## Verified

- `npm run build` — type-checks clean, builds clean
- Both custom GLSL shaders compile and link against a real WebGL context, zero errors
- Light is the default for a fresh visitor (verified with storage cleared)
- `FlowField` shader compiles, links and draws against a real WebGL context —
  centre pixel read back as `rgb(113,126,120)`, i.e. real output, not a fallback
- Cover interleave: top word `z-0`, subject `z-10`, bottom word `z-20`
- Both display lines auto-fit flush to the same width, unclipped
- Side rail expands 68 → 216px on hover with labels fading in, collapses on leave
- Side rail order verified: sections, then Curriculum Vitae, then **Admin** last
- Card readability re-measured after the fix: unfocused row over bright terrain
  clears AA on every text token in both themes (titles ~12:1, meta 5.6–6.7:1)
- Card hover/focus: card lifts `-4px`, accent border + wash appear, "Open live
  site" bar slides up `8 → 0`; the whole card links to the live project;
  verified via `:focus-within` so it's keyboard-accessible too
- Admin sign-in: gate blocks the panel, wrong password rejected, `admin`/
  `admin123` grants access, session persists, sign-out works
- Cover social buttons: 4 buttons, correct hrefs (WhatsApp → wa.me, Email →
  mailto:uni.chamod27@gmail.com), hover + focus-visible animation rules compiled
- Safe-fallback check (tab backgrounded, rAF frozen — the worst case): every
  section heading still renders visible, and every metric shows its real value
  with no "0" bug — so animations enhance but never hide content
- Project thumbnails render (generated fallback with grid + monogram), fixed
  4:3, no horizontal scroll
- Mobile menu: opens/closes, lists all 8 sections + CV + Admin, scroll-locks,
  desktop rail correctly hidden below `lg`
- Route transition: curtain idles at opacity 0, covers on navigation, and
  lifts back to 0 with the destination rendered (fixed a bug where a re-run
  effect cancelled the lift timer and froze the curtain down)
- CV download: links to `cv.pdfUrl` when set, else falls back to the print dialog
- OG tags: `%VITE_SITE_URL%` replacement verified (resolves to absolute URLs on
  build); `og-preview.html` card is exactly 1200×630 with the word fitting
- Card tilt: 3 career cards + 6 design tiles carry `.tilt-card` (preserve-3d),
  pointer handler responds (glare vars track the cursor); transform applies via
  rAF when the tab is visible
- DataOrb cursor reactivity: updated shader compiles/links/draws clean
- Work portal: `#/work/gis` renders (heading, counter 01/03, canvas, focused
  project); Next advances the counter and focus; View details opens a full
  overlay (metrics, stack, problem/approach/outcome) with a sandboxed live
  iframe of the real site; no console errors
- See-all buttons: present in all three sections with correct counts (DS 4, GIS
  3, Design 6), navigating to the matching portal
- CV template: white A4 sheet + green sidebar, two columns side-by-side, all
  sections present, stays white paper (dark ink) even in dark mode, no
  horizontal scroll
- Theme toggle: CSS variables, persistence and contrast ratios measured in-browser
- Focus blur: confirmed `6px → 32px` on `backdrop-filter` driven by `--focus`
- Radial dial: opens/closes, and the chip stack's depth blur measured at
  `0 → 3.5px` with opacity `1.0 → 0.25` across the stack
- Ghost words: all six render behind their headings, unclipped
- Cover word auto-fit: measured at 401 / 1024 / 1440px and with a 12-character
  word — fits with margin in every case, no clipping, no horizontal scroll
- Listing depth: `focus 0 → 0.5 → 1` produces `blur 2.6 → 1.3 → 0px`,
  `opacity 0.32 → 0.66 → 1`, `scale 0.955 → 1`
- Career Paths renders the drawn lamp, light cone and all three columns;
  columns stack full-width on mobile
- Admin round-trip: edit → localStorage → live site, plus add-project and discard-draft
- CV route: renders all sections, pulls projects from the shared content store

**Not verified:** how any of it actually *looks*. The sandbox used to build this
couldn't render a visible frame, so the 3D scene has never been seen. Run
`npm run dev` and review it yourself before publishing.
