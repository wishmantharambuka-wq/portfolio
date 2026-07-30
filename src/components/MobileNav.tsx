import { useEffect, useState } from 'react';
import { sections } from '../data/sections';
import { scrollState } from '../lib/scroll';
import { scrollToSection } from '../lib/useSmoothScroll';
import { navigate } from '../lib/router';
import { SECTION_ICONS, CV_ICON, ADMIN_ICON } from './sectionIcons';

/* --------------------------------------------------------------------------
 *  MOBILE NAVIGATION  (< lg)
 *
 *  A thumb-reachable pill fixed at the bottom shows the current section and,
 *  tapped, opens a full-screen menu in the same green language as the desktop
 *  rail: section icons + labels, the active one a white pill, then CV and
 *  Admin below a divider. Replaces the old read-only section chip, which told
 *  you where you were but gave you no way to jump.
 * ------------------------------------------------------------------------ */

export function MobileNav() {
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

  // Close on Escape; lock the page behind the overlay while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.documentElement.style.overflow = '';
    };
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    // Let the overlay begin closing before the scroll starts.
    window.setTimeout(() => scrollToSection(id), 120);
  };

  const goRoute = (route: 'cv' | 'admin') => {
    setOpen(false);
    window.setTimeout(() => navigate(route), 120);
  };

  return (
    <div className="lg:hidden">
      {/* Trigger pill */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={open}
        className="glass fixed bottom-4 left-1/2 z-40 flex -translate-x-1/2 items-center gap-2.5 rounded-full py-2 pl-4 pr-3 shadow-lg"
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash-200">
          {sections[active]?.label ?? ''}
        </span>
        <span className="flex flex-col gap-[3px]" aria-hidden>
          <span className="block h-[2px] w-4 rounded-full bg-ash-300" />
          <span className="block h-[2px] w-4 rounded-full bg-ash-300" />
          <span className="block h-[2px] w-2.5 rounded-full bg-ds" />
        </span>
      </button>

      {/* Full-screen overlay */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
        className={`fixed inset-0 z-[60] transition-all duration-300 ${
          open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <div
          className="absolute inset-0 flex flex-col px-6 pb-8 pt-6 transition-transform duration-400 ease-out"
          style={{
            transform: open ? 'translateY(0)' : 'translateY(2%)',
            background:
              'linear-gradient(160deg, rgb(31 163 124 / 0.97) 0%, rgb(12 107 82 / 0.98) 38%, rgb(6 52 41 / 0.99) 78%, rgb(2 22 17) 100%)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/15 ring-1 ring-inset ring-white/25">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M20 4C10 4 4 9 4 15a5 5 0 0 0 5 5c6 0 11-6 11-16Z"
                    stroke="white"
                    strokeWidth="1.6"
                    strokeLinejoin="round"
                  />
                  <path d="M16 8 7 17" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </span>
              <span className="font-display text-base font-semibold text-white">Chamod</span>
            </span>

            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="flex h-10 w-10 items-center justify-center rounded-full text-white/90 ring-1 ring-inset ring-white/20 transition hover:bg-white/10"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M6 6l12 12M18 6 6 18"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {/* Sections */}
          <nav className="mt-8 flex-1 overflow-y-auto" aria-label="Sections">
            <ul className="flex flex-col gap-1.5">
              {sections.map((s, i) => {
                const isActive = i === active;
                return (
                  <li
                    key={s.id}
                    style={{ transitionDelay: open ? `${60 + i * 35}ms` : '0ms' }}
                    className={`transition-all duration-300 ${
                      open ? 'translate-x-0 opacity-100' : '-translate-x-3 opacity-0'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => go(s.id)}
                      aria-current={isActive ? 'true' : undefined}
                      className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition-colors ${
                        isActive
                          ? 'bg-white text-[rgb(6_52_41)]'
                          : 'text-white/85 hover:bg-white/10'
                      }`}
                    >
                      <svg
                        width="21"
                        height="21"
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
                      <span className="font-display text-lg font-medium">{s.label}</span>
                      <span className="ml-auto font-mono text-[10px] opacity-50">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* CV + Admin */}
          <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/15 pt-5">
            <button
              type="button"
              onClick={() => goRoute('cv')}
              className="flex items-center justify-center gap-2.5 rounded-2xl bg-white/10 py-3.5 text-white transition hover:bg-white/15"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {CV_ICON}
              </svg>
              <span className="text-sm font-medium">CV</span>
            </button>
            <button
              type="button"
              onClick={() => goRoute('admin')}
              className="flex items-center justify-center gap-2.5 rounded-2xl bg-white/10 py-3.5 text-white transition hover:bg-white/15"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                {ADMIN_ICON}
              </svg>
              <span className="text-sm font-medium">Admin</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
