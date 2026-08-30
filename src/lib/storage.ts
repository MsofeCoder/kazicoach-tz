import type { AppState } from '../types';

const STORAGE_KEY = 'kazicoach-tz:v1';

export const defaultState: AppState = {
  version: 3,
  profile: null,
  attempts: [],
  xp: 0,
  streak: 0,
  lastActiveDate: null,
  lastExportAt: null,
  customQuestions: [],
  materials: [],
  preferences: {
    swahiliCoach: true,
    speechRate: 0.92,
    voiceStyle: 'mixed',
  },
};

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return {
      ...defaultState,
      ...parsed,
      preferences: { ...defaultState.preferences, ...parsed.preferences },
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts.slice(-300) : [],
      materials: Array.isArray(parsed.materials) ? parsed.materials.slice(-20) : [],
      customQuestions: Array.isArray(parsed.customQuestions) ? parsed.customQuestions.slice(-60) : [],
    };
  } catch {
    return defaultState;
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...state,
      attempts: state.attempts.slice(-300),
      materials: state.materials.slice(-20),
      customQuestions: state.customQuestions.slice(-60),
    }));
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
