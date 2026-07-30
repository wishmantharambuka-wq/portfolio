import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { defaultContent, CONTENT_VERSION, type Content } from '../data/content';

/* ==========================================================================
 *  Content store — three layers, highest wins:
 *
 *    1. defaultContent   bundled, always available, zero network
 *    2. /content.json    what the world sees, once you publish one
 *    3. localStorage     your unpublished admin draft, this browser only
 *
 *  Because this site is static (GitHub Pages, no backend), the admin panel
 *  cannot write to a server. It writes layer 3 and lets you export layer 2.
 * ========================================================================== */

const DRAFT_KEY = 'portfolio:draft:v1';

type ContentContextValue = {
  content: Content;
  /** True when a localStorage draft is overriding the published content. */
  hasDraft: boolean;
  /** True once the optional /content.json fetch has settled. */
  loaded: boolean;
  /** Replace the whole content tree (admin panel). Persists the draft. */
  setContent: (next: Content) => void;
  /** Immutably patch part of the tree. */
  update: (fn: (draft: Content) => Content) => void;
  /** Throw away the local draft and fall back to published/default content. */
  discardDraft: () => void;
  /** The published (non-draft) content, for diffing in the admin panel. */
  published: Content;
};

const ContentContext = createContext<ContentContextValue | null>(null);

/** Deep clone that works for our plain-JSON content tree. */
const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/**
 * Fills in anything a stored/fetched payload is missing.
 *
 * Without this, adding a new field to `Content` would break every browser
 * holding an older draft — the app would read `undefined` and crash on
 * `.map`. Merging against defaults means old drafts keep working.
 */
function merge(base: Content, patch: Partial<Content> | null | undefined): Content {
  if (!patch || typeof patch !== 'object') return clone(base);
  const out = clone(base) as unknown as Record<string, unknown>;
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined || value === null) continue;
    const current = out[key];
    if (
      !Array.isArray(value) &&
      typeof value === 'object' &&
      typeof current === 'object' &&
      current !== null &&
      !Array.isArray(current)
    ) {
      out[key] = {
        ...(current as Record<string, unknown>),
        ...(value as Record<string, unknown>),
      };
    } else {
      out[key] = value;
    }
  }
  return out as unknown as Content;
}

function readDraft(): Content | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Content;
    return merge(defaultContent, parsed);
  } catch {
    return null;
  }
}

export function ContentProvider({ children }: { children: ReactNode }) {
  // Published = defaults until /content.json (if any) arrives.
  const [published, setPublished] = useState<Content>(() => clone(defaultContent));
  const [draft, setDraft] = useState<Content | null>(() => readDraft());
  const [loaded, setLoaded] = useState(false);

  // Optional published overrides. A missing file is the normal case, not an
  // error — so a 404 resolves quietly to "no overrides".
  useEffect(() => {
    let cancelled = false;
    const url = `${import.meta.env.BASE_URL}content.json`;

    fetch(url, { cache: 'no-cache' })
      .then((r) => (r.ok ? r.json() : null))
      .then((json: Partial<Content> | null) => {
        if (cancelled || !json) return;
        setPublished(merge(defaultContent, json));
      })
      .catch(() => {
        /* no content.json published yet — defaults stand */
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const setContent = useCallback((next: Content) => {
    const withVersion = { ...next, version: CONTENT_VERSION };
    setDraft(withVersion);
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(withVersion));
    } catch {
      // Quota or private-browsing. The edit still applies in memory for this
      // session; the admin panel warns via the failed-save state.
    }
  }, []);

  const update = useCallback(
    (fn: (d: Content) => Content) => {
      setContent(fn(clone(draft ?? published)));
    },
    [draft, published, setContent],
  );

  const discardDraft = useCallback(() => {
    setDraft(null);
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      /* nothing to do */
    }
  }, []);

  const value = useMemo<ContentContextValue>(
    () => ({
      content: draft ?? published,
      published,
      hasDraft: draft !== null,
      loaded,
      setContent,
      update,
      discardDraft,
    }),
    [draft, published, loaded, setContent, update, discardDraft],
  );

  return <ContentContext.Provider value={value}>{children}</ContentContext.Provider>;
}

export function useContentStore() {
  const ctx = useContext(ContentContext);
  if (!ctx) throw new Error('useContentStore must be used inside <ContentProvider>');
  return ctx;
}

/** Convenience for the many read-only consumers. */
export function useContent(): Content {
  return useContentStore().content;
}
