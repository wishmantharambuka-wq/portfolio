import type { SectionId } from '../data/sections';

/* Section glyphs, shared by the desktop side rail and the mobile menu. Drawn
 * as stroke paths meant for a 24×24 viewBox with round joins. */
export const SECTION_ICONS: Record<SectionId, JSX.Element> = {
  hero: <path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4v-5H9v5H5a1 1 0 0 1-1-1z" />,
  paths: (
    <>
      <path d="M6 20V9" />
      <path d="M12 20V4" />
      <path d="M18 20v-7" />
    </>
  ),
  about: (
    <>
      <circle cx="12" cy="8" r="3.2" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </>
  ),
  'data-science': (
    <>
      <path d="M4 18h16" />
      <path d="M6.5 18v-5" />
      <path d="M11 18V7" />
      <path d="M15.5 18v-8" />
      <path d="M20 18V4" />
    </>
  ),
  gis: (
    <>
      <path d="M3 7.5 9 5l6 2.5L21 5v11.5L15 19l-6-2.5L3 19z" />
      <path d="M9 5v11.5" />
      <path d="M15 7.5V19" />
    </>
  ),
  design: (
    <>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2.6" />
    </>
  ),
  skills: (
    <>
      <path d="M4 7h16" />
      <path d="M4 12h16" />
      <path d="M4 17h10" />
    </>
  ),
  contact: (
    <>
      <path d="M3.5 6.5h17v11h-17z" />
      <path d="m3.5 7.5 8.5 6 8.5-6" />
    </>
  ),
};

export const CV_ICON = (
  <>
    <path d="M7 3h7l5 5v13H7z" />
    <path d="M14 3v5h5" />
    <path d="M10 13h6M10 17h4" />
  </>
);

export const ADMIN_ICON = (
  <>
    <rect x="4" y="10.5" width="16" height="10" rx="2" />
    <path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" />
    <circle cx="12" cy="15.5" r="1.2" />
  </>
);
