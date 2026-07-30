import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useContent } from '../lib/contentStore';
import { navigate, type WorkCategory } from '../lib/router';
import { useTheme } from '../lib/theme';
import { ThemeToggle } from '../components/ThemeToggle';
import type { Project, DesignPiece } from '../data/content';

/* ==========================================================================
 *  WORK PORTAL  ·  #/work/<category>
 *
 *  A "see all" for a project category, as a 3D coverflow you fly through.
 *  Each project is a panel (its screenshot, or a generated preview) floating
 *  in the green void; the focused one faces you, the rest recede and angle
 *  away. Arrow keys / buttons / wheel / drag move focus; clicking the focused
 *  panel opens its full detail with a live preview.
 *
 *  Panels are drawn as canvas textures on plain planes (no external fonts, no
 *  texture-loader suspense to hang on a 404): the preview is generated
 *  immediately and, if a screenshot path is set, the image is drawn over it
 *  once it loads. Robust by construction.
 * ========================================================================== */

const CATEGORY_META: Record<WorkCategory, { label: string; eyebrow: string; accent: string }> = {
  'data-science': { label: 'Data Science', eyebrow: 'Priority 01', accent: '--accent-ds' },
  gis: { label: 'GIS & Geospatial', eyebrow: 'Priority 02', accent: '--accent-gis' },
  design: { label: 'Graphic Design', eyebrow: 'Priority 03', accent: '--accent-gfx' },
};

type PortalItem = {
  id: string;
  title: string;
  subtitle: string;
  year: string;
  image: string;
  hue: number | null;
  accentVar: string;
  kind?: string;
  status?: Project['status'];
  live?: string;
  repo?: string;
  stack?: string[];
  metrics?: { label: string; value: string }[];
  details?: { problem: string; approach: string; outcome: string };
};

function projectToItem(p: Project, accentVar: string): PortalItem {
  return {
    id: p.id,
    title: p.title,
    subtitle: p.blurb,
    year: p.year,
    image: p.image,
    hue: null,
    accentVar,
    status: p.status,
    live: p.live,
    repo: p.repo,
    stack: p.stack,
    metrics: p.metrics,
    details: { problem: p.problem, approach: p.approach, outcome: p.outcome },
  };
}

function designToItem(d: DesignPiece): PortalItem {
  return {
    id: d.id,
    title: d.title,
    subtitle: d.note,
    year: d.year,
    image: d.image,
    hue: d.hue,
    accentVar: '--accent-gfx',
    kind: d.kind,
  };
}

/* ----------------------------- texture ---------------------------------- */

function cssRGB(varName: string): [number, number, number] {
  const raw = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  const parts = raw.split(/\s+/).map(Number);
  return parts.length === 3 ? (parts as [number, number, number]) : [46, 200, 152];
}

