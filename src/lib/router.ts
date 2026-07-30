import { useEffect, useState } from 'react';

/* --------------------------------------------------------------------------
 * A small hash router. Hash routing is the one form that works on GitHub
 * Pages with no server rewrite rules and no 404 redirect dance.
 *
 * Routes are namespaced with a leading slash (`#/admin`) so they can't
 * collide with the in-page scroll anchors (`#gis`, `#contact`).
 *
 * `work` carries a category param: `#/work/data-science`. Everything is
 * derived from the single hash string, so back/forward and deep links work.
 * ------------------------------------------------------------------------ */

export type Route = 'home' | 'admin' | 'cv' | 'work';

export type WorkCategory = 'data-science' | 'gis' | 'design';

export const WORK_CATEGORIES: WorkCategory[] = ['data-science', 'gis', 'design'];

export type Location = { route: Route; category: WorkCategory | null };

export function parseLocation(hash: string): Location {
  const h = hash.replace(/^#/, '');
  if (!h.startsWith('/')) return { route: 'home', category: null };
  const parts = h.slice(1).split('?')[0].split('/');
  const seg = (parts[0] ?? '').toLowerCase();

  if (seg === 'admin') return { route: 'admin', category: null };
  if (seg === 'cv') return { route: 'cv', category: null };
  if (seg === 'work') {
    const cat = (parts[1] ?? '').toLowerCase() as WorkCategory;
    return {
      route: 'work',
      category: WORK_CATEGORIES.includes(cat) ? cat : 'data-science',
    };
  }
  return { route: 'home', category: null };
}

export function navigate(route: Route, category?: WorkCategory) {
  let target = '#/';
  if (route === 'work') target = `#/work/${category ?? 'data-science'}`;
  else if (route !== 'home') target = `#/${route}`;
  if (window.location.hash === target) return;
  window.location.hash = target;
}

export function useLocation(): Location {
  const [loc, setLoc] = useState<Location>(() => parseLocation(window.location.hash));

  useEffect(() => {
    const onHash = () => setLoc(parseLocation(window.location.hash));
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // Sub-pages are documents / standalone experiences — always start at the top
  // rather than inheriting the home page's scroll offset.
  useEffect(() => {
    if (loc.route !== 'home') window.scrollTo(0, 0);
  }, [loc.route, loc.category]);

  return loc;
}
