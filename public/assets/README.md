# Image assets

**Everything here is optional.** The site ships with coded graphics — a
gradient texture inside the hero letters and a drawn SVG lamp — and those are
the permanent default, not placeholders. It looks finished with this folder
empty.

Adding a file just overrides the coded version.

## The two slots

Save your files here with these names and they'll be picked up:

| File | Replaces | Notes |
| --- | --- | --- |
| `hero-texture.jpg` | The gradient inside the top cover word | A photo — terrain, a map, an aerial, foliage. High contrast reads best through letterforms. **2000px wide min.** |
| `hero-subject.png` | The coded rings on the cover | **Transparent PNG cut-out.** The subject threaded between the two display lines — in front of the top word, behind the bottom one. A specimen, an object, a plant. ~1200px wide. |
| `lamp.png` | The drawn lamp on the Career Paths screen | **Transparent PNG.** Just the shade and bulb — the cord and light beam are drawn in code so they stay theme-aware. ~600px wide. |

Then point at them in the admin panel (`#/admin` → Profile tab → **Image
slots**), or directly in `src/data/content.ts`:

```ts
assets: {
  heroTexture: '/assets/hero-texture.jpg',
  heroSubject: '/assets/hero-subject.png',
  lamp: '/assets/lamp.png',
},
```

### The cover subject

This is the one that changes the cover most. It must be a **cut-out with a
transparent background** — a rectangular photo destroys the effect, because the
whole point is that the display type appears to pass through the subject. It
sits above the top word and below the bottom word in z-order.

Paths start with `/assets/...` — Vite serves `public/` from the site root and
rewrites the base path automatically on GitHub Pages.

### Picking a hero texture

It's seen *through* letterforms, so it's cropped hard. Busy detail disappears;
strong tonal contrast and large shapes survive. Aerial photography, contour
maps and concrete all work well. Test it in both light and dark mode — the
letters sit on opposite grounds in each.

## Design gallery artwork

Separate folder: `public/assets/design/` — see the README in there.