/** Draws the generated preview (and overlays a screenshot if present). */
function makePanelTexture(item: PortalItem): THREE.CanvasTexture {
  const W = 900;
  const H = 675;
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;

  const base =
    item.hue != null
      ? `hsl(${item.hue}, 52%, 42%)`
      : (() => {
          const [r, g, b] = cssRGB(item.accentVar);
          return `rgb(${r}, ${g}, ${b})`;
        })();
  const base2 =
    item.hue != null ? `hsl(${(item.hue + 40) % 360}, 45%, 26%)` : 'rgb(6, 40, 31)';

  // Rounded panel with transparent corners.
  const r = 34;
  ctx.beginPath();
  ctx.moveTo(r, 0);
  ctx.arcTo(W, 0, W, H, r);
  ctx.arcTo(W, H, 0, H, r);
  ctx.arcTo(0, H, 0, 0, r);
  ctx.arcTo(0, 0, W, 0, r);
  ctx.closePath();
  ctx.clip();

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, base);
  grad.addColorStop(1, base2);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // Radial vignette highlight
  const rad = ctx.createRadialGradient(W * 0.25, H * 0.2, 0, W * 0.25, H * 0.2, W * 0.9);
  rad.addColorStop(0, 'rgba(255,255,255,0.28)');
  rad.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = rad;
  ctx.fillRect(0, 0, W, H);

  // Map grid
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= W; x += 60) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 0; y <= H; y += 60) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  // Contour rings
  ctx.strokeStyle = 'rgba(255,255,255,0.16)';
  for (let i = 1; i <= 4; i++) {
    ctx.beginPath();
    ctx.arc(W * 0.82, H * 0.86, i * 70, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Monogram
  const monogram = item.title
    .replace(/[^a-zA-Z0-9 ]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
  ctx.fillStyle = 'rgba(255,255,255,0.92)';
  ctx.font = '700 150px "Space Grotesk", system-ui, sans-serif';
  ctx.textBaseline = 'top';
  ctx.fillText(monogram, 54, 44);

  // Kind / year tag
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '500 24px "JetBrains Mono", monospace';
  ctx.fillText((item.kind ?? item.status ?? '').toUpperCase(), 56, 220);

  // Title (bottom, wrapped to two lines)
  ctx.fillStyle = '#fff';
  ctx.font = '600 46px "Space Grotesk", system-ui, sans-serif';
  wrapText(ctx, item.title, 56, H - 150, W - 112, 52, 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;

  // Overlay the real screenshot once it loads.
  if (item.image) {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // cover-fit
      const ir = img.width / img.height;
      const cr = W / H;
      let dw = W;
      let dh = H;
      let dx = 0;
      let dy = 0;
      if (ir > cr) {
        dh = H;
        dw = H * ir;
        dx = (W - dw) / 2;
      } else {
        dw = W;
        dh = W / ir;
        dy = (H - dh) / 2;
      }
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(r, 0);
      ctx.arcTo(W, 0, W, H, r);
      ctx.arcTo(W, H, 0, H, r);
      ctx.arcTo(0, H, 0, 0, r);
      ctx.arcTo(0, 0, W, 0, r);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, dx, dy, dw, dh);
      ctx.restore();
      tex.needsUpdate = true;
    };
    img.src = item.image;
  }

  return tex;
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lh: number,
  maxLines: number,
) {
  const words = text.split(' ');
  let line = '';
  let lines = 0;
  for (let i = 0; i < words.length; i++) {
    const test = line + words[i] + ' ';
    if (ctx.measureText(test).width > maxW && line !== '') {
      ctx.fillText(line.trim(), x, y + lines * lh);
      line = words[i] + ' ';
      lines++;
      if (lines >= maxLines - 1) {
        // last line — draw the remainder truncated
        let rest = words.slice(i).join(' ');
        while (ctx.measureText(rest + '…').width > maxW && rest.length > 0) {
          rest = rest.slice(0, -1);
        }
        ctx.fillText(rest + (rest.length < words.slice(i).join(' ').length ? '…' : ''), x, y + lines * lh);
        return;
      }
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, y + lines * lh);
}

/* ------------------------------- 3D ------------------------------------- */

const SPACING = 3.4;

function Panel({
  item,
  index,
  targetRef,
  onSelect,
}: {
  item: PortalItem;
  index: number;
  targetRef: React.MutableRefObject<number>;
  onSelect: (i: number) => void;
}) {
  const group = useRef<THREE.Group>(null);
  const texture = useMemo(() => makePanelTexture(item), [item]);

  useFrame((state) => {
    const g = group.current;
    if (!g) return;
    const rel = index - targetRef.current;
    const clamped = THREE.MathUtils.clamp(rel, -2.4, 2.4);
    g.position.x = rel * SPACING;
    g.position.z = -Math.abs(clamped) * 1.5;
    g.rotation.y = -clamped * 0.52;
    const focus = 1 - Math.min(Math.abs(rel), 1);
    const s = 1 + focus * 0.14;
    g.scale.setScalar(s);
    g.position.y = Math.sin(state.clock.elapsedTime * 0.6 + index) * 0.06 * (0.4 + focus);
    const mat = (g.children[0] as THREE.Mesh).material as THREE.MeshBasicMaterial;
    mat.opacity = 0.5 + focus * 0.5;
  });

  return (
    <group
      ref={group}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(index);
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = '')}
    >
      <mesh>
        <planeGeometry args={[3.4, 2.55]} />
        <meshBasicMaterial map={texture} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

/**
 * Keeps the focused panel fully in frame on any viewport.
 *
 * The visible width at the panel's depth is `2·d·tan(fov/2)·aspect`, so a tall
 * narrow phone sees a much narrower slice than a desktop window. Without this
 * the panel's edges clip on portrait screens; pulling the camera back by the
 * amount the aspect ratio demands fixes it at every size.
 */
function ResponsiveCamera({ panelWidth = 3.4, margin = 1.25 }: { panelWidth?: number; margin?: number }) {
  const { camera, size } = useThree();

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / Math.max(size.height, 1);
    const need = panelWidth * margin;
    const halfFov = (cam.fov * Math.PI) / 360;
    const required = need / (2 * Math.tan(halfFov) * Math.max(aspect, 0.01));
    cam.position.z = THREE.MathUtils.clamp(required, 7.5, 15);
    cam.updateProjectionMatrix();
  }, [camera, size.width, size.height, panelWidth, margin]);

  return null;
}

