import { useMemo } from 'react';
import { useContent } from '../lib/contentStore';
import { navigate } from '../lib/router';
import { useTheme } from '../lib/theme';
import { ThemeToggle } from '../components/ThemeToggle';
import type { CvEntry, Project } from '../data/content';

/**
 * The CV portal — a designed CV *template*, not text floating in space.
 *
 * A white A4-proportioned sheet sits on a green backdrop, split into a deep-
 * green sidebar (contact, skills, languages, interests, achievements) and a
 * paper main column (profile, experience, education, projects). The sheet is
 * always light — a CV is a paper document, so it doesn't follow the site's
 * dark theme; only the backdrop does. Print styles flatten it to clean ATS
 * black-on-white, and "Download PDF" uses `cv.pdfUrl` if set, else print.
 *
 * All content comes from the same store as the site, so the CV can't drift.
 */
export function CVPage() {
  const content = useContent();
  const { cv, profile, links } = content;
  const { theme } = useTheme();

  const featured: Project[] = useMemo(() => {
    const all = [...content.dataScience, ...content.gis];
    return cv.featuredProjectIds
      .map((id) => all.find((p) => p.id === id))
      .filter((p): p is Project => Boolean(p));
  }, [content.dataScience, content.gis, cv.featuredProjectIds]);

  const initials = cv.fullName
    .replace(/[^a-zA-Z ]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className="print-root relative min-h-screen"
      style={{
        background:
          theme === 'dark'
            ? 'radial-gradient(130% 100% at 50% 0%, rgb(10 40 31) 0%, rgb(2 16 12) 70%)'
            : 'radial-gradient(130% 100% at 50% 0%, rgb(210 230 220) 0%, rgb(232 242 236) 70%)',
      }}
    >
      {/* Screen-only chrome */}
      <div className="no-print sticky top-0 z-30 border-b border-ash-700/40 bg-ash-950/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-ash-300 transition hover:text-ash-50"
          >
            ← Portfolio
          </button>
          <div className="flex items-center gap-2">
            {cv.pdfUrl ? (
              <a href={cv.pdfUrl} download target="_blank" rel="noreferrer noopener" className="btn-primary">
                Download PDF
              </a>
            ) : (
              <button type="button" onClick={() => window.print()} className="btn-primary">
                Download PDF
              </button>
            )}
            <ThemeToggle compact />
          </div>
        </div>
      </div>

      {/* The sheet */}
      <div className="mx-auto max-w-4xl px-3 py-8 sm:px-6 sm:py-12">
        <article className="cv-sheet mx-auto overflow-hidden rounded-2xl bg-white shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,0.36fr)_1fr]">
            {/* ---------------- Sidebar ---------------- */}
            <aside
              className="cv-sidebar px-6 py-8 text-white sm:px-6 sm:py-9"
              style={{ background: 'linear-gradient(165deg, #0c6b52 0%, #084a39 55%, #06342a 100%)' }}
            >
              <div
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-full text-xl font-bold"
                style={{ background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.28)' }}
              >
                {initials}
              </div>

              <SideSection title="Contact">
                <ul className="space-y-2">
                  {links.email && <SideContact label={links.email} href={`mailto:${links.email}`} />}
                  {links.emailAlt && <SideContact label={links.emailAlt} href={`mailto:${links.emailAlt}`} />}
                  {links.phone && <SideContact label={links.phone} href={`tel:${links.phone.replace(/\s/g, '')}`} />}
                  {profile.location && <SideContact label={profile.location} />}
                  {links.linkedin && (
                    <SideContact label={links.linkedin.replace(/^https?:\/\/(www\.)?/, '')} href={links.linkedin} />
                  )}
                  {links.github && (
                    <SideContact label={links.github.replace(/^https?:\/\/(www\.)?/, '')} href={links.github} />
                  )}
                </ul>
              </SideSection>

              {content.skills.length > 0 && (
                <SideSection title="Skills">
                  <div className="space-y-4">
                    {content.skills.map((g) => (
                      <div key={g.id} className="print-avoid-break">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/60">
                          {g.label}
                        </p>
                        <p className="mt-1 text-[12.5px] leading-relaxed text-white/90">
                          {g.items.map((i) => i.name).join(', ')}
                        </p>
                      </div>
                    ))}
                  </div>
                </SideSection>
              )}

              {cv.languages.length > 0 && (
                <SideSection title="Languages">
                  <ul className="space-y-1.5">
                    {cv.languages.map((l, i) => (
                      <li key={i} className="text-[12.5px]">
                        <span className="text-white/90">{l.name}</span>
                        <span className="ml-1 text-white/55">— {l.level}</span>
                      </li>
                    ))}
                  </ul>
                </SideSection>
              )}

              {cv.interests.length > 0 && (
                <SideSection title="Interests">
                  <p className="text-[12.5px] leading-relaxed text-white/85">{cv.interests.join(' · ')}</p>
                </SideSection>
              )}

              {cv.achievements.length > 0 && (
                <SideSection title="Achievements">
                  <ul className="space-y-2">
                    {cv.achievements.map((a, i) => (
                      <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-white/85">
                        <span className="mt-[0.4rem] h-1 w-1 shrink-0 rounded-full bg-white/60" aria-hidden />
                        <span>{a}</span>
                      </li>
                    ))}
                  </ul>
                </SideSection>
              )}
            </aside>

            {/* ---------------- Main ---------------- */}
            <div className="cv-main px-7 py-8 sm:px-9 sm:py-10" style={{ color: '#17251e' }}>
              <header className="print-avoid-break">
                <h1 className="font-display text-[26px] font-bold leading-tight sm:text-[30px]" style={{ color: '#0f1e18' }}>
                  {cv.fullName}
                </h1>
                <p className="mt-1.5 text-[14px] font-medium" style={{ color: '#0a6b51' }}>
                  {cv.headline}
                </p>
              </header>

              {cv.summary && (
                <MainSection title="Profile">
                  <p className="whitespace-pre-line text-[13px] leading-[1.7]" style={{ color: '#46554d' }}>
                    {cv.summary}
                  </p>
                </MainSection>
              )}

              {cv.experience.length > 0 && (
                <MainSection title="Experience">
                  <div className="space-y-5">
                    {cv.experience.map((e) => (
                      <Entry key={e.id} entry={e} />
                    ))}
                  </div>
                </MainSection>
              )}

              {cv.education.length > 0 && (
                <MainSection title="Education">
                  <div className="space-y-5">
                    {cv.education.map((e) => (
                      <Entry key={e.id} entry={e} />
                    ))}
                  </div>
                </MainSection>
              )}

              {featured.length > 0 && (
                <MainSection title="Selected Projects">
                  <div className="space-y-4">
                    {featured.map((p) => (
                      <div key={p.id} className="print-avoid-break">
                        <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                          <h3 className="font-display text-[14px] font-semibold" style={{ color: '#17251e' }}>
                            {p.title}
                          </h3>
                          <span className="font-mono text-[10.5px]" style={{ color: '#8a978f' }}>
                            {p.year}
                          </span>
                        </div>
                        {p.blurb && (
                          <p className="mt-0.5 text-[12.5px]" style={{ color: '#46554d' }}>
                            {p.blurb}
                          </p>
                        )}
                        {p.outcome && (
                          <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: '#61706a' }}>
                            {p.outcome}
                          </p>
                        )}
                        <div className="mt-1 flex flex-wrap items-center gap-x-3">
                          {p.stack.length > 0 && (
                            <span className="font-mono text-[10.5px]" style={{ color: '#8a978f' }}>
                              {p.stack.join(' · ')}
                            </span>
                          )}
                          {p.live && (
                            <a
                              href={p.live}
                              target="_blank"
                              rel="noreferrer noopener"
                              className="font-mono text-[10.5px]"
                              style={{ color: '#0a6b51' }}
                            >
                              {p.live.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </MainSection>
              )}

              {cv.referees && (
                <MainSection title="Referees">
                  <p className="text-[13px]" style={{ color: '#46554d' }}>
                    {cv.referees}
                  </p>
                </MainSection>
              )}
            </div>
          </div>
        </article>

        <p className="no-print mt-4 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-ash-500">
          {cv.pdfUrl ? 'Download the PDF above' : 'Use “Download PDF” to save a print-clean copy'}
        </p>
      </div>
    </div>
  );
}

/* ---- sidebar pieces ---- */
function SideSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-6 print-avoid-break first:mt-0">
      <h2 className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-white/70">{title}</h2>
      {children}
    </section>
  );
}

function SideContact({ label, href }: { label: string; href?: string }) {
  const cls = 'block break-words text-[12.5px] leading-snug text-white/90';
  return (
    <li>
      {href ? (
        <a href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer noopener" className={cls}>
          {label}
        </a>
      ) : (
        <span className={cls}>{label}</span>
      )}
    </li>
  );
}

/* ---- main pieces ---- */
function MainSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-7 print-avoid-break">
      <h2
        className="mb-3 flex items-center gap-2.5 text-[11px] font-bold uppercase tracking-[0.22em]"
        style={{ color: '#0a6b51' }}
      >
        {title}
        <span className="h-px flex-1" style={{ background: '#dbe7e0' }} aria-hidden />
      </h2>
      {children}
    </section>
  );
}

function Entry({ entry }: { entry: CvEntry }) {
  return (
    <div className="print-avoid-break">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
        <h3 className="font-display text-[14px] font-semibold" style={{ color: '#17251e' }}>
          {entry.title}
        </h3>
        {entry.period && (
          <span className="font-mono text-[10.5px]" style={{ color: '#8a978f' }}>
            {entry.period}
          </span>
        )}
      </div>
      {entry.org && (
        <p className="mt-0.5 text-[12.5px] font-medium" style={{ color: '#0a6b51' }}>
          {entry.org}
        </p>
      )}
      {entry.detail && (
        <p className="mt-1 text-[12.5px]" style={{ color: '#46554d' }}>
          {entry.detail}
        </p>
      )}
      {entry.bullets.length > 0 && (
        <ul className="mt-1.5 space-y-1">
          {entry.bullets.map((b, i) => (
            <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed" style={{ color: '#54635b' }}>
              <span className="mt-[0.45rem] h-1 w-1 shrink-0 rounded-full" style={{ background: '#0a6b51' }} aria-hidden />
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
