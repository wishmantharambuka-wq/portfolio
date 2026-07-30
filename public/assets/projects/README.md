# Project thumbnails

Drop a screenshot of each project here, then point at it — either in the admin
panel (`#/admin` → Data Science / GIS → a project → **Thumbnail image**) or
directly in `src/data/content.ts` (`image` field on the project).

```ts
{
  id: 'gis-dehiwala',
  title: 'Dehiwala Spatial Intelligence Dashboard',
  ...
  image: '/assets/projects/dehiwala.jpg',   // <- add this
}
```

Any project **without** an image renders a generated placeholder (accent
gradient + monogram + map grid), so the listing never looks broken.

## Notes

- **~1200px wide**, JPG or WebP, under ~300 KB each. Shown at `4:3` on desktop,
  `16:10` on mobile, cropped with `object-cover`.
- For the three live GIS sites, the easiest screenshot is the site's own hero /
  landing view. Filenames: lowercase, hyphens (`agriflow.jpg`).
- Paths start with `/assets/projects/...` — Vite serves `public/` from the site
  root and rewrites the base path automatically on GitHub Pages.
