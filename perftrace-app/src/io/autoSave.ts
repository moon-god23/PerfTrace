import type { PerfTraceProject } from '../types/projectSchema';
import type { UserPreferences } from '../store/preferencesStore';

const DB_NAME = 'perftrace';
const STORE_NAME = 'autosave';
const PREFS_STORE = 'preferences';
const KEY = 'latest';
const PREFS_KEY = 'userPreferences';
const DB_VERSION = 2;

// ─── IDB helpers ─────────────────────────────────────────────────────────────

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (event) => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
      // v2: preferences store
      if ((event.oldVersion ?? 0) < 2 && !db.objectStoreNames.contains(PREFS_STORE)) {
        db.createObjectStore(PREFS_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function idbPut(db: IDBDatabase, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(value, KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function idbGet(db: IDBDatabase): Promise<PerfTraceProject | undefined> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(KEY);
    req.onsuccess = () => resolve(req.result as PerfTraceProject | undefined);
    req.onerror = () => reject(req.error);
  });
}

function idbDelete(db: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(KEY);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// ─── Public API ──────────────────────────────────────────────────────────────

let _db: IDBDatabase | null = null;
async function getDB(): Promise<IDBDatabase> {
  if (!_db) _db = await openDB();
  return _db;
}

// Debounce timer
let _saveTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 2000;

/**
 * Schedules an auto-save to IndexedDB, debounced by 2 seconds.
 * Safe to call on every Zustand state change.
 */
export function scheduleAutoSave(project: PerfTraceProject): void {
  if (_saveTimer !== null) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(async () => {
    try {
      const db = await getDB();
      await idbPut(db, project);
    } catch (e) {
      // Non-fatal — auto-save is best-effort
      console.warn('[PerfTrace] Auto-save failed:', e);
    }
  }, DEBOUNCE_MS);
}

/**
 * Returns the most recent auto-saved project, or `undefined` if none exists.
 */
export async function loadAutoSave(): Promise<PerfTraceProject | undefined> {
  try {
    const db = await getDB();
    return await idbGet(db);
  } catch {
    return undefined;
  }
}

/**
 * Deletes the auto-save entry. Call after a successful manual save or New Project.
 */
export async function clearAutoSave(): Promise<void> {
  try {
    const db = await getDB();
    await idbDelete(db);
  } catch {
    // Ignore — if delete fails, the next loadAutoSave will still work
  }
}

// ─── Preferences persistence ─────────────────────────────────────────────────

/**
 * Persists user preferences to IndexedDB immediately (no debounce).
 * Preferences are small and change infrequently.
 */
export async function savePreferences(prefs: UserPreferences): Promise<void> {
  try {
    const db = await getDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(PREFS_STORE, 'readwrite');
      const req = tx.objectStore(PREFS_STORE).put(prefs, PREFS_KEY);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.warn('[PerfTrace] Failed to save preferences:', e);
  }
}

/**
 * Loads user preferences from IndexedDB, or returns undefined if none saved.
 */
export async function loadPreferences(): Promise<Partial<UserPreferences> | undefined> {
  try {
    const db = await getDB();
    return await new Promise<Partial<UserPreferences> | undefined>((resolve, reject) => {
      const tx = db.transaction(PREFS_STORE, 'readonly');
      const req = tx.objectStore(PREFS_STORE).get(PREFS_KEY);
      req.onsuccess = () => resolve(req.result as Partial<UserPreferences> | undefined);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
}
