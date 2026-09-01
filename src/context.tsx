import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import type { AppState, Attempt, PracticeMode, QuestionCategory, View, Workspace } from './types';
import { loadState, saveState, updateStreak } from './lib/storage';
import { mergeBackup, mirrorBackup, recoverBackup } from './lib/backup';
import { track } from './lib/analytics';

interface AppContextValue {
  state: AppState;
  setState: React.Dispatch<React.SetStateAction<AppState>>;
  workspace: Workspace | null;
  profile: Workspace['profile'] | null;
  materials: Workspace['materials'];
  customQuestions: Workspace['customQuestions'];
  attempts: Workspace['attempts'];
  view: View;
  setView: (view: View) => void;
  practiceMode: PracticeMode;
  setPracticeMode: (mode: PracticeMode) => void;
  practiceCategory: 'all' | QuestionCategory;
  startPractice: (mode?: PracticeMode, category?: 'all' | QuestionCategory) => void;
  recordAttempt: (attempt: Attempt) => void;
  switchWorkspace: (id: string) => void;
  createWorkspace: (workspace: Workspace) => void;
  deleteWorkspace: (id: string) => void;
  toast: string | null;
  notify: (message: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

function getActiveWorkspace(state: AppState): Workspace | null {
  if (!state.activeWorkspaceId) return state.workspaces[0] ?? null;
  return state.workspaces.find(w => w.id === state.activeWorkspaceId) ?? state.workspaces[0] ?? null;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => loadState());
  const [view, setView] = useState<View>('dashboard');
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('oral');
  const [practiceCategory, setPracticeCategory] = useState<'all' | QuestionCategory>('all');
  const [toast, setToast] = useState<string | null>(null);

  const workspace = useMemo(() => getActiveWorkspace(state), [state]);
  const profile = useMemo(() => workspace?.profile ?? null, [workspace]);
  const materials = useMemo(() => workspace?.materials ?? [], [workspace]);
  const customQuestions = useMemo(() => workspace?.customQuestions ?? [], [workspace]);
  const attempts = useMemo(() => workspace?.attempts ?? [], [workspace]);

  // Primary persistence plus a debounced IndexedDB mirror (survives localStorage wipes).
  useEffect(() => {
    saveState(state);
    void mirrorBackup(state);
  }, [state]);

  // One-time recovery: if localStorage was cleared but the mirror survived, restore silently.
  const recoveryRef = useRef(false);
  useEffect(() => {
    if (recoveryRef.current || state.workspaces.length > 0) return;
    recoveryRef.current = true;
    void recoverBackup().then(snapshot => {
      if (!snapshot) return;
      setState(current => {
        if (current.workspaces.length > 0) return current;
        return mergeBackup(snapshot, current);
      });
    });
  }, [state.workspaces.length]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const switchWorkspace = useCallback((id: string) => {
    setState(current => {
      if (!current.workspaces.some(w => w.id === id)) return current;
      return { ...current, activeWorkspaceId: id };
    });
    setView('dashboard');
  }, []);

  const createWorkspace = useCallback((workspace: Workspace) => {
    setState(current => ({
      ...current,
      workspaces: [...current.workspaces, workspace],
      activeWorkspaceId: workspace.id,
    }));
  }, []);

  const deleteWorkspace = useCallback((id: string) => {
    setState(current => {
      const remaining = current.workspaces.filter(w => w.id !== id);
      const nextId = current.activeWorkspaceId === id
        ? (remaining[0]?.id ?? null)
        : current.activeWorkspaceId;
      return { ...current, workspaces: remaining, activeWorkspaceId: nextId };
    });
    setView('dashboard');
  }, []);

  const value = useMemo<AppContextValue>(() => ({
    state,
    setState,
    workspace,
    profile,
    materials,
    customQuestions,
    attempts,
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
        const activeId = current.activeWorkspaceId ?? current.workspaces[0]?.id;
        const activity = updateStreak(current);
        const xpEarned = 14 + Math.round(attempt.score / 8) + (attempt.score >= 80 ? 8 : 0);
        return {
          ...current,
          ...activity,
          xp: current.xp + xpEarned,
          workspaces: current.workspaces.map(ws =>
            ws.id === activeId
              ? { ...ws, attempts: [...ws.attempts, attempt].slice(-300) }
              : ws
          ),
        };
      });
    },
    switchWorkspace,
    createWorkspace,
    deleteWorkspace,
    toast,
    notify: (message) => setToast(message),
  }), [state, workspace, profile, materials, customQuestions, attempts, view, practiceMode, practiceCategory, toast, switchWorkspace, createWorkspace, deleteWorkspace]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used inside AppProvider');
  return context;
}
