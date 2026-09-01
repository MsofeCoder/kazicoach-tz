import {
  BarChart3, BookOpenText, ChevronRight, ChevronDown, Flame, FolderUp, Gauge, Home,
  HelpCircle, Menu, Mic2, Plus, Settings, ShieldCheck, Sparkles, Target, X,
} from 'lucide-react';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useApp } from './context';
import { trackPageView } from './lib/analytics';
import type { View } from './types';
import Dashboard from './views/Dashboard';
import Practice from './views/Practice';
import Materials from './views/Materials';
import Progress from './views/Progress';
import SettingsView from './views/Settings';
import Onboarding from './views/Onboarding';
import InteractiveGuide from './components/InteractiveGuide';

const GUIDE_KEY = 'kazicoach-tz:guide-seen';

interface GuideContextValue {
  showGuide: boolean;
  openGuide: () => void;
  closeGuide: () => void;
}

const GuideContext = createContext<GuideContextValue | null>(null);

export function useGuide() {
  return useContext(GuideContext);
}

const navigation: Array<{ id: View; label: string; sw: string; icon: typeof Home }> = [
  { id: 'dashboard', label: 'Today', sw: 'Leo', icon: Home },
  { id: 'practice', label: 'Practice', sw: 'Mazoezi', icon: Mic2 },
  { id: 'materials', label: 'Materials', sw: 'Nyaraka', icon: FolderUp },
  { id: 'progress', label: 'Progress', sw: 'Maendeleo', icon: BarChart3 },
  { id: 'settings', label: 'Settings', sw: 'Mipangilio', icon: Settings },
];

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="brand" aria-label="KaziCoach TZ">
      <span className="brand-mark" aria-hidden="true"><ShieldCheck size={compact ? 21 : 24} strokeWidth={2.2} /></span>
      <span className="brand-copy">
        <strong>KaziCoach <i>TZ</i></strong>
        {!compact && <small>Jiamini. Jitayarishe.</small>}
      </span>
    </div>
  );
}

function WorkspaceSelector() {
  const { state, workspace, switchWorkspace, setView } = useApp();
  const [open, setOpen] = useState(false);
  if (state.workspaces.length <= 1) return null;
  return (
    <div className="workspace-selector">
      <button className="workspace-selector-trigger" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span className="workspace-active-name">{workspace?.profile.jobPosition ?? 'Workspace'}</span>
        {open ? <ChevronRight size={15} className="rotated" /> : <ChevronDown size={15} />}
      </button>
      {open && (
        <div className="workspace-dropdown">
          {state.workspaces.map(ws => (
            <button key={ws.id} className={`workspace-option ${ws.id === workspace?.id ? 'active' : ''}`} onClick={() => { switchWorkspace(ws.id); setOpen(false); }}>
              <span className="workspace-option-name">{ws.profile.jobPosition}</span>
              <span className="workspace-option-meta">{ws.profile.name} · {ws.attempts.length} attempts</span>
            </button>
          ))}
          <button className="workspace-option add-workspace" onClick={() => { setOpen(false); setView('settings'); }}>
            <Plus size={15} /><span>Add workspace</span>
          </button>
        </div>
      )}
    </div>
  );
}

function Sidebar() {
  const { view, setView, state, startPractice, profile } = useApp();
  const guide = useGuide();
  const level = Math.floor(state.xp / 180) + 1;
  const levelProgress = state.xp % 180;

  return (
    <aside className="sidebar">
      <Brand />
      <WorkspaceSelector />
      <nav className="side-nav" aria-label="Main navigation">
        <p className="nav-eyebrow">Workspace</p>
        {navigation.map(item => {
          const Icon = item.icon;
          return (
            <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => setView(item.id)}>
              <Icon size={19} />
              <span><strong>{item.label}</strong><small>{item.sw}</small></span>
              {view === item.id && <ChevronRight size={15} className="nav-chevron" />}
            </button>
          );
        })}
      </nav>

      <div className="level-card">
        <div className="level-icon"><Sparkles size={18} /></div>
        <div className="level-copy">
          <span>Level {level} · Rising Inspector</span>
          <div className="mini-progress"><i style={{ width: `${(levelProgress / 180) * 100}%` }} /></div>
          <small>{180 - levelProgress} XP to next level</small>
        </div>
      </div>

      <button className="sidebar-cta" onClick={() => startPractice('oral')}>
        <Mic2 size={18} /> Start mock panel
      </button>
      <button className="sidebar-help" onClick={guide?.openGuide}>
        <HelpCircle size={16} /> How to use this app
      </button>
      {profile && <p className="independent-note">{profile.name} · {profile.jobPosition}<br />Independent preparation tool</p>}
    </aside>
  );
}

