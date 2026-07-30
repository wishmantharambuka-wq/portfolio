import { useMemo, useRef, useState } from 'react';
import { useContentStore } from '../../lib/contentStore';
import { navigate } from '../../lib/router';
import { ThemeToggle } from '../../components/ThemeToggle';
import { AdminLogin } from './AdminLogin';
import { isSignedIn, signOut } from '../../lib/adminAuth';
import {
  loadConfig,
  saveConfig,
  loadToken,
  saveToken,
  forgetToken,
  maskToken,
  testConnection,
  deployContent,
  type DeployConfig,
  type ConnectionInfo,
  type DeployResult,
} from '../../lib/deploy';
import { defaultContent, type Content, type Project } from '../../data/content';
import {
  Field,
  TextArea,
  Select,
  Slider,
  StringList,
  ItemCard,
  Panel,
  Grid2,
  moveItem,
  newId,
} from './fields';

/* ==========================================================================
 *  ADMIN PANEL  ·  #/admin
 *
 *  Edits live in localStorage (this browser only) and apply to the site
 *  instantly so you can see changes in context. Because GitHub Pages is
 *  static hosting with no backend, making edits public is a deliberate,
 *  explicit step: Publish → downloads content.json → you commit it.
 * ========================================================================== */

const TABS = [
  { id: 'profile', label: 'Profile' },
  { id: 'ds', label: 'Data Science' },
  { id: 'gis', label: 'GIS' },
  { id: 'design', label: 'Design' },
  { id: 'skills', label: 'Skills' },
  { id: 'cv', label: 'CV' },
  { id: 'publish', label: 'Publish' },
] as const;

type TabId = (typeof TABS)[number]['id'];

const emptyProject = (): Project => ({
  id: newId('proj'),
  title: '',
  year: String(new Date().getFullYear()),
  blurb: '',
  problem: '',
  approach: '',
  outcome: '',
  stack: [],
  metrics: [],
  live: '',
  repo: '',
  status: 'wip',
  image: '',
});

export function AdminPage() {
  const [authed, setAuthed] = useState(() => isSignedIn());

  if (!authed) return <AdminLogin onSuccess={() => setAuthed(true)} />;
  return <AdminPanel onSignOut={() => { signOut(); setAuthed(false); }} />;
}

