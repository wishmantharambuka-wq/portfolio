# Graphic design artwork

Drop your images in this folder, then point at them from
`src/data/projects.ts` (the `design` array at the bottom of the file):

```ts
{
  id: 'gfx-brand',
  title: 'Brand Identity Systems',
  kind: 'Identity',
  year: '2021 — now',
  note: 'Logos, marks and the rules that keep them consistent.',
  image: '/assets/design/brand-system.jpg',   // <- add this line
  hue: 265,
}
```

Any entry **without** an `image` renders a generated gradient tile instead, so
the gallery never looks broken while it's still filling up.

## Notes

- Paths start with `/assets/...` — Vite serves `public/` from the site root and
  rewrites the base path automatically when deploying to GitHub Pages.
- Aim for **1600px on the long edge**, JPG or WebP, under ~400 KB each. Tiles
  render at `aspect-[4/3]` and are cropped with `object-cover`.
- Filenames: lowercase, hyphens, no spaces (`agri-poster-2025.jpg`).
