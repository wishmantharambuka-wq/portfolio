import { useId, type ReactNode } from 'react';

/* --------------------------------------------------------------------------
 *  Shared form primitives for the admin panel.
 *
 *  Reordering is done with explicit up/down buttons rather than drag-and-drop:
 *  it works on touch, works with a keyboard, works with a screen reader, and
 *  never fights the page's smooth scrolling.
 * ------------------------------------------------------------------------ */

export function Field({
  label,
  value,
  onChange,
  placeholder,
  hint,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  type?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-ash-300">
        {label}
      </label>
      <input
        id={id}
        type={type}
        className="field"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="mt-1 text-[11px] text-ash-500">{hint}</p>}
    </div>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 4,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
  hint?: string;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-ash-300">
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        className="field resize-y leading-relaxed"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
      {hint && <p className="mt-1 text-[11px] text-ash-500">{hint}</p>}
    </div>
  );
}

export function Select<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-ash-300">
        {label}
      </label>
      <select
        id={id}
        className="field"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-ash-900 text-ash-100">
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

export function Slider({
  label,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.05,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  const id = useId();
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between">
        <label htmlFor={id} className="text-xs font-medium text-ash-300">
          {label}
        </label>
        <span className="font-mono text-[11px] text-ash-500">
          {max === 1 ? `${Math.round(value * 100)}%` : value}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[rgb(var(--accent-ds))]"
      />
    </div>
  );
}

/** Comma/newline separated list of plain strings (tech stack, roles, ...). */
export function StringList({
  label,
  values,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <TextArea
      label={label}
      value={values.join('\n')}
      rows={Math.min(Math.max(values.length + 1, 2), 10)}
      placeholder={placeholder}
      hint={hint ?? 'One per line.'}
      onChange={(v) =>
        onChange(
          v
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
        )
      }
    />
  );
}

/** Collapsible bordered group with reorder/delete controls. */
export function ItemCard({
  title,
  subtitle,
  index,
  total,
  onMove,
  onRemove,
  children,
}: {
  title: string;
  subtitle?: string;
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
  onRemove: (index: number) => void;
  children: ReactNode;
}) {
  return (
    <details className="group rounded-xl border border-ash-700/70 bg-ash-900/40 open:bg-ash-900/60">
      <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3">
        <span className="font-mono text-[10px] text-ash-500">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-ash-100">
            {title || <span className="italic text-ash-500">Untitled</span>}
          </span>
          {subtitle && <span className="block truncate text-[11px] text-ash-500">{subtitle}</span>}
        </span>

        <span className="flex shrink-0 items-center gap-1">
          <IconBtn
            label="Move up"
            disabled={index === 0}
            onClick={() => onMove(index, index - 1)}
          >
            ↑
          </IconBtn>
          <IconBtn
            label="Move down"
            disabled={index === total - 1}
            onClick={() => onMove(index, index + 1)}
          >
            ↓
          </IconBtn>
          <IconBtn
            label="Delete"
            danger
            onClick={() => {
              if (confirm(`Delete "${title || 'this item'}"? This cannot be undone.`)) {
                onRemove(index);
              }
            }}
          >
            ✕
          </IconBtn>
          <span className="ml-1 text-ash-500 transition group-open:rotate-90" aria-hidden>
            ›
          </span>
        </span>
      </summary>

      <div className="space-y-4 border-t border-ash-700/60 px-4 py-4">{children}</div>
    </details>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
  danger,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={(e) => {
        // Inside a <summary>, a click would otherwise toggle the disclosure.
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={`flex h-6 w-6 items-center justify-center rounded text-xs transition disabled:opacity-25 ${
        danger
          ? 'text-red-400 hover:bg-red-500/15'
          : 'text-ash-400 hover:bg-ash-700/60 hover:text-ash-100'
      }`}
    >
      {children}
    </button>
  );
}

export function Panel({
  title,
  description,
  children,
  actions,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-ash-700/70 bg-ash-900/30 p-5 sm:p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-ash-50">{title}</h2>
          {description && <p className="mt-1 max-w-xl text-xs text-ash-400">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  );
}

export const Grid2 = ({ children }: { children: ReactNode }) => (
  <div className="grid gap-4 sm:grid-cols-2">{children}</div>
);

/** Immutably move an array element. */
export function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (to < 0 || to >= arr.length) return arr;
  const next = [...arr];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

/** Reasonably unique slug id for new records. */
export function newId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}