function AdminPanel({ onSignOut }: { onSignOut: () => void }) {
  const { content, update, hasDraft, discardDraft, setContent } = useContentStore();
  const [tab, setTab] = useState<TabId>('profile');

  /** Patch one top-level key of the content tree. */
  const set = <K extends keyof Content>(key: K, value: Content[K]) =>
    update((d) => ({ ...d, [key]: value }));

  return (
    <div className="min-h-screen bg-ash-950 pb-24">
      {/* ---------------- Header ---------------- */}
      <header className="sticky top-0 z-30 border-b border-ash-700/60 bg-ash-950/85 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-5 py-3 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-baseline gap-3">
              <h1 className="font-display text-base font-semibold text-ash-50">Content admin</h1>
              {hasDraft ? (
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest text-amber-400">
                  Unpublished draft
                </span>
              ) : (
                <span className="font-mono text-[10px] uppercase tracking-widest text-ash-500">
                  In sync
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => navigate('home')}
                className="btn-ghost text-xs"
              >
                View site
              </button>
              <button type="button" onClick={onSignOut} className="btn-ghost text-xs">
                Sign out
              </button>
              <ThemeToggle compact />
            </div>
          </div>

          <nav className="-mx-1 mt-3 flex gap-1 overflow-x-auto pb-1">
            {TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  tab === t.id
                    ? 'bg-ds/15 text-ds ring-1 ring-inset ring-ds/30'
                    : 'text-ash-400 hover:bg-ash-800/60 hover:text-ash-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-5 py-8 sm:px-8">
        {tab === 'profile' && <ProfileTab content={content} set={set} update={update} />}

        {tab === 'ds' && (
          <ProjectsTab
            title="Data Science projects"
            description="Priority 01. The problem / approach / outcome trio is what a technical reviewer reads — fill all three."
            projects={content.dataScience}
            onChange={(v) => set('dataScience', v)}
          />
        )}

        {tab === 'gis' && (
          <ProjectsTab
            title="GIS & Geospatial projects"
            description="Priority 02."
            projects={content.gis}
            onChange={(v) => set('gis', v)}
          />
        )}

        {tab === 'design' && <DesignTab content={content} set={set} />}
        {tab === 'skills' && <SkillsTab content={content} set={set} />}
        {tab === 'cv' && <CvTab content={content} update={update} />}
        {tab === 'publish' && (
          <PublishTab
            content={content}
            hasDraft={hasDraft}
            discardDraft={discardDraft}
            setContent={setContent}
          />
        )}
      </main>
    </div>
  );
}

/* ------------------------------ Profile ---------------------------------- */

function ProfileTab({
  content,
  set,
  update,
}: {
  content: Content;
  set: <K extends keyof Content>(k: K, v: Content[K]) => void;
  update: (fn: (d: Content) => Content) => void;
}) {
  const { profile, links, sectionCopy, hero, assets, careerPaths } = content;
  const patchProfile = (p: Partial<Content['profile']>) => set('profile', { ...profile, ...p });
  const patchLinks = (p: Partial<Content['links']>) => set('links', { ...links, ...p });
  const patchHero = (p: Partial<Content['hero']>) => set('hero', { ...hero, ...p });

  return (
    <>
      <Panel
        title="Cover"
        description="The homepage lockup: label, the big word, and the inverted name plate."
      >
        <div className="space-y-4">
          <Field
            label="Label (above the word)"
            value={hero.label}
            onChange={(v) => patchHero({ label: v })}
            hint="Set in wide letter-spacing — keep it short."
          />
          <Grid2>
            <Field
              label="Display word — top line"
              value={hero.wordTop}
              onChange={(v) => patchHero({ wordTop: v })}
              hint="Solid fill. Auto-sized to fit, so any length works."
            />
            <Field
              label="Display word — bottom line"
              value={hero.wordBottom}
              onChange={(v) => patchHero({ wordBottom: v })}
              hint="Rendered as an outline."
            />
          </Grid2>
          <Grid2>
            <Field
              label="Year"
              value={hero.yearRange}
              onChange={(v) => patchHero({ yearRange: v })}
              hint="Split across two lines in the badge — 4 characters."
            />
            <Field
              label="Badge text"
              value={hero.badge}
              onChange={(v) => patchHero({ badge: v })}
            />
          </Grid2>
          <StringList
            label="Role lines"
            values={hero.roleLines}
            onChange={(v) => patchHero({ roleLines: v })}
            hint="One per line. Set in wide tracking beside the rule — keep each short."
          />
          <Field
            label="Name (below the panel)"
            value={hero.plateName}
            onChange={(v) => patchHero({ plateName: v })}
          />
        </div>
      </Panel>

      <Panel
        title="Image slots"
        description="Optional. Leave blank to use the built-in coded graphics, which are the default and always look finished."
      >
        <div className="space-y-4">
          <Field
            label="Hero letter texture"
            value={assets.heroTexture}
            onChange={(v) => set('assets', { ...assets, heroTexture: v })}
            placeholder="/assets/hero-texture.jpg"
            hint="Fills the inside of the top display word. Blank = coded gradient."
          />
          <Field
            label="Cover subject"
            value={assets.heroSubject}
            onChange={(v) => set('assets', { ...assets, heroSubject: v })}
            placeholder="/assets/hero-subject.png"
            hint="Cut-out subject threaded between the two display lines — in front of the top word, behind the bottom one. Transparent PNG. Blank = coded rings."
          />
          <Field
            label="Lamp graphic"
            value={assets.lamp}
            onChange={(v) => set('assets', { ...assets, lamp: v })}
            placeholder="/assets/lamp.png"
            hint="Replaces the drawn lamp shade. Blank = drawn SVG lamp. Transparent PNG works best."
          />
        </div>
      </Panel>

      <Panel
        title="Career paths"
        description="The three columns on the second screen."
        actions={
          <button
            type="button"
            className="btn-primary text-xs"
            onClick={() =>
              set('careerPaths', [
                ...careerPaths,
                {
                  id: newId('path'),
                  no: String(careerPaths.length + 1).padStart(2, '0'),
                  title: '',
                  subtitle: '',
                  body: '',
                  accent: 'ds',
                  target: 'data-science',
                },
              ])
            }
          >
            + Add path
          </button>
        }
      >
        <div className="space-y-3">
          {careerPaths.map((p, i) => (
            <ItemCard
              key={p.id}
              index={i}
              total={careerPaths.length}
              title={p.title}
              subtitle={p.subtitle}
              onMove={(from, to) => set('careerPaths', moveItem(careerPaths, from, to))}
              onRemove={(idx) => set('careerPaths', careerPaths.filter((_, j) => j !== idx))}
            >
              <Grid2>
                <Field
                  label="Number"
                  value={p.no}
                  onChange={(v) =>
                    set('careerPaths', careerPaths.map((x, j) => (j === i ? { ...x, no: v } : x)))
                  }
                />
                <Field
                  label="Title"
                  value={p.title}
                  onChange={(v) =>
                    set('careerPaths', careerPaths.map((x, j) => (j === i ? { ...x, title: v } : x)))
                  }
                />
              </Grid2>
              <Field
                label="Subtitle"
                value={p.subtitle}
                onChange={(v) =>
                  set('careerPaths', careerPaths.map((x, j) => (j === i ? { ...x, subtitle: v } : x)))
                }
                hint="Small mono label, e.g. 'The destination'."
              />
              <TextArea
                label="Body"
                rows={3}
                value={p.body}
                onChange={(v) =>
                  set('careerPaths', careerPaths.map((x, j) => (j === i ? { ...x, body: v } : x)))
                }
              />
              <Grid2>
                <Select
                  label="Accent"
                  value={p.accent}
                  onChange={(v) =>
                    set('careerPaths', careerPaths.map((x, j) => (j === i ? { ...x, accent: v } : x)))
                  }
                  options={[
                    { value: 'ds', label: 'Copper (Data Science)' },
                    { value: 'gis', label: 'Slate (GIS)' },
                    { value: 'gfx', label: 'Sand (Design)' },
                  ]}
                />
                <Select
                  label="Links to section"
                  value={p.target}
                  onChange={(v) =>
                    set('careerPaths', careerPaths.map((x, j) => (j === i ? { ...x, target: v } : x)))
                  }
                  options={[
                    { value: 'data-science', label: 'Data Science' },
                    { value: 'gis', label: 'GIS' },
                    { value: 'design', label: 'Design' },
                    { value: 'skills', label: 'Toolkit' },
                    { value: 'about', label: 'About' },
                  ]}
                />
              </Grid2>
            </ItemCard>
          ))}
        </div>
      </Panel>

      <Panel title="Identity" description="Shown in the loader, the About section and the footer.">
        <div className="space-y-4">
          <Grid2>
            <Field
              label="Display name"
              value={profile.name}
              onChange={(v) => patchProfile({ name: v })}
              hint="Split across two hero lines at the last space."
            />
            <Field
              label="Short name (wordmark)"
              value={profile.shortName}
              onChange={(v) => patchProfile({ shortName: v })}
            />
          </Grid2>
          <Grid2>
            <Field
              label="Location"
              value={profile.location}
              onChange={(v) => patchProfile({ location: v })}
            />
            <StringList
              label="Roles"
              values={profile.roles}
              onChange={(v) => patchProfile({ roles: v })}
              hint="One per line. The first is highlighted — keep Data Scientist first."
            />
          </Grid2>
          <TextArea
            label="Tagline"
            value={profile.tagline}
            rows={2}
            onChange={(v) => patchProfile({ tagline: v })}
          />
          <TextArea
            label="About intro"
            value={profile.intro}
            rows={8}
            onChange={(v) => patchProfile({ intro: v })}
            hint="Line breaks are preserved."
          />
          <TextArea
            label="Seeking (contact section)"
            value={profile.seeking}
            rows={2}
            onChange={(v) => patchProfile({ seeking: v })}
          />
        </div>
      </Panel>

      <Panel title="Contact links" description="Blank fields are hidden from the site entirely.">
        <div className="space-y-4">
          <Grid2>
            <Field
              label="Primary email"
              value={links.email}
              onChange={(v) => patchLinks({ email: v })}
            />
            <Field
              label="Secondary email"
              value={links.emailAlt}
              onChange={(v) => patchLinks({ emailAlt: v })}
            />
          </Grid2>
          <Grid2>
            <Field
              label="Phone (display)"
              value={links.phone}
              onChange={(v) => patchLinks({ phone: v })}
              hint="How it appears, e.g. +94 77 470 5048"
            />
            <Field
              label="WhatsApp number"
              value={links.whatsapp}
              onChange={(v) => patchLinks({ whatsapp: v })}
              hint="Country code, digits only — 94774705048"
            />
          </Grid2>
          <Grid2>
            <Field
              label="LinkedIn URL"
              value={links.linkedin}
              onChange={(v) => patchLinks({ linkedin: v })}
            />
            <Field
              label="GitHub URL"
              value={links.github}
              onChange={(v) => patchLinks({ github: v })}
            />
          </Grid2>
          <Field
            label="Design portfolio URL"
            value={links.behance}
            onChange={(v) => patchLinks({ behance: v })}
            hint="Behance, Dribbble — leave blank to hide."
          />
        </div>
      </Panel>

      <Panel title="Section headings" description="The headline and intro paragraph of each section.">
        <div className="space-y-5">
          {(
            [
              ['about', 'About'],
              ['dataScience', 'Data Science'],
              ['gis', 'GIS'],
              ['design', 'Design'],
              ['skills', 'Skills'],
              ['contact', 'Contact'],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="rounded-xl border border-ash-700/60 p-4">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-ash-500">
                {label}
              </p>
              <div className="space-y-3">
                <Field
                  label="Title"
                  value={sectionCopy[key].title}
                  onChange={(v) =>
                    update((d) => ({
                      ...d,
                      sectionCopy: {
                        ...d.sectionCopy,
                        [key]: { ...d.sectionCopy[key], title: v },
                      },
                    }))
                  }
                />
                <TextArea
                  label="Lede"
                  rows={3}
                  value={sectionCopy[key].lede}
                  onChange={(v) =>
                    update((d) => ({
                      ...d,
                      sectionCopy: {
                        ...d.sectionCopy,
                        [key]: { ...d.sectionCopy[key], lede: v },
                      },
                    }))
                  }
                />
              </div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Education (About section)" description="The cards beside your intro.">
        <div className="space-y-3">
          {profile.education.map((e, i) => (
            <ItemCard
              key={e.id}
              index={i}
              total={profile.education.length}
              title={e.degree}
              subtitle={e.org}
              onMove={(from, to) =>
                patchProfile({ education: moveItem(profile.education, from, to) })
              }
              onRemove={(idx) =>
                patchProfile({ education: profile.education.filter((_, j) => j !== idx) })
              }
            >
              {(
                [
                  ['degree', 'Degree'],
                  ['org', 'Institution'],
                  ['period', 'Period'],
                ] as const
              ).map(([k, label]) => (
                <Field
                  key={k}
                  label={label}
                  value={e[k]}
                  onChange={(v) =>
                    patchProfile({
                      education: profile.education.map((x, j) =>
                        j === i ? { ...x, [k]: v } : x,
                      ),
                    })
                  }
                />
              ))}
              <TextArea
                label="Note"
                rows={2}
                value={e.note}
                onChange={(v) =>
                  patchProfile({
                    education: profile.education.map((x, j) => (j === i ? { ...x, note: v } : x)),
                  })
                }
              />
            </ItemCard>
          ))}

          <button
            type="button"
            className="btn-ghost w-full"
            onClick={() =>
              patchProfile({
                education: [
                  ...profile.education,
                  { id: newId('edu'), degree: '', org: '', period: '', note: '' },
                ],
              })
            }
          >
            + Add education
          </button>
        </div>
      </Panel>
    </>
  );
}

/* ------------------------------ Projects --------------------------------- */

function ProjectsTab({
  title,
  description,
  projects,
  onChange,
}: {
  title: string;
  description: string;
  projects: Project[];
  onChange: (p: Project[]) => void;
}) {
  const patch = (i: number, p: Partial<Project>) =>
    onChange(projects.map((x, j) => (j === i ? { ...x, ...p } : x)));

  return (
    <Panel
      title={title}
      description={description}
      actions={
        <button
          type="button"
          className="btn-primary text-xs"
          onClick={() => onChange([emptyProject(), ...projects])}
        >
          + Add project
        </button>
      }
    >
      <div className="space-y-3">
        {projects.length === 0 && (
          <p className="rounded-xl border border-dashed border-ash-700 p-6 text-center text-sm text-ash-500">
            No projects yet.
          </p>
        )}

        {projects.map((p, i) => (
          <ItemCard
            key={p.id}
            index={i}
            total={projects.length}
            title={p.title}
            subtitle={p.blurb}
            onMove={(from, to) => onChange(moveItem(projects, from, to))}
            onRemove={(idx) => onChange(projects.filter((_, j) => j !== idx))}
          >
            <Grid2>
              <Field label="Title" value={p.title} onChange={(v) => patch(i, { title: v })} />
              <Field label="Year" value={p.year} onChange={(v) => patch(i, { year: v })} />
            </Grid2>

            <TextArea
              label="Blurb"
              rows={2}
              value={p.blurb}
              onChange={(v) => patch(i, { blurb: v })}
              hint="One line, shown on the collapsed card."
            />

            <TextArea
              label="Problem"
              rows={3}
              value={p.problem}
              onChange={(v) => patch(i, { problem: v })}
              hint="The question you were answering."
            />
            <TextArea
              label="Approach"
              rows={3}
              value={p.approach}
              onChange={(v) => patch(i, { approach: v })}
              hint="How you attacked it."
            />
            <TextArea
              label="Outcome"
              rows={3}
              value={p.outcome}
              onChange={(v) => patch(i, { outcome: v })}
              hint="What came out. Numbers beat adjectives."
            />

            <StringList
              label="Tech stack"
              values={p.stack}
              onChange={(v) => patch(i, { stack: v })}
            />

            <Grid2>
              <Field label="Live URL" value={p.live} onChange={(v) => patch(i, { live: v })} />
              <Field label="Repo URL" value={p.repo} onChange={(v) => patch(i, { repo: v })} />
            </Grid2>

            <Field
              label="Thumbnail image"
              value={p.image}
              onChange={(v) => patch(i, { image: v })}
              placeholder="/assets/projects/my-project.jpg"
              hint="Screenshot of the project. Blank = generated placeholder. ~1200px wide."
            />

            <Select
              label="Status"
              value={p.status}
              onChange={(v) => patch(i, { status: v })}
              options={[
                { value: 'live', label: 'Live' },
                { value: 'wip', label: 'In progress' },
                { value: 'draft', label: 'Planned (dimmed)' },
              ]}
            />

            {/* Metrics */}
            <div>
              <p className="mb-2 text-xs font-medium text-ash-300">Metrics (stat strip)</p>
              <div className="space-y-2">
                {p.metrics.map((m, mi) => (
                  <div key={mi} className="flex gap-2">
                    <input
                      className="field"
                      placeholder="Label — e.g. Regions"
                      value={m.label}
                      onChange={(e) =>
                        patch(i, {
                          metrics: p.metrics.map((x, j) =>
                            j === mi ? { ...x, label: e.target.value } : x,
                          ),
                        })
                      }
                    />
                    <input
                      className="field"
                      placeholder="Value — e.g. 331"
                      value={m.value}
                      onChange={(e) =>
                        patch(i, {
                          metrics: p.metrics.map((x, j) =>
                            j === mi ? { ...x, value: e.target.value } : x,
                          ),
                        })
                      }
                    />
                    <button
                      type="button"
                      aria-label="Remove metric"
                      className="shrink-0 rounded-lg px-3 text-red-400 transition hover:bg-red-500/10"
                      onClick={() =>
                        patch(i, { metrics: p.metrics.filter((_, j) => j !== mi) })
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  className="btn-ghost w-full text-xs"
                  onClick={() => patch(i, { metrics: [...p.metrics, { label: '', value: '' }] })}
                >
                  + Add metric
                </button>
              </div>
            </div>
          </ItemCard>
        ))}
      </div>
    </Panel>
  );
}

/* ------------------------------- Design ---------------------------------- */

function DesignTab({
  content,
  set,
}: {
  content: Content;
  set: <K extends keyof Content>(k: K, v: Content[K]) => void;
}) {
  const pieces = content.design;
  const patch = (i: number, p: Partial<Content['design'][number]>) =>
    set('design', pieces.map((x, j) => (j === i ? { ...x, ...p } : x)));

  return (
    <Panel
      title="Graphic design gallery"
      description="Drop artwork into public/assets/design/ then set the image path below. Pieces with no image show a generated gradient tile."
      actions={
        <button
          type="button"
          className="btn-primary text-xs"
          onClick={() =>
            set('design', [
              ...pieces,
              {
                id: newId('gfx'),
                title: '',
                kind: '',
                year: String(new Date().getFullYear()),
                note: '',
                image: '',
                hue: Math.floor(Math.random() * 360),
              },
            ])
          }
        >
          + Add piece
        </button>
      }
    >
      <div className="space-y-3">
        {pieces.map((piece, i) => (
          <ItemCard
            key={piece.id}
            index={i}
            total={pieces.length}
            title={piece.title}
            subtitle={piece.kind}
            onMove={(from, to) => set('design', moveItem(pieces, from, to))}
            onRemove={(idx) => set('design', pieces.filter((_, j) => j !== idx))}
          >
            <Grid2>
              <Field label="Title" value={piece.title} onChange={(v) => patch(i, { title: v })} />
              <Field
                label="Kind"
                value={piece.kind}
                onChange={(v) => patch(i, { kind: v })}
                hint="Identity, Layout, Motion…"
              />
            </Grid2>
            <Grid2>
              <Field label="Year" value={piece.year} onChange={(v) => patch(i, { year: v })} />
              <Field
                label="Image path"
                value={piece.image}
                onChange={(v) => patch(i, { image: v })}
                placeholder="/assets/design/my-poster.jpg"
              />
            </Grid2>
            <TextArea
              label="Note"
              rows={2}
              value={piece.note}
              onChange={(v) => patch(i, { note: v })}
            />

            <div>
              <Slider
                label="Placeholder hue"
                value={piece.hue}
                min={0}
                max={360}
                step={1}
                onChange={(v) => patch(i, { hue: v })}
              />
              <div
                className="mt-2 h-12 rounded-lg"
                aria-hidden
                style={{
                  background: `radial-gradient(120% 90% at 20% 15%, hsl(${piece.hue} 55% 62% / .5), transparent 62%), radial-gradient(100% 80% at 85% 80%, hsl(${(piece.hue + 55) % 360} 50% 58% / .4), transparent 60%)`,
                }}
              />
            </div>
          </ItemCard>
        ))}
      </div>
    </Panel>
  );
}

/* ------------------------------- Skills ---------------------------------- */

function SkillsTab({
  content,
  set,
}: {
  content: Content;
  set: <K extends keyof Content>(k: K, v: Content[K]) => void;
}) {
  const groups = content.skills;

  return (
    <Panel title="Skill groups" description="Levels drive the bar widths. Be honest — it reads better.">
      <div className="space-y-4">
        {groups.map((g, gi) => (
          <div key={g.id} className="rounded-xl border border-ash-700/70 p-4">
            <Grid2>
              <Field
                label="Group label"
                value={g.label}
                onChange={(v) =>
                  set('skills', groups.map((x, j) => (j === gi ? { ...x, label: v } : x)))
                }
              />
              <Select
                label="Accent"
                value={g.accent}
                onChange={(v) =>
                  set('skills', groups.map((x, j) => (j === gi ? { ...x, accent: v } : x)))
                }
                options={[
                  { value: 'ds', label: 'Data Science (teal)' },
                  { value: 'gis', label: 'GIS (lime)' },
                  { value: 'gfx', label: 'Design (violet)' },
                ]}
              />
            </Grid2>

            <div className="mt-4 space-y-3">
              {g.items.map((item, ii) => (
                <div key={ii} className="flex items-end gap-3">
                  <div className="flex-1">
                    <input
                      className="field"
                      value={item.name}
                      placeholder="Skill name"
                      onChange={(e) =>
                        set('skills', groups.map((x, j) =>
                          j === gi
                            ? {
                                ...x,
                                items: x.items.map((it, k) =>
                                  k === ii ? { ...it, name: e.target.value } : it,
                                ),
                              }
                            : x,
                        ))
                      }
                    />
                  </div>
                  <div className="w-40">
                    <Slider
                      label=""
                      value={item.level}
                      onChange={(v) =>
                        set('skills', groups.map((x, j) =>
                          j === gi
                            ? {
                                ...x,
                                items: x.items.map((it, k) =>
                                  k === ii ? { ...it, level: v } : it,
                                ),
                              }
                            : x,
                        ))
                      }
                    />
                  </div>
                  <button
                    type="button"
                    aria-label="Remove skill"
                    className="mb-1 rounded-lg px-2 py-1 text-red-400 transition hover:bg-red-500/10"
                    onClick={() =>
                      set('skills', groups.map((x, j) =>
                        j === gi ? { ...x, items: x.items.filter((_, k) => k !== ii) } : x,
                      ))
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}

              <button
                type="button"
                className="btn-ghost w-full text-xs"
                onClick={() =>
                  set('skills', groups.map((x, j) =>
                    j === gi ? { ...x, items: [...x.items, { name: '', level: 0.5 }] } : x,
                  ))
                }
              >
                + Add skill to {g.label}
              </button>
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

/* --------------------------------- CV ------------------------------------ */

function CvTab({
  content,
  update,
}: {
  content: Content;
  update: (fn: (d: Content) => Content) => void;
}) {
  const { cv } = content;
  const patchCv = (p: Partial<Content['cv']>) => update((d) => ({ ...d, cv: { ...d.cv, ...p } }));

  const allProjects = useMemo(
    () => [...content.dataScience, ...content.gis],
    [content.dataScience, content.gis],
  );

  const entryEditor = (
    listKey: 'education' | 'experience',
    label: string,
  ) => (
    <Panel
      title={label}
      actions={
        <button
          type="button"
          className="btn-primary text-xs"
          onClick={() =>
            patchCv({
              [listKey]: [
                ...cv[listKey],
                { id: newId(listKey), title: '', org: '', period: '', detail: '', bullets: [] },
              ],
            } as Partial<Content['cv']>)
          }
        >
          + Add
        </button>
      }
    >
      <div className="space-y-3">
        {cv[listKey].map((e, i) => (
          <ItemCard
            key={e.id}
            index={i}
            total={cv[listKey].length}
            title={e.title}
            subtitle={e.org}
            onMove={(from, to) =>
              patchCv({ [listKey]: moveItem(cv[listKey], from, to) } as Partial<Content['cv']>)
            }
            onRemove={(idx) =>
              patchCv({
                [listKey]: cv[listKey].filter((_, j) => j !== idx),
              } as Partial<Content['cv']>)
            }
          >
            <Field
              label="Title"
              value={e.title}
              onChange={(v) =>
                patchCv({
                  [listKey]: cv[listKey].map((x, j) => (j === i ? { ...x, title: v } : x)),
                } as Partial<Content['cv']>)
              }
            />
            <Grid2>
              <Field
                label="Organisation"
                value={e.org}
                onChange={(v) =>
                  patchCv({
                    [listKey]: cv[listKey].map((x, j) => (j === i ? { ...x, org: v } : x)),
                  } as Partial<Content['cv']>)
                }
              />
              <Field
                label="Period"
                value={e.period}
                onChange={(v) =>
                  patchCv({
                    [listKey]: cv[listKey].map((x, j) => (j === i ? { ...x, period: v } : x)),
                  } as Partial<Content['cv']>)
                }
              />
            </Grid2>
            <Field
              label="Detail line"
              value={e.detail}
              onChange={(v) =>
                patchCv({
                  [listKey]: cv[listKey].map((x, j) => (j === i ? { ...x, detail: v } : x)),
                } as Partial<Content['cv']>)
              }
              hint="e.g. results, department, focus."
            />
            <StringList
              label="Bullets"
              values={e.bullets}
              onChange={(v) =>
                patchCv({
                  [listKey]: cv[listKey].map((x, j) => (j === i ? { ...x, bullets: v } : x)),
                } as Partial<Content['cv']>)
              }
            />
          </ItemCard>
        ))}
      </div>
    </Panel>
  );

  return (
    <>
      <Panel title="CV header" description="Use your full legal name here — this is the document employers file.">
        <div className="space-y-4">
          <Field
            label="Full name"
            value={cv.fullName}
            onChange={(v) => patchCv({ fullName: v })}
          />
          <Field
            label="Headline"
            value={cv.headline}
            onChange={(v) => patchCv({ headline: v })}
          />
          <TextArea
            label="Profile summary"
            rows={6}
            value={cv.summary}
            onChange={(v) => patchCv({ summary: v })}
          />
          <p className="rounded-lg border border-ash-700/60 p-3 text-[11px] text-ash-400">
            Contact details on the CV come from the <strong>Profile</strong> tab, so they can
            never disagree with the site.
          </p>
        </div>
      </Panel>

      {entryEditor('education', 'Education')}
      {entryEditor('experience', 'Experience')}

      <Panel
        title="Selected projects on the CV"
        description="Tick which portfolio projects appear. They stay in sync with the project tabs automatically."
      >
        <div className="grid gap-2 sm:grid-cols-2">
          {allProjects.map((p) => {
            const on = cv.featuredProjectIds.includes(p.id);
            return (
              <label
                key={p.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                  on ? 'border-ds/40 bg-ds/[0.07]' : 'border-ash-700/60 hover:border-ash-600'
                }`}
              >
                <input
                  type="checkbox"
                  checked={on}
                  className="mt-0.5 accent-[rgb(var(--accent-ds))]"
                  onChange={() =>
                    patchCv({
                      featuredProjectIds: on
                        ? cv.featuredProjectIds.filter((x) => x !== p.id)
                        : [...cv.featuredProjectIds, p.id],
                    })
                  }
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm text-ash-100">
                    {p.title || 'Untitled'}
                  </span>
                  <span className="block truncate text-[11px] text-ash-500">{p.year}</span>
                </span>
              </label>
            );
          })}
        </div>
      </Panel>

      <Panel title="Additional sections">
        <div className="space-y-4">
          <StringList
            label="Achievements"
            values={cv.achievements}
            onChange={(v) => patchCv({ achievements: v })}
          />
          <StringList
            label="Interests"
            values={cv.interests}
            onChange={(v) => patchCv({ interests: v })}
          />

          <div>
            <p className="mb-2 text-xs font-medium text-ash-300">Languages</p>
            <div className="space-y-2">
              {cv.languages.map((l, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    className="field"
                    placeholder="Language"
                    value={l.name}
                    onChange={(e) =>
                      patchCv({
                        languages: cv.languages.map((x, j) =>
                          j === i ? { ...x, name: e.target.value } : x,
                        ),
                      })
                    }
                  />
                  <input
                    className="field"
                    placeholder="Level"
                    value={l.level}
                    onChange={(e) =>
                      patchCv({
                        languages: cv.languages.map((x, j) =>
                          j === i ? { ...x, level: e.target.value } : x,
                        ),
                      })
                    }
                  />
                  <button
                    type="button"
                    aria-label="Remove language"
                    className="shrink-0 rounded-lg px-3 text-red-400 transition hover:bg-red-500/10"
                    onClick={() =>
                      patchCv({ languages: cv.languages.filter((_, j) => j !== i) })
                    }
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                type="button"
                className="btn-ghost w-full text-xs"
                onClick={() =>
                  patchCv({ languages: [...cv.languages, { name: '', level: '' }] })
                }
              >
                + Add language
              </button>
            </div>
          </div>

          <Field
            label="Referees"
            value={cv.referees}
            onChange={(v) => patchCv({ referees: v })}
          />
          <Field
            label="Pre-made PDF path"
            value={cv.pdfUrl}
            onChange={(v) => patchCv({ pdfUrl: v })}
            placeholder="/assets/Chamod-CV.pdf"
            hint="Drop a PDF in public/assets/ and point here. Blank = the Download button opens the browser print dialog instead."
          />
        </div>
      </Panel>
    </>
  );
}

/* ------------------------------- Publish --------------------------------- */

function PublishTab({
  content,
  hasDraft,
  discardDraft,
  setContent,
}: {
  content: Content;
  hasDraft: boolean;
  discardDraft: () => void;
  setContent: (c: Content) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

  const download = () => {
    const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content.json';
    a.click();
    URL.revokeObjectURL(url);
    setMessage('content.json downloaded — now copy it into public/ and commit.');
  };

  const onImport = (file: File) => {
    file
      .text()
      .then((text) => {
        const parsed = JSON.parse(text) as Content;
        if (!parsed || typeof parsed !== 'object' || !parsed.profile) {
          throw new Error('That file does not look like a content.json.');
        }
        setContent(parsed);
        setMessage('Imported. Your draft now matches that file.');
      })
      .catch((e: unknown) => setMessage(`Import failed: ${String(e)}`));
  };

  return (
    <>
      <DeployPanel content={content} />

      <Panel
        title="Manual export (fallback)"
        description="If you'd rather not connect a token, publish by hand: download the file, drop it into the repo, commit."
      >
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={download} className="btn-ghost">
            Download content.json
          </button>
          <span className="font-mono text-[11px] text-ash-400">
            → save as <code className="text-ash-200">public/content.json</code> → commit → the host
            rebuilds
          </span>
        </div>
      </Panel>

      <Panel
        title="Draft state"
        description="Edits live in this browser only until you publish. Clearing site data will lose them — export first."
      >
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-widest ${
              hasDraft
                ? 'border border-amber-500/30 bg-amber-500/10 text-amber-400'
                : 'border border-ash-600/40 text-ash-400'
            }`}
          >
            {hasDraft ? 'Unpublished draft' : 'No local changes'}
          </span>

          <button
            type="button"
            className="btn-ghost"
            onClick={() => fileInput.current?.click()}
          >
            Import content.json
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onImport(f);
              e.target.value = '';
            }}
          />

          <button
            type="button"
            className="btn-danger"
            disabled={!hasDraft}
            onClick={() => {
              if (confirm('Discard all local edits and go back to the published content?')) {
                discardDraft();
                setMessage('Local draft discarded.');
              }
            }}
          >
            Discard draft
          </button>

          <button
            type="button"
            className="btn-danger"
            onClick={() => {
              if (confirm('Reset everything to the original built-in content?')) {
                setContent(JSON.parse(JSON.stringify(defaultContent)) as Content);
                setMessage('Reset to built-in defaults.');
              }
            }}
          >
            Reset to defaults
          </button>
        </div>

        {message && <p className="mt-4 text-sm text-ds">{message}</p>}
      </Panel>

      <Panel title="A note on access">
        <p className="text-sm leading-relaxed text-ash-400">
          This panel is <strong className="text-ash-200">not password protected</strong>, and
          adding a password here would be theatre rather than security — anyone can read the code
          of a static site. It doesn&apos;t need one: the panel only edits{' '}
          <em>your own browser&apos;s</em> copy. A stranger opening{' '}
          <code className="text-ash-200">#/admin</code> can change what they see on their screen
          and nothing else. What visitors see only changes when you commit{' '}
          <code className="text-ash-200">content.json</code> — and that needs access to your
          GitHub repository.
        </p>
      </Panel>
    </>
  );
}

/* ---------------------------- deploy panel ------------------------------- */

/**
 * One-click deploy. Commits content.json to GitHub via the Contents API; the
 * host (Vercel / GitHub Pages) rebuilds on that commit. No terminal needed.
 *
 * The token lives only in this browser's localStorage — see src/lib/deploy.ts
 * for the security reasoning and the required token scope.
 */
function DeployPanel({ content }: { content: Content }) {
  const [config, setConfig] = useState<DeployConfig>(() => loadConfig());
  const [token, setToken] = useState<string>(() => loadToken());
  const [tokenDirty, setTokenDirty] = useState(false);
  const [status, setStatus] = useState<'idle' | 'testing' | 'deploying'>('idle');
  const [info, setInfo] = useState<ConnectionInfo | null>(null);
  const [error, setError] = useState('');
  const [result, setResult] = useState<DeployResult | null>(null);

  const patch = (p: Partial<DeployConfig>) => {
    const next = { ...config, ...p };
    setConfig(next);
    saveConfig(next);
    setInfo(null);
  };

  const commitToken = () => {
    saveToken(token);
    setTokenDirty(false);
    setInfo(null);
  };

  const ready = Boolean(config.owner && config.repo && token);

  const runTest = async () => {
    setStatus('testing');
    setError('');
    setResult(null);
    try {
      commitToken();
      setInfo(await testConnection(config, token));
    } catch (e) {
      setInfo(null);
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStatus('idle');
    }
  };

  const runDeploy = async () => {
    setStatus('deploying');
    setError('');
    setResult(null);
    try {
      commitToken();
      const json = JSON.stringify(content, null, 2);
      setResult(await deployContent(config, token, json));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setStatus('idle');
    }
  };

  return (
    <>
      <Panel
        title="Deploy to the live site"
        description="Commits your content straight to GitHub from this page. Your host rebuilds automatically — no VS Code, no terminal."
        actions={
          <span
            className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-widest ${
              ready
                ? 'border border-ds/30 bg-ds/10 text-ds'
                : 'border border-ash-600/40 text-ash-400'
            }`}
          >
            {ready ? 'Connected' : 'Not connected'}
          </span>
        }
      >
        <div className="space-y-4">
          <Grid2>
            <Field
              label="GitHub owner (your username)"
              value={config.owner}
              onChange={(v) => patch({ owner: v.trim() })}
              placeholder="wishmantharambuka-wq"
            />
            <Field
              label="Repository name"
              value={config.repo}
              onChange={(v) => patch({ repo: v.trim() })}
              placeholder="portfolio"
            />
          </Grid2>

          <Grid2>
            <Field
              label="Branch"
              value={config.branch}
              onChange={(v) => patch({ branch: v.trim() })}
              placeholder="main"
            />
            <Field
              label="File path in the repo"
              value={config.path}
              onChange={(v) => patch({ path: v.trim() })}
              hint="Leave as public/content.json unless you moved it."
            />
          </Grid2>

          {/* Token */}
          <div>
            <label
              htmlFor="deploy-token"
              className="mb-1.5 block text-xs font-medium text-ash-300"
            >
              Fine-grained GitHub token
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                id="deploy-token"
                type="password"
                autoComplete="off"
                spellCheck={false}
                className="field flex-1"
                placeholder="github_pat_…"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  setTokenDirty(true);
                }}
              />
              {tokenDirty ? (
                <button type="button" onClick={commitToken} className="btn-ghost shrink-0">
                  Save token
                </button>
              ) : (
                token && (
                  <button
                    type="button"
                    className="btn-danger shrink-0"
                    onClick={() => {
                      forgetToken();
                      setToken('');
                      setInfo(null);
                    }}
                  >
                    Forget
                  </button>
                )
              )}
            </div>
            {token && !tokenDirty && (
              <p className="mt-1 font-mono text-[11px] text-ash-500">
                Stored in this browser: {maskToken(token)}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-3 border-t border-ash-700/60 pt-4">
            <button
              type="button"
              onClick={runDeploy}
              disabled={!ready || status !== 'idle'}
              className="btn-primary"
            >
              {status === 'deploying' ? 'Deploying…' : 'Deploy now'}
            </button>
            <button
              type="button"
              onClick={runTest}
              disabled={!ready || status !== 'idle'}
              className="btn-ghost"
            >
              {status === 'testing' ? 'Checking…' : 'Test connection'}
            </button>
          </div>

          {/* Feedback */}
          {info && !error && (
            <div className="rounded-lg border border-ds/25 bg-ds/[0.06] p-3 text-sm text-ash-200">
              <p>
                Connected to <strong className="text-ash-50">{info.repoFullName}</strong>
                {' · '}default branch <code className="text-ash-100">{info.defaultBranch}</code>
              </p>
              <p className="mt-1 text-[13px] text-ash-300">
                {info.fileExists
                  ? 'content.json exists and will be updated.'
                  : 'content.json does not exist yet — the first deploy will create it.'}
                {!info.canWrite && ' ⚠ This token may not have write access.'}
              </p>
            </div>
          )}

          {result && (
            <div className="rounded-lg border border-ds/30 bg-ds/[0.08] p-3 text-sm text-ash-200">
              <p className="font-medium text-ash-50">
                {result.created ? 'Created' : 'Updated'} content.json — commit{' '}
                <code className="text-ds">{result.commitSha}</code>
              </p>
              <p className="mt-1 text-[13px] text-ash-300">
                Your host is rebuilding now. The live site usually updates within a minute —
                then hard-refresh it.
              </p>
              <a
                href={result.commitUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-2 inline-block font-mono text-[11px] text-ds underline"
              >
                View the commit on GitHub ↗
              </a>
            </div>
          )}

          {error && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/[0.08] p-3 text-sm text-red-300"
            >
              {error}
            </div>
          )}
        </div>
      </Panel>

      <Panel title="How to get the token (one time)">
        <ol className="space-y-3">
          <Step n={1} title="Open GitHub’s fine-grained token page">
            <p className="text-sm text-ash-400">
              github.com → Settings → Developer settings → Personal access tokens →{' '}
              <strong className="text-ash-200">Fine-grained tokens</strong> → Generate new token.
            </p>
          </Step>
          <Step n={2} title="Scope it as tightly as possible">
            <ul className="mt-1 space-y-1 text-sm text-ash-400">
              <li>
                • Repository access → <strong className="text-ash-200">Only select repositories</strong> →
                pick just your portfolio repo
              </li>
              <li>
                • Permissions → Repository permissions →{' '}
                <strong className="text-ash-200">Contents: Read and write</strong> (nothing else)
              </li>
              <li>• Expiration → set one, e.g. 90 days</li>
            </ul>
          </Step>
          <Step n={3} title="Paste it above and hit Test connection">
            <p className="text-sm text-ash-400">
              It is saved in this browser only. When it expires, generate another and paste it again.
            </p>
          </Step>
        </ol>

        <div className="mt-5 rounded-lg border border-amber-500/25 bg-amber-500/[0.07] p-3 text-[13px] leading-relaxed text-amber-200/90">
          <strong className="text-amber-200">Be honest about the trade-off.</strong> A static site
          has no server to hide a token in, so it lives in this browser&apos;s storage. That is why
          the scope above matters: if that token ever leaked, someone could edit files in that{' '}
          <em>one</em> repository — not your account, not your other repos. Never paste a{' '}
          <strong className="text-amber-200">classic</strong> token here; those are account-wide.
        </div>
      </Panel>
    </>
  );
}

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-ds/30 bg-ds/10 font-mono text-xs text-ds">
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="font-display text-sm font-semibold text-ash-50">{title}</h3>
        <div className="mt-1">{children}</div>
      </div>
    </li>
  );
}
