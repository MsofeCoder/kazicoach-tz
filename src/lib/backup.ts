/**
 * Automatic workspace backup.
 *
 * localStorage is the primary store, but it is the storage browsers clear most
 * eagerly (history wipes, quota pressure, "clear site data"). Every state
 * change is therefore mirrored (debounced) into IndexedDB, a store that
 * survives those wipes far more often. If the app ever starts with an empty
 * localStorage but a populated mirror, the workspace is recovered silently.
 *
 * On top of the mirror, a gentle export reminder nudges the user to download a
 * JSON copy when the last export is older than a week.
 */

import type { AppState } from '../types';

const DB_NAME = 'kazicoach-tz';
const DB_VERSION = 1;
const STORE = 'workspace';
const KEY = 'state';
const BACKUP_DEBOUNCE_MS = 1_500;
const WEEK_MS = 7 * 86_400_000;

function hasIndexedDB(): boolean {
  try {
    return typeof indexedDB !== 'undefined';
  } catch {
    return false;
  }
}

function openDatabase(): Promise<IDBDatabase | null> {
  return new Promise(resolve => {
    if (!hasIndexedDB()) {
      resolve(null);
      return;
    }
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

let mirrorTimer: number | null = null;

export function mirrorBackup(state: AppState): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (mirrorTimer !== null) window.clearTimeout(mirrorTimer);
  return new Promise(resolve => {
    mirrorTimer = window.setTimeout(() => {
      mirrorTimer = null;
      void writeBackup(state).then(resolve);
    }, BACKUP_DEBOUNCE_MS);
  });
}

async function writeBackup(state: AppState): Promise<boolean> {
  const db = await openDatabase();
  if (!db) return false;
  return new Promise(resolve => {
    try {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(JSON.parse(JSON.stringify(state)) as AppState, KEY);
      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
      tx.onabort = () => resolve(false);
    } catch {
      resolve(false);
    }
  });
}

export function recoverBackup(): Promise<AppState | null> {
  return new Promise(resolve => {
    void (async () => {
      const db = await openDatabase();
      if (!db) {
        resolve(null);
        return;
      }
      try {
        const tx = db.transaction(STORE, 'readonly');
        const request = tx.objectStore(STORE).get(KEY);
        request.onsuccess = () => resolve((request.result as AppState | undefined) ?? null);
        request.onerror = () => resolve(null);
      } catch {
        resolve(null);
      }
    })();
  });
}

/** Pure merge of a recovered snapshot over a fallback state, with the same caps as storage.ts. */
export function mergeBackup(snapshot: Partial<AppState>, fallback: AppState): AppState {
  return {
    ...fallback,
    ...snapshot,
    preferences: { ...fallback.preferences, ...(snapshot.preferences ?? {}) },
    attempts: Array.isArray(snapshot.attempts) ? snapshot.attempts.slice(-300) : fallback.attempts,
    materials: Array.isArray(snapshot.materials) ? snapshot.materials.slice(-20) : fallback.materials,
    customQuestions: Array.isArray(snapshot.customQuestions) ? snapshot.customQuestions.slice(-60) : fallback.customQuestions,
  };
}

/** Pure reminder rule: nudge once a week, only when there is something worth protecting. */
export function shouldSuggestBackup(state: AppState, now: Date = new Date()): boolean {
  if (!state.profile) return false;
  const hasContent = state.attempts.length > 0 || state.materials.length > 0 || state.customQuestions.length > 0;
  if (!hasContent) return false;
  if (!state.lastExportAt) return true;
  const last = Date.parse(state.lastExportAt);
  return Number.isNaN(last) || now.getTime() - last >= WEEK_MS;
}

export function workspaceItemCount(state: AppState): number {
  return state.attempts.length + state.materials.length + state.customQuestions.length;
}

export function exportWorkspace(state: AppState): string {
  const payload = { exportedAt: new Date().toISOString(), product: 'KaziCoach TZ', state };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const filename = `kazicoach-progress-${new Date().toISOString().slice(0, 10)}.json`;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
  return filename;
}
