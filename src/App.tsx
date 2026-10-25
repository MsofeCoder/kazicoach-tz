import {
  BarChart3, BookOpenText, ChevronRight, Flame, FolderUp, Gauge, Home,
  Menu, Mic2, Settings, ShieldCheck, Sparkles, Target, X, Compass,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { candidate } from './data';
import { useApp } from './context';
import type { View } from './types';
import Dashboard from './views/Dashboard';
import Practice from './views/Practice';
import Materials from './views/Materials';
import Progress from './views/Progress';
import SettingsView from './views/Settings';
import {AccountRecovery} from './views/AccountRecovery';
import WelcomeGuide from './views/WelcomeGuide';
import { rememberGuide, shouldOfferGuide } from './lib/onboarding';

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

function Sidebar({ onGuide }: { onGuide: () => void }) {
  const { view, setView, state, startPractice } = useApp();
  const level = Math.floor(state.xp / 180) + 1;
  const levelProgress = state.xp % 180;

  return (
    <aside className="sidebar">
      <Brand />
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

      <button className="nav-item guide-entry" onClick={onGuide}><Compass size={19} /><span><strong>Show me around</strong><small>Your quick guide</small></span></button>

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
      <p className="independent-note">Independent preparation tool<br />Not affiliated with PSRS or TAEC</p>
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

function MobileDrawer({ open, close, onGuide }: { open: boolean; close: () => void; onGuide: () => void }) {
  const { view, setView } = useApp();
  if (!open) return null;
  return (
    <div className="drawer-backdrop" onClick={close} role="presentation">
      <aside className="mobile-drawer" onClick={event => event.stopPropagation()} aria-label="Mobile menu">
        <div className="drawer-head"><Brand /><button className="icon-button" onClick={close} aria-label="Close menu"><X size={20} /></button></div>
        <nav>
          {navigation.map(item => {
            const Icon = item.icon;
            return <button key={item.id} className={`nav-item ${view === item.id ? 'active' : ''}`} onClick={() => { setView(item.id); close(); }}><Icon size={19} /><span><strong>{item.label}</strong><small>{item.sw}</small></span></button>;
          })}
        </nav>
        <button className="nav-item guide-entry" onClick={() => { close(); onGuide(); }}><Compass size={19} /><span><strong>Show me around</strong><small>Your quick guide</small></span></button>
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
  const { state, startPractice } = useApp();
  return (
    <header className="context-bar">
      <div className="role-context">
        <span className="role-symbol"><Target size={17} /></span>
        <div><small>Active interview plan</small><strong>{candidate.role} <span>· {candidate.organizationShort}</span></strong></div>
      </div>
      <div className="context-actions">
        <span className="top-stat"><Flame size={17} /> <b>{state.streak}</b> day streak</span>
        <span className="top-stat"><Gauge size={17} /> <b>{state.attempts.length}</b> attempts</span>
        <button className="button small primary" onClick={() => startPractice('oral')}><Mic2 size={16} /> Quick practice</button>
      </div>
    </header>
  );
}

export default function App() {
  const { view, toast, setView } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [guideOrigin, setGuideOrigin] = useState<View>(view);
  const [guideScroll, setGuideScroll] = useState(0);
  const [guideOpen, setGuideOpen] = useState(() => {
    try { return shouldOfferGuide(window.localStorage, window.location.search); } catch { return false; }
  });
  const closeGuide = () => {
    try { rememberGuide(window.localStorage); } catch { /* Private storage may be unavailable. */ }
    setGuideOpen(false);
    setView(guideOrigin);
    requestAnimationFrame(() => {
      window.scrollTo({ top: guideScroll, behavior: 'instant' });
      document.querySelector<HTMLElement>(`[data-tour-page="${guideOrigin}"]`)?.focus({ preventScroll: true });
    });
  };
  const openGuide = () => { setGuideOrigin(view); setGuideScroll(window.scrollY); setGuideOpen(true); };
  const exploreGuide = (destination: View) => {
    try { rememberGuide(window.localStorage); } catch { /* Storage is optional. */ }
    setGuideOpen(false);
    setView(destination);
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-tour-page="${destination}"]`)?.focus({ preventScroll: true }));
  };

  useEffect(() => {
    const titles: Record<View, string> = { dashboard: 'Today', practice: 'Practice', materials: 'Materials', progress: 'Progress', settings: 'Settings' };
    document.title = `${titles[view]} — KaziCoach TZ`;
  }, [view]);

  return (
    <div className="app-shell">
      <Sidebar onGuide={openGuide} />
      <MobileHeader onMenu={() => setMenuOpen(true)} />
      <MobileDrawer open={menuOpen} close={() => setMenuOpen(false)} onGuide={openGuide} />
      <div className="app-main">
        <TopContext />
        <main className="page-stage">
          <AccountRecovery />
          {navigation.map(({ id }) => (view === id || (guideOpen && guideOrigin === id)) &&
            <div key={id} data-tour-page={id} hidden={view !== id} tabIndex={-1}>
              {id === 'dashboard' && <Dashboard />}
              {id === 'practice' && <Practice paused={guideOpen} />}
              {id === 'materials' && <Materials />}
              {id === 'progress' && <Progress />}
              {id === 'settings' && <SettingsView onGuide={openGuide} />}
            </div>)}
        </main>
      </div>
      <BottomNav />
      {guideOpen && <WelcomeGuide close={closeGuide} navigate={setView} explore={exploreGuide} activeView={view} />}
      {toast && <div className="toast" role="status"><BookOpenText size={17} /> {toast}</div>}
    </div>
  );
}
