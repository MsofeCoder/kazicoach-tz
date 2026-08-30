import {
  Bell, Check, CloudCog, Download, ExternalLink, FileJson, Gauge, Globe2,
  HardDrive, Info, LockKeyhole, ShieldCheck, SlidersHorizontal, Trash2, Users,
  Volume2,
} from 'lucide-react';
import { useApp } from '../context';
import { clearState, defaultState } from '../lib/storage';
import { exportWorkspace } from '../lib/backup';
import { speechSupported, speakText } from '../lib/speech';
import { selectPanelVoice, voiceDelivery, voiceStyleOptions } from '../lib/voices';

export default function SettingsView() {
  const { state, setState, notify, setView } = useApp();
  const profile = state.profile!;

  const updatePreference = <K extends keyof typeof state.preferences>(key: K, value: (typeof state.preferences)[K]) => {
    setState(current => ({ ...current, preferences: { ...current.preferences, [key]: value } }));
  };

  const testVoice = () => {
    if (!speechSupported()) { notify('Read-aloud is not available in this browser.'); return; }
    const voice = selectPanelVoice(state.preferences.voiceStyle, 0);
    const delivery = voiceDelivery(state.preferences.voiceStyle, state.preferences.speechRate);
    speakText(`Good morning, ${profile.name.split(/\s+/)[0]}. Please give us five clear points, then connect your answer to the ${profile.jobPosition} role.`, {
      voice, lang: 'en-GB', rate: delivery.rate, pitch: delivery.pitch, volume: delivery.volume,
    });
  };

  const exportData = () => {
    const filename = exportWorkspace(state);
    setState(current => ({ ...current, lastExportAt: new Date().toISOString() }));
    notify(`Progress export downloaded (${filename}).`);
  };

  const reset = () => {
    if (!window.confirm('Delete this entire private workspace—including profile, attempts, materials and custom questions—from this browser? This cannot be undone.')) return;
    clearState(); setState(defaultState); setView('dashboard'); notify('Private workspace deleted. You can create a new one now.');
  };

  return (
    <div className="page settings-page">
      <section className="page-title-row"><div><span className="eyebrow">Your experience</span><h1>Settings</h1><p>Control coaching, privacy and your locally stored progress.</p></div><span className="local-status"><ShieldCheck size={16} /> Privacy-first MVP</span></section>

      <section className="settings-grid">
        <div className="settings-main">
          <article className="panel settings-section">
            <div className="settings-heading"><span><SlidersHorizontal size={19} /></span><div><h2>Coaching preferences</h2><p>Choose how the practice room supports you.</p></div></div>
            <div className="setting-row"><div><Globe2 size={18} /><span><strong>Kiswahili coach hints</strong><small>Keep panel questions in English and show short Kiswahili guidance.</small></span></div><button className={`toggle ${state.preferences.swahiliCoach ? 'on' : ''}`} onClick={() => updatePreference('swahiliCoach', !state.preferences.swahiliCoach)} aria-pressed={state.preferences.swahiliCoach}><i /></button></div>
            <div className="setting-row"><div><Users size={18} /><span><strong>Interviewer voice</strong><small>Mix the five panel voices, or choose male, female, soft or deep delivery.</small></span></div><select className="settings-select" value={state.preferences.voiceStyle} onChange={event => updatePreference('voiceStyle', event.target.value as typeof state.preferences.voiceStyle)}>{voiceStyleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div>
            <div className="setting-row slider-setting"><div><Gauge size={18} /><span><strong>Read-aloud speed</strong><small>Applies to browser text-to-speech in the practice room.</small></span></div><div className="range-control"><input type="range" min="0.7" max="1.2" step="0.05" value={state.preferences.speechRate} onChange={event => updatePreference('speechRate', Number(event.target.value))} /><strong>{state.preferences.speechRate.toFixed(2)}×</strong><button className="button ghost small" onClick={testVoice}><Volume2 size={15} /> Test</button></div></div>
            <div className="setting-row disabled"><div><Bell size={18} /><span><strong>Study reminders</strong><small>Coming in Phase 1.1. Browser reminders require explicit permission.</small></span></div><em>Coming soon</em></div>
          </article>

          <article className="panel settings-section">
            <div className="settings-heading"><span><CloudCog size={19} /></span><div><h2>Optional AI coach</h2><p>A server-side Gemini integration can create extra questions.</p></div></div>
            <div className="ai-config-status"><span><i /><div><strong>Offline-first mode active</strong><small>The app never needs AI to run its built-in pack.</small></div></span><em>Recommended</em></div>
            <div className="config-code"><small>Cloudflare environment secrets</small><code>GEMINI_API_KEY=••••••••</code><code>GEMINI_MODEL=gemini-2.5-flash</code></div>
            <div className="settings-note"><Info size={17} /><p>API keys must be set in the hosting dashboard, never in browser code or local storage. Free quotas vary by project/model and have no guaranteed SLA.</p></div>
          </article>

          <article className="panel settings-section danger-section">
            <div className="settings-heading"><span><HardDrive size={19} /></span><div><h2>Your local data</h2><p>There is no account or cloud database in this MVP.</p></div></div>
            <div className="data-summary"><span><strong>{state.attempts.length}</strong><small>Attempts</small></span><span><strong>{state.materials.length}</strong><small>Materials</small></span><span><strong>{state.customQuestions.length}</strong><small>Custom cards</small></span><span><strong>{state.xp}</strong><small>XP</small></span></div>
            <div className="settings-note"><Info size={17} /><p>{state.lastExportAt ? `Last JSON export: ${new Intl.DateTimeFormat('en-TZ', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Africa/Dar_es_Salaam' }).format(new Date(state.lastExportAt))}. An automatic IndexedDB mirror also updates after every answer.` : 'No JSON export yet. An automatic IndexedDB mirror updates after every answer, but a downloaded copy is the strongest backup.'}</p></div>
            <div className="data-actions"><button className="button secondary" onClick={exportData}><FileJson size={16} /> Export JSON</button><button className="button danger" onClick={reset}><Trash2 size={16} /> Delete workspace & start new</button></div>
          </article>
        </div>

        <aside className="settings-side">
          <article className="panel target-settings-card"><span className="eyebrow">Private active plan</span><h2>{profile.jobPosition}</h2><p>{profile.organization || 'Organization not specified'}</p><div><span>Candidate</span><strong>{profile.name}</strong></div><div><span>Interview date</span><strong>{profile.interviewDate || 'Not added'}</strong></div><div><span>Private sources</span><strong>{state.materials.length} stored on this device</strong></div><em><Check size={14} /> Local customization active</em></article>

          <article className="panel trust-card"><span className="trust-icon"><LockKeyhole size={22} /></span><h2>Privacy in plain language</h2><ul><li>Files are read locally by default.</li><li>No raw audio is stored.</li><li>Progress stays in this browser.</li><li>AI sends text only after confirmation.</li></ul><button className="text-button" onClick={exportData}><Download size={15} /> Back up my progress</button></article>

          <article className="panel source-links"><span className="eyebrow">Official references</span><h2>Verify before interview day</h2><a href="https://portal.ajira.go.tz/auth/login" target="_blank" rel="noreferrer">Ajira Portal <ExternalLink size={14} /></a><a href="https://www.taec.go.tz/pages/functions-and-responsibilities" target="_blank" rel="noreferrer">TAEC functions <ExternalLink size={14} /></a><a href="https://ai.google.dev/gemini-api/docs/rate-limits" target="_blank" rel="noreferrer">Gemini rate limits <ExternalLink size={14} /></a></article>
        </aside>
      </section>

      <section className="disclaimer-panel"><Info size={20} /><div><strong>Independent preparation tool</strong><p>KaziCoach TZ is not affiliated with or endorsed by PSRS, Ajira Portal, TAEC, IAEA or any employer. Scores and generated content are educational aids, not official grades or selection predictions. Verify legal and technical information against current official sources.</p></div></section>
    </div>
  );
}
