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

import type { AppState, Workspace } from '../types';

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
  // Handle old v3 format (profile at top level) by converting to workspace
  const snapshotRecord = snapshot as Record<string, unknown>;
  if (snapshotRecord.profile && !snapshotRecord.workspaces) {
    const profile = snapshotRecord.profile as Workspace['profile'];
    const attempts = Array.isArray(snapshotRecord.attempts) ? (snapshotRecord.attempts as Workspace['attempts']).slice(-300) : [];
    const materials = Array.isArray(snapshotRecord.materials) ? (snapshotRecord.materials as Workspace['materials']).slice(-20) : [];
    const customQuestions = Array.isArray(snapshotRecord.customQuestions) ? (snapshotRecord.customQuestions as Workspace['customQuestions']).slice(-60) : [];
    const workspace: Workspace = {
      id: crypto.randomUUID(),
      profile,
      materials,
      customQuestions,
      attempts,
      createdAt: profile.createdAt || new Date().toISOString(),
    };
    return {
      ...fallback,
      workspaces: [workspace],
      activeWorkspaceId: workspace.id,
      xp: typeof snapshotRecord.xp === 'number' ? snapshotRecord.xp : fallback.xp,
      streak: typeof snapshotRecord.streak === 'number' ? snapshotRecord.streak : fallback.streak,
      lastActiveDate: typeof snapshotRecord.lastActiveDate === 'string' ? snapshotRecord.lastActiveDate : fallback.lastActiveDate,
      lastExportAt: typeof snapshotRecord.lastExportAt === 'string' ? snapshotRecord.lastExportAt : fallback.lastExportAt,
      preferences: { ...fallback.preferences, ...(snapshot.preferences ?? {}) },
    };
  }

  // Handle v4 format (workspace-based)
  const workspaces = Array.isArray(snapshot.workspaces) ? snapshot.workspaces.map(ws => ({
    ...ws,
    attempts: Array.isArray(ws.attempts) ? ws.attempts.slice(-300) : [],
    materials: Array.isArray(ws.materials) ? ws.materials.slice(-20) : [],
    customQuestions: Array.isArray(ws.customQuestions) ? ws.customQuestions.slice(-60) : [],
  })) : fallback.workspaces;

  const activeId = typeof snapshot.activeWorkspaceId === 'string' && workspaces.some(w => w.id === snapshot.activeWorkspaceId)
    ? snapshot.activeWorkspaceId
    : workspaces[0]?.id ?? null;

  return {
    ...fallback,
    ...snapshot,
    workspaces,
    activeWorkspaceId: activeId,
    preferences: { ...fallback.preferences, ...(snapshot.preferences ?? {}) },
  };
}

/** Pure reminder rule: nudge once a week, only when there is something worth protecting. */
export function shouldSuggestBackup(state: AppState, now: Date = new Date()): boolean {
  if (state.workspaces.length === 0) return false;
  const hasContent = state.workspaces.some(ws => ws.attempts.length > 0 || ws.materials.length > 0 || ws.customQuestions.length > 0);
  if (!hasContent) return false;
  if (!state.lastExportAt) return true;
  const last = Date.parse(state.lastExportAt);
  return Number.isNaN(last) || now.getTime() - last >= WEEK_MS;
}

export function workspaceItemCount(state: AppState): number {
  return state.workspaces.reduce((sum, ws) => sum + ws.attempts.length + ws.materials.length + ws.customQuestions.length, 0);
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
