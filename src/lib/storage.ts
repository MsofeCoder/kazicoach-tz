import type { AppState, Workspace } from '../types';

const STORAGE_KEY = 'kazicoach-tz:v1';

export const defaultState: AppState = {
  version: 4,
  workspaces: [],
  activeWorkspaceId: null,
  xp: 0,
  streak: 0,
  lastActiveDate: null,
  lastExportAt: null,
  preferences: {
    swahiliCoach: true,
    speechRate: 0.92,
    voiceStyle: 'mixed',
  },
};

function migrateV3(raw: Record<string, unknown>): AppState {
  const profile = raw.profile as AppState['workspaces'][0]['profile'] | null;
  const attempts = Array.isArray(raw.attempts) ? raw.attempts.slice(-300) : [];
  const materials = Array.isArray(raw.materials) ? raw.materials.slice(-20) : [];
  const customQuestions = Array.isArray(raw.customQuestions) ? raw.customQuestions.slice(-60) : [];

  if (!profile) {
    return { ...defaultState, version: 4 };
  }

  const workspace: Workspace = {
    id: crypto.randomUUID(),
    profile,
    materials,
    customQuestions,
    attempts,
    createdAt: profile.createdAt || new Date().toISOString(),
  };

  return {
    version: 4,
    workspaces: [workspace],
    activeWorkspaceId: workspace.id,
    xp: typeof raw.xp === 'number' ? raw.xp : 0,
    streak: typeof raw.streak === 'number' ? raw.streak : 0,
    lastActiveDate: typeof raw.lastActiveDate === 'string' ? raw.lastActiveDate : null,
    lastExportAt: typeof raw.lastExportAt === 'string' ? raw.lastExportAt : null,
    preferences: {
      ...defaultState.preferences,
      ...((raw.preferences as Record<string, unknown>) || {}),
    },
  };
}

function migrateWorkspaces(parsed: Record<string, unknown>): AppState {
  const raw = parsed as unknown as AppState;
  const workspaces: Workspace[] = Array.isArray(raw.workspaces)
    ? raw.workspaces.map(ws => ({
        ...ws,
        attempts: Array.isArray(ws.attempts) ? ws.attempts.slice(-300) : [],
        materials: Array.isArray(ws.materials) ? ws.materials.slice(-20) : [],
        customQuestions: Array.isArray(ws.customQuestions) ? ws.customQuestions.slice(-60) : [],
      }))
    : [];
  const activeId = typeof raw.activeWorkspaceId === 'string' && workspaces.some(w => w.id === raw.activeWorkspaceId)
    ? raw.activeWorkspaceId
    : workspaces[0]?.id ?? null;
  return {
    ...defaultState,
    ...raw,
    version: 4,
    workspaces,
    activeWorkspaceId: activeId,
    preferences: { ...defaultState.preferences, ...(raw.preferences || {}) },
  };
}

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const version = typeof parsed.version === 'number' ? parsed.version : 3;
    if (version <= 3) return migrateV3(parsed);
    return migrateWorkspaces(parsed);
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Practice must keep working if private browsing/storage quota blocks persistence.
  }
}

export function clearState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function darDate(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Dar_es_Salaam', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(date);
}

function daysBetween(from: string, to: string): number {
  const start = new Date(`${from}T12:00:00Z`).getTime();
  const end = new Date(`${to}T12:00:00Z`).getTime();
  return Math.round((end - start) / 86_400_000);
}

export function updateStreak(state: AppState): Pick<AppState, 'streak' | 'lastActiveDate'> {
  const today = darDate();
  if (state.lastActiveDate === today) return { streak: state.streak, lastActiveDate: today };
  if (!state.lastActiveDate) return { streak: 1, lastActiveDate: today };
  const gap = daysBetween(state.lastActiveDate, today);
  return { streak: gap === 1 ? state.streak + 1 : 1, lastActiveDate: today };
}
