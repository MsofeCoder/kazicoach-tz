import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AppState, Attempt, PracticeMode, QuestionCategory, View } from './types';
import { loadState, saveState, updateStreak } from './lib/storage';

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

  useEffect(() => saveState(state), [state]);
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
      setPracticeMode(mode);
      setPracticeCategory(category);
      setView('practice');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    recordAttempt: (attempt) => {
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
