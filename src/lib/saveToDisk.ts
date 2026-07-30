/* ==========================================================================
 *  SAVE TO DISK  —  write content.json straight into the repo, no token.
 *
 *  Flow:
 *      admin edit  →  "Save to repo"  →  writes public/content.json on disk
 *                  →  you run `npm run publish` (or push in GitHub Desktop)
 *                  →  host rebuilds  →  live site updated
 *
 *  Why this instead of a GitHub token: there is no credential anywhere. The
 *  browser writes to one file you explicitly picked, using a permission you
 *  granted, on your own machine. Nothing is stored that could leak, and the
 *  push stays under your control.
 *
 *  Uses the File System Access API (Chrome, Edge, Brave, Opera). The picked
 *  file handle is remembered in IndexedDB, so after the first time it is a
 *  single click — no re-picking, no Downloads folder, no moving files.
 *
 *  Firefox and Safari don't implement it; there `isSupported()` is false and
 *  the UI falls back to a normal download.
 * ========================================================================== */

/* ---- minimal typings (the API isn't in TS's default DOM lib yet) --------- */

type PermissionMode = { mode?: 'read' | 'readwrite' };

interface FileSystemWritable {
  write: (data: string) => Promise<void>;
  close: () => Promise<void>;
}

export interface RepoFileHandle {
  readonly kind: 'file';
  readonly name: string;
  createWritable: (opts?: { keepExistingData?: boolean }) => Promise<FileSystemWritable>;
  queryPermission: (opts?: PermissionMode) => Promise<PermissionState>;
  requestPermission: (opts?: PermissionMode) => Promise<PermissionState>;
  getFile: () => Promise<File>;
}

type PickerWindow = Window & {
  showSaveFilePicker?: (opts: {
    suggestedName?: string;
    types?: { description: string; accept: Record<string, string[]> }[];
  }) => Promise<RepoFileHandle>;
};

/** True when the browser can write directly to a file you choose. */
export function isSupported(): boolean {
  return typeof window !== 'undefined' && 'showSaveFilePicker' in window;
}

/* ---- handle persistence (IndexedDB — localStorage can't hold handles) ---- */

const DB_NAME = 'portfolio-admin';
const STORE = 'handles';
const KEY = 'content-json';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(value: RepoFileHandle | null): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    if (value) store.put(value, KEY);
    else store.delete(KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

async function idbGet(): Promise<RepoFileHandle | null> {
  const db = await openDb();
  const value = await new Promise<RepoFileHandle | null>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(KEY);
    req.onsuccess = () => resolve((req.result as RepoFileHandle) ?? null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return value;
}

/** The remembered file, if the user linked one previously. */
export async function loadSavedHandle(): Promise<RepoFileHandle | null> {
  try {
    return await idbGet();
  } catch {
    return null;
  }
}

export async function forgetHandle(): Promise<void> {
  try {
    await idbSet(null);
  } catch {
    /* ignore */
  }
}

/* ------------------------------ operations ------------------------------- */

/**
 * Ask the user to point at their `public/content.json` once, and remember it.
 * Must be called from a click — the picker requires a user gesture.
 */
export async function linkRepoFile(): Promise<RepoFileHandle> {
  const w = window as PickerWindow;
  if (!w.showSaveFilePicker) {
    throw new Error('This browser cannot write files directly. Use Download instead.');
  }

  const handle = await w.showSaveFilePicker({
    suggestedName: 'content.json',
    types: [{ description: 'JSON', accept: { 'application/json': ['.json'] } }],
  });

  await idbSet(handle);
  return handle;
}

/**
 * Ensure we still hold write permission. Browsers drop it between sessions, so
 * this may prompt — which is why it must run inside a click handler.
 */
export async function ensureWritable(handle: RepoFileHandle): Promise<boolean> {
  if ((await handle.queryPermission({ mode: 'readwrite' })) === 'granted') return true;
  return (await handle.requestPermission({ mode: 'readwrite' })) === 'granted';
}

/** Overwrite the linked file with `json`. */
export async function writeToHandle(handle: RepoFileHandle, json: string): Promise<void> {
  if (!(await ensureWritable(handle))) {
    throw new Error('Permission to write that file was denied.');
  }
  // keepExistingData:false truncates, so a shorter file doesn't leave a tail
  // of the previous version behind.
  const writable = await handle.createWritable({ keepExistingData: false });
  await writable.write(json);
  await writable.close();
}

/** Fallback for browsers without the API: a normal download. */
export function downloadJson(json: string, filename = 'content.json'): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