function Gallery({
  items,
  target,
  onSelect,
}: {
  items: PortalItem[];
  target: number;
  onSelect: (i: number) => void;
}) {
  const targetRef = useRef(target);
  const focusRef = useRef(target);
  useEffect(() => {
    targetRef.current = target;
  }, [target]);

  // Damp the actual focus toward the target and feed panels a smoothed value.
  const smooth = useRef(target);
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1);
    smooth.current += (targetRef.current - smooth.current) * (1 - Math.exp(-8 * dt));
    focusRef.current = smooth.current;
  });

  return (
    <group>
      {items.map((item, i) => (
        <Panel key={item.id} item={item} index={i} targetRef={focusRef} onSelect={onSelect} />
      ))}
    </group>
  );
}

/* ----------------------------- portal ----------------------------------- */

export function WorkPortal({ category }: { category: WorkCategory }) {
  const content = useContent();
  const { theme } = useTheme();
  const meta = CATEGORY_META[category];

  const items = useMemo<PortalItem[]>(() => {
    if (category === 'design') return content.design.map(designToItem);
    const arr = category === 'gis' ? content.gis : content.dataScience;
    return arr.map((p) => projectToItem(p, meta.accent));
  }, [category, content, meta.accent]);

  const [target, setTarget] = useState(0);
  const [detail, setDetail] = useState<number | null>(null);

  const count = items.length;
  const clamp = (i: number) => Math.max(0, Math.min(count - 1, i));
  const step = (d: number) => setTarget((t) => clamp(t + d));

  // Keyboard + wheel navigation.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (detail !== null) {
        if (e.key === 'Escape') setDetail(null);
        return;
      }
      if (e.key === 'ArrowRight') step(1);
      else if (e.key === 'ArrowLeft') step(-1);
      else if (e.key === 'Enter') setDetail(target);
      else if (e.key === 'Escape') navigate('home');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detail, target, count]);

  const wheelAcc = useRef(0);
  const onWheel = (e: React.WheelEvent) => {
    if (detail !== null) return;
    wheelAcc.current += e.deltaY + e.deltaX;
    if (Math.abs(wheelAcc.current) > 60) {
      step(wheelAcc.current > 0 ? 1 : -1);
      wheelAcc.current = 0;
    }
  };

  // Drag navigation.
  const drag = useRef<{ x: number; base: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent) => {
    if (detail !== null) return;
    drag.current = { x: e.clientX, base: target };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return;
    const dx = e.clientX - drag.current.x;
    setTarget(clamp(Math.round(drag.current.base - dx / 220)));
  };
  const endDrag = () => (drag.current = null);

  const onSelect = (i: number) => {
    if (i === target) setDetail(i);
    else setTarget(i);
  };

  const focused = items[target];
  const detailItem = detail !== null ? items[detail] : null;

  return (
    <div
      className="relative h-[100svh] w-full overflow-hidden"
      style={{
        background:
          theme === 'dark'
            ? 'radial-gradient(120% 100% at 50% 0%, rgb(10 40 31) 0%, rgb(2 16 12) 70%)'
            : 'radial-gradient(120% 100% at 50% 0%, rgb(228 239 233) 0%, rgb(244 249 246) 70%)',
      }}
    >
      {/* Header */}
      <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-5 sm:p-8">
        <div className="pointer-events-auto">
          <button
            type="button"
            onClick={() => navigate('home')}
            className="font-mono text-[11px] uppercase tracking-[0.2em] text-ash-400 transition hover:text-ash-50"
          >
            ← Portfolio
          </button>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.28em] text-ash-400">
            {meta.eyebrow} · All work
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-ash-50 sm:text-4xl">
            {meta.label}
          </h1>
        </div>
        <div className="pointer-events-auto flex items-center gap-3">
          <span className="font-mono text-xs text-ash-400">
            {count > 0 ? `${String(target + 1).padStart(2, '0')} / ${String(count).padStart(2, '0')}` : '0'}
          </span>
          <ThemeToggle compact />
        </div>
      </header>

      {count === 0 ? (
        <div className="flex h-full items-center justify-center px-6 text-center">
          <p className="max-w-sm text-sm text-ash-300">
            No projects in this category yet. Add them from the admin panel — they&apos;ll appear
            here automatically.
          </p>
        </div>
      ) : (
        <>
          {/* 3D coverflow */}
          <div
            className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
            onWheel={onWheel}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
          >
            <Canvas
              dpr={[1, 2]}
              gl={{ antialias: true, alpha: true }}
              camera={{ fov: 45, near: 0.1, far: 60, position: [0, 0, 7.5] }}
            >
              <Suspense fallback={null}>
                <ResponsiveCamera />
                <Gallery items={items} target={target} onSelect={onSelect} />
              </Suspense>
            </Canvas>
          </div>

          {/* Focused project info */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex flex-col items-center px-6 pb-8 text-center sm:pb-10">
            <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-ash-400">
              {focused.kind ?? focused.status ?? ''} {focused.year && `· ${focused.year}`}
            </p>
            <h2 className="mt-2 max-w-2xl font-display text-xl font-semibold text-ash-50 sm:text-2xl">
              {focused.title}
            </h2>
            {focused.subtitle && (
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ash-300">{focused.subtitle}</p>
            )}
            <div className="pointer-events-auto mt-5 flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => step(-1)}
                disabled={target === 0}
                className="tap btn-ghost h-11 w-11 !px-0 text-lg"
                aria-label="Previous project"
              >
                ‹
              </button>
              <button type="button" onClick={() => setDetail(target)} className="tap btn-primary">
                View details
              </button>
              <button
                type="button"
                onClick={() => step(1)}
                disabled={target === count - 1}
                className="tap btn-ghost h-11 w-11 !px-0 text-lg"
                aria-label="Next project"
              >
                ›
              </button>
            </div>

            {/* How to move around — differs by input, so say the right thing. */}
            <p className="mt-4 font-mono text-[9px] uppercase tracking-[0.22em] text-ash-400">
              <span className="hidden sm:inline">Scroll, drag or use ← → · Enter for details</span>
              <span className="sm:hidden">Swipe to browse · tap a panel for details</span>
            </p>

            {/* Dot index — orientation when there are many projects. */}
            {count > 1 && (
              <div className="pointer-events-auto mt-4 flex flex-wrap items-center justify-center gap-1.5">
                {items.map((it, i) => (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => setTarget(i)}
                    aria-label={`Go to ${it.title}`}
                    aria-current={i === target ? 'true' : undefined}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === target ? 'w-6 bg-ash-100' : 'w-1.5 bg-ash-500/60 hover:bg-ash-400'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {detailItem && <DetailOverlay item={detailItem} onClose={() => setDetail(null)} />}
    </div>
  );
}

/* --------------------------- detail overlay ----------------------------- */

function DetailOverlay({ item, onClose }: { item: PortalItem; onClose: () => void }) {
  const [preview, setPreview] = useState(false);

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-ash-950/80 backdrop-blur-sm">
      <div className="mx-auto min-h-full max-w-3xl px-4 py-10 sm:px-6">
        <div className="glass-strong relative overflow-hidden rounded-3xl">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full text-ash-200 ring-1 ring-inset ring-ash-600/50 transition hover:bg-ash-800/60"
          >
            ✕
          </button>

          {/* Preview */}
          <div className="relative aspect-[16/9] w-full overflow-hidden">
            {preview && item.live ? (
              <iframe
                src={item.live}
                title={`${item.title} live preview`}
                className="h-full w-full border-0 bg-white"
                sandbox="allow-scripts allow-same-origin allow-popups"
                loading="lazy"
              />
            ) : item.image ? (
              <img src={item.image} alt={item.title} className="h-full w-full object-cover" />
            ) : (
              <div
                className="h-full w-full"
                style={{
                  background:
                    item.hue != null
                      ? `radial-gradient(120% 90% at 20% 15%, hsl(${item.hue} 55% 55% / .6), transparent 60%), linear-gradient(150deg, rgb(var(--ash-800)), rgb(var(--ash-900)))`
                      : `radial-gradient(120% 90% at 20% 15%, rgb(var(${item.accentVar}) / .5), transparent 60%), linear-gradient(150deg, rgb(var(--ash-800)), rgb(var(--ash-900)))`,
                }}
              />
            )}
            {item.live && (
              <button
                type="button"
                onClick={() => setPreview((v) => !v)}
                className="absolute bottom-3 right-3 rounded-lg bg-ash-950/70 px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-ash-100 backdrop-blur transition hover:text-white"
              >
                {preview ? 'Show cover' : 'Live preview ▸'}
              </button>
            )}
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-2 flex flex-wrap items-center gap-x-3 text-[10px] font-mono uppercase tracking-[0.2em] text-ash-400">
              {item.year && <span>{item.year}</span>}
              {item.kind && <span>{item.kind}</span>}
              {item.status && <span className="text-ds">{item.status}</span>}
            </div>
            <h2 className="font-display text-2xl font-semibold text-ash-50">{item.title}</h2>
            {item.subtitle && <p className="mt-2 text-sm leading-relaxed text-ash-300">{item.subtitle}</p>}

            {item.details && (item.details.problem || item.details.approach || item.details.outcome) && (
              <div className="mt-6 space-y-4">
                {item.details.problem && <DetailRow label="Problem" body={item.details.problem} />}
                {item.details.approach && <DetailRow label="Approach" body={item.details.approach} />}
                {item.details.outcome && <DetailRow label="Outcome" body={item.details.outcome} />}
              </div>
            )}

            {item.metrics && item.metrics.length > 0 && (
              <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
                {item.metrics.map((m, i) => (
                  <div key={i}>
                    <dt className="font-mono text-[10px] uppercase tracking-widest text-ash-400">{m.label}</dt>
                    <dd className="font-display text-lg text-ash-100">{m.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            {item.stack && item.stack.length > 0 && (
              <ul className="mt-6 flex flex-wrap gap-1.5">
                {item.stack.map((s, i) => (
                  <li
                    key={i}
                    className="rounded-md border border-ash-600/40 bg-ash-800/60 px-2 py-1 font-mono text-[10px] text-ash-200"
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}

            {(item.live || item.repo) && (
              <div className="mt-7 flex flex-wrap gap-3">
                {item.live && (
                  <a href={item.live} target="_blank" rel="noreferrer noopener" className="btn-primary">
                    Open live ↗
                  </a>
                )}
                {item.repo && (
                  <a href={item.repo} target="_blank" rel="noreferrer noopener" className="btn-ghost">
                    View code ↗
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, body }: { label: string; body: string }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[100px_1fr] sm:gap-4">
      <div className="font-mono text-[10px] uppercase tracking-widest text-ash-500 sm:pt-1">{label}</div>
      <p className="text-sm leading-relaxed text-ash-300">{body}</p>
    </div>
  );
}