function MobileHeader({ onMenu }: { onMenu: () => void }) {
  const { state } = useApp();
  return (
    <header className="mobile-header">
      <button className="icon-button" onClick={onMenu} aria-label="Open menu"><Menu size={21} /></button>
      <Brand compact />
      <span className="xp-chip"><Sparkles size={14} /> {state.xp}</span>
    </header>
  );
}

function MobileDrawer({ open, close }: { open: boolean; close: () => void }) {
  const { view, setView } = useApp();
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, close]);
  if (!open) return null;
  return (
    <div className="drawer-backdrop" onClick={event => { if (event.target === event.currentTarget) close(); }} role="presentation">
      <aside className="mobile-drawer" aria-label="Mobile menu">
        <div className="drawer-head"><Brand /><button className="icon-button" onClick={close} aria-label="Close menu"><X size={20} /></button></div>
        <nav>
          {navigation.map(item => {
            const Icon = item.icon;
            return <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => { setView(item.id); close(); }}><Icon size={19} /><span><strong>{item.label}</strong><small>{item.sw}</small></span></button>;
          })}
        </nav>
      </aside>
    </div>
  );
}

function BottomNav() {
  const { view, setView } = useApp();
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      {navigation.slice(0, 4).map(item => {
        const Icon = item.icon;
        return <button key={item.id} className={view === item.id ? 'active' : ''} onClick={() => setView(item.id)}><Icon size={19} /><span>{item.sw}</span></button>;
      })}
    </nav>
  );
}

function TopContext() {
  const { state, profile, attempts, startPractice } = useApp();
  return (
    <header className="context-bar">
      <div className="role-context">
        <span className="role-symbol"><Target size={17} /></span>
        <div><small>Private interview plan</small><strong>{profile?.jobPosition} {profile?.organization && <span>· {profile.organization}</span>}</strong></div>
      </div>
      <div className="context-actions">
        <span className="top-stat"><Flame size={17} /> <b>{state.streak}</b> day streak</span>
        <span className="top-stat"><Gauge size={17} /> <b>{attempts.length}</b> attempts</span>
        <button className="button small primary" onClick={() => startPractice('oral')}><Mic2 size={16} /> Quick practice</button>
      </div>
    </header>
  );
}

export default function App() {
  const { profile, view, toast } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Auto-show guide after onboarding completes (first visit only)
  useEffect(() => {
    if (!profile) return;
    const hasSeenGuide = (() => { try { return !!localStorage.getItem(GUIDE_KEY); } catch { return false; } })();
    if (hasSeenGuide) return;
    const timer = setTimeout(() => setShowGuide(true), 600);
    return () => clearTimeout(timer);
  }, [profile]);

  const openGuide = useCallback(() => setShowGuide(true), []);
  const closeGuide = useCallback(() => {
    setShowGuide(false);
    try { localStorage.setItem(GUIDE_KEY, '1'); } catch { /* ok */ }
  }, []);

  useEffect(() => {
    const titles: Record<View, string> = { dashboard: 'Today', practice: 'Practice', materials: 'Materials', progress: 'Progress', settings: 'Settings' };
    document.title = profile ? `${titles[view]} — KaziCoach TZ` : 'Private setup — KaziCoach TZ';
    trackPageView(profile ? view : 'onboarding');
  }, [view, profile]);

  if (!profile) return <Onboarding />;

  return (
    <GuideContext.Provider value={{ showGuide, openGuide, closeGuide }}>
      <div className="app-shell">
        {showGuide && <InteractiveGuide onClose={closeGuide} />}
        <Sidebar />
        <MobileHeader onMenu={() => setMenuOpen(true)} />
        <MobileDrawer open={menuOpen} close={() => setMenuOpen(false)} />
        <div className="app-main">
          <TopContext />
          <main className="page-stage">
            {view === 'dashboard' && <Dashboard />}
            {view === 'practice' && <Practice />}
            {view === 'materials' && <Materials />}
            {view === 'progress' && <Progress />}
            {view === 'settings' && <SettingsView />}
          </main>
        </div>
        <BottomNav />
        {toast && <div className="toast" role="status"><BookOpenText size={17} /> {toast}</div>}
      </div>
    </GuideContext.Provider>
  );
}
