import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppState, Attempt, PracticeMode, QuestionCategory, View } from './types';
import { loadState, saveState, updateStreak } from './lib/storage';
import { mergeBackup, mirrorBackup, recoverBackup } from './lib/backup';
import { track } from './lib/analytics';

interface AppContextValue {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  view: View;
  setView: (view: View) => void;
  practiceMode: PracticeMode;
  setPracticeMode: (mode: PracticeMode) => void;
  practiceCategory: 'all' | QuestionCategory;
  startPractice: (mode?: PracticeMode, category?: 'all' | QuestionCategory) => void;
  recordAttempt: (attempt: Attempt) => void;
  toast: string | null;
  notify: (message: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());
  const [view, setView] = useState<View>('dashboard');
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('oral');
  const [practiceCategory, setPracticeCategory] = useState<'all' | QuestionCategory>('all');
  const [toast, setToast] = useState<string | null>(null);

  // Primary persistence plus a debounced IndexedDB mirror (survives localStorage wipes).
  useEffect(() => {
    saveState(state);
    void mirrorBackup(state);
  }, [state]);

  // One-time recovery: if localStorage was cleared but the mirror survived, restore silently.
  const recoveryRef = useRef(false);
  useEffect(() => {
    if (recoveryRef.current || state.profile) return;
    recoveryRef.current = true;
    void recoverBackup().then(snapshot => {
      if (!snapshot?.profile) return;
      setState(current => (current.profile ? current : mergeBackup(snapshot, current)));
    });
  }, [state.profile]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const value = useMemo<AppContextValue>(() => ({
    state,
    setState,
    view,
    setView,
    practiceMode,
    setPracticeMode,
    practiceCategory,
    startPractice: (mode = 'oral', category = 'all') => {
      track('practice_started', { mode, category });
      setPracticeMode(mode);
      setPracticeCategory(category);
      setView('practice');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    recordAttempt: (attempt) => {
      track('practice_attempt_completed', { mode: attempt.mode, score: attempt.score, category: attempt.category });
      setState(current => {
        const activity = updateStreak(current);
        const xpEarned = 14 + Math.round(attempt.score / 8) + (attempt.score >= 80 ? 8 : 0);
        return {
          ...current,
          ...activity,
          xp: current.xp + xpEarned,
          attempts: [...current.attempts, attempt].slice(-300),
        };
      });
    },
    toast,
    notify: (message) => setToast(message),
  }), [state, view, practiceMode, practiceCategory, toast]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
