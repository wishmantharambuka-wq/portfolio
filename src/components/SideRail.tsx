import { useEffect, useState } from 'react';
import { sections } from '../data/sections';
import { scrollState } from '../lib/scroll';
import { scrollToSection } from '../lib/useSmoothScroll';
import { navigate } from '../lib/router';
import { SECTION_ICONS, CV_ICON, ADMIN_ICON } from './sectionIcons';
import { adminEnabled } from '../lib/adminAuth';

/* --------------------------------------------------------------------------
 *  SIDE RAIL  (ref: the green expanding sidebar)
 *
 *  Collapsed it's a narrow column of circular icon buttons. On hover it
 *  widens and the labels appear; the active item becomes a solid white pill
 *  that reads as *cut out* of the green panel rather than drawn on top of it.
 *
 *  Replaces the radial dial. The dial was memorable but it hid the section
 *  list behind a click — with eight sections, a persistent index that shows
 *  where you are is worth more than the flourish.
 * ------------------------------------------------------------------------ */

/** A non-section rail entry (CV, Admin) — same shape, no active state. */
function RailLink({
  open,
  label,
  onClick,
  icon,
}: {
  open: boolean;
  label: string;
  onClick: () => void;
  icon: JSX.Element;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className="flex w-full items-center gap-3 rounded-full text-white/80 transition-colors duration-300 hover:bg-white/10 hover:text-white"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center">
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          {icon}
        </svg>
      </span>
      <span
        className={`whitespace-nowrap text-sm font-medium transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        {label}
      </span>
    </button>
  );
}

export function SideRail() {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let raf = 0;
    let last = -1;
    const loop = () => {
      if (scrollState.section !== last) {
        last = scrollState.section;
        setActive(last);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <nav
      aria-label="Sections"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="fixed left-5 top-1/2 z-50 hidden -translate-y-1/2 lg:block"
    >
      <div
        className={`relative overflow-hidden rounded-[2rem] border border-white/10 py-3 shadow-2xl transition-[width] duration-500 ease-out ${
          open ? 'w-[13.5rem]' : 'w-[4.25rem]'
        }`}
        style={{
          // The rail keeps its own dark-green gradient in both themes — it's
          // a floating object, not a page surface, and the white active pill
          // needs a dark ground to cut out of.
          background:
            'linear-gradient(170deg, rgb(31 163 124 / 0.95) 0%, rgb(12 107 82 / 0.97) 32%, rgb(6 52 41 / 0.98) 72%, rgb(2 22 17 / 0.99) 100%)',
          backdropFilter: 'blur(20px)',
        }}
      >
        {/* Brand mark */}
        <button
          type="button"
          onClick={() => scrollToSection('hero')}
          className="mb-2 flex w-full items-center gap-3 px-3"
          aria-label="Back to top"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-inset ring-white/25 backdrop-blur">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
              {/* Leaf — the eco/urban-green mark */}
              <path
                d="M20 4C10 4 4 9 4 15a5 5 0 0 0 5 5c6 0 11-6 11-16Z"
                stroke="white"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path d="M16 8 7 17" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <span
            className={`whitespace-nowrap font-display text-sm font-semibold text-white transition-opacity duration-300 ${
              open ? 'opacity-100' : 'pointer-events-none opacity-0'
            }`}
          >
            Chamod
          </span>
        </button>

        <ul className="flex flex-col gap-1">
          {sections.map((s, i) => {
            const isActive = i === active;
            return (
              <li key={s.id} className="px-3">
                <button
                  type="button"
                  onClick={() => scrollToSection(s.id)}
                  aria-current={isActive ? 'true' : undefined}
                  title={s.label}
                  className={`flex w-full items-center gap-3 rounded-full transition-colors duration-300 ${
                    isActive
                      ? 'bg-white text-[rgb(6_52_41)] shadow-lg'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center">
                    <svg
                      width="19"
                      height="19"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      {SECTION_ICONS[s.id]}
                    </svg>
                  </span>
                  <span
                    className={`whitespace-nowrap text-sm font-medium transition-opacity duration-300 ${
                      open ? 'opacity-100' : 'pointer-events-none opacity-0'
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Routes that leave the scroll experience, separated by a rule. */}
        <div className="mt-2 space-y-1 border-t border-white/10 px-3 pt-3">
          <RailLink
            open={open}
            label="Curriculum Vitae"
            onClick={() => navigate('cv')}
            icon={CV_ICON}
          />
          {/* Hidden unless the panel is actually part of this build, so the
              public site advertises no editor at all. */}
          {adminEnabled() && (
            <RailLink
              open={open}
              label="Admin"
              onClick={() => navigate('admin')}
              icon={ADMIN_ICON}
            />
          )}
        </div>
      </div>
    </nav>
  );
}
