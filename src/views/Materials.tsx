import {
  AlertCircle, Bot, Check, CheckCircle2, Cloud, File, FileImage, FileText,
  FolderLock, FolderUp, Info, Loader2, LockKeyhole, Plus, ScanText, ShieldCheck,
  Sparkles, Trash2, UploadCloud, WandSparkles, X,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useApp } from '../context';
import { track } from '../lib/analytics';
import { createLocalQuestions, extractMaterial } from '../lib/materials';
import { oralBankFor } from '../lib/personalization';
import { fetchAiConfig, loadTurnstile, renderTurnstile, type AiConfig } from '../lib/turnstile';
import type { Material, OralQuestion, QuestionCategory } from '../types';

const formatBytes = (value: number) => value < 1024 ? `${value} B` : value < 1024 * 1024 ? `${Math.round(value / 1024)} KB` : `${(value / (1024 * 1024)).toFixed(1)} MB`;

function FileIcon({ material }: { material: Material }) {
  if (material.kind === 'image') return <FileImage size={21} />;
  if (material.kind === 'cv') return <FileText size={21} />;
  return <File size={21} />;
}

function validateAIQuestion(value: unknown, index: number): OralQuestion | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.question !== 'string' || typeof record.modelAnswer !== 'string') return null;
  const points = Array.isArray(record.keyPoints) ? record.keyPoints.filter((item): item is string => typeof item === 'string').slice(0, 6) : [];
  if (!points.length) return null;
  const allowed: QuestionCategory[] = ['personal', 'role', 'technical', 'scenario', 'ethics'];
  const category: QuestionCategory = allowed.includes(record.category as QuestionCategory) ? (record.category as QuestionCategory) : 'technical';
  return {
    id: `ai-${Date.now()}-${index}`, category, difficulty: 'Core',
    question: record.question.slice(0, 500), swHint: typeof record.swHint === 'string' ? record.swHint.slice(0, 500) : 'Jibu kwa mpangilio na utoe mfano mmoja.',
    modelAnswer: record.modelAnswer.slice(0, 3000), keyPoints: points,
    keywords: points.map(point => [point.toLowerCase()]), timeLimit: 90,
    source: 'Optional AI generation · verify before use', custom: true,
  };
}

export default function Materials() {
  const { setState, profile, materials, customQuestions, notify, startPractice } = useApp();
  const questionBank = useMemo(() => oralBankFor(profile!, materials, customQuestions), [profile, materials, customQuestions]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pastedName, setPastedName] = useState('My preparation notes');
  const [pastedText, setPastedText] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(materials.find(item => item.status === 'ready')?.id || null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<'unknown' | 'ready' | 'offline'>('unknown');
  const [aiConfig, setAiConfig] = useState<AiConfig | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const turnstileBoxRef = useRef<HTMLDivElement | null>(null);

  const selected = materials.find(item => item.id === selectedId);

  // The AI route decides whether a human check is required; load its config once.
  useEffect(() => {
    let cancelled = false;
    void fetchAiConfig().then(config => {
      if (!cancelled) setAiConfig(config ?? { configured: false, turnstile: false, siteKey: null });
    });
    return () => { cancelled = true; };
  }, []);

  // Render the Turnstile widget only when the server demands verification and no token exists yet.
  useEffect(() => {
    if (!aiConfig?.turnstile || !aiConfig.siteKey || turnstileToken) return;
    let cancelled = false;
    void loadTurnstile().then(api => {
      if (cancelled || !api || !turnstileBoxRef.current) return;
      renderTurnstile(
        turnstileBoxRef.current,
        aiConfig.siteKey as string,
        token => setTurnstileToken(token),
        () => setTurnstileToken(null),
      );
    });
    return () => { cancelled = true; };
  }, [aiConfig, turnstileToken]);

  const handleFiles = async (files: FileList | File[]) => {
    setProcessing(true);
    const additions: Material[] = [];
    for (const file of Array.from(files)) {
      try {
        additions.push(await extractMaterial(file));
      } catch (error) {
        notify(`${file.name}: ${error instanceof Error ? error.message : 'Could not process file.'}`);
      }
    }
    if (additions.length) {
      setState(current => {
        const activeId = current.activeWorkspaceId ?? current.workspaces[0]?.id;
        return {
          ...current,
          workspaces: current.workspaces.map(ws =>
            ws.id === activeId ? { ...ws, materials: [...additions, ...ws.materials].slice(0, 20) } : ws
          ),
        };
      });
      const ready = additions.find(item => item.status === 'ready');
      if (ready) setSelectedId(ready.id);
      notify(`${additions.length} private material${additions.length === 1 ? '' : 's'} added locally.`);
    }
    setProcessing(false);
  };

  const savePaste = () => {
    if (pastedText.trim().length < 40) { notify('Paste at least a short paragraph so I can create useful questions.'); return; }
    const material: Material = {
      id: crypto.randomUUID(), name: pastedName.trim() || 'Pasted notes', kind: 'notes', mime: 'text/plain',
      size: new Blob([pastedText]).size, extractedText: pastedText.trim().slice(0, 100_000), status: 'ready', addedAt: new Date().toISOString(),
    };
    setState(current => {
      const activeId = current.activeWorkspaceId ?? current.workspaces[0]?.id;
      return {
        ...current,
        workspaces: current.workspaces.map(ws =>
          ws.id === activeId ? { ...ws, materials: [material, ...ws.materials].slice(0, 20) } : ws
        ),
      };
    });
    setSelectedId(material.id); setPastedText(''); setPasteOpen(false); notify('Notes saved privately in this browser.');
  };

  const localGenerate = () => {
    if (!selected?.extractedText) { notify('Select a text-based material first. Images need OCR or the optional cloud coach.'); return; }
    const cards = createLocalQuestions(selected.extractedText, selected.name);
    if (!cards.length) { notify('I need longer complete sentences in this material to create local cards.'); return; }
      setState(current => {
        const activeId = current.activeWorkspaceId ?? current.workspaces[0]?.id;
        return {
          ...current,
          workspaces: current.workspaces.map(ws =>
            ws.id === activeId ? { ...ws, customQuestions: [...cards, ...ws.customQuestions].slice(0, 60) } : ws
          ),
        };
      });
    track('materials_generated', { source: 'local' });
    notify(`${cards.length} local practice cards created — no data left your device.`);
  };

  const aiGenerate = async () => {
    if (!selected?.extractedText) { notify('Select a text-based material first.'); return; }
    if (!window.confirm(`Send up to 30,000 characters from “${selected.name}” to the configured Gemini service? Do not continue if it contains information you do not want processed by the provider.`)) return;
    setAiLoading(true);
    try {
      const response = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialName: selected.name,
          material: selected.extractedText.slice(0, 30_000),
          role: profile!.jobPosition,
          organization: profile!.organization || 'Target organization not specified',
          turnstileToken: turnstileToken || undefined,
        }),
      });
      if (!response.ok) throw new Error(response.status === 503 ? 'Cloud coach is not configured yet.' : response.status === 429 ? 'Too many AI requests from this connection. Wait a little and try again.' : response.status === 403 ? 'Security check failed. Complete the verification and try again.' : 'Cloud generation failed safely.');
      const payload = await response.json();
      const cards = (Array.isArray(payload.questions) ? payload.questions : []).map(validateAIQuestion).filter(Boolean) as OralQuestion[];
      if (!cards.length) throw new Error('The cloud response did not contain valid practice cards.');
    setState(current => {
      const activeId = current.activeWorkspaceId ?? current.workspaces[0]?.id;
      return {
        ...current,
        workspaces: current.workspaces.map(ws =>
          ws.id === activeId ? { ...ws, customQuestions: [...cards, ...ws.customQuestions].slice(0, 60) } : ws
        ),
      };
    });
      setAiStatus('ready');
      track('materials_generated', { source: 'ai' });
      notify(`${cards.length} AI-assisted cards added. Please verify their facts.`);
    } catch (error) {
      setAiStatus('offline');
      notify(error instanceof Error ? error.message : 'Cloud coach unavailable. Local generation still works.');
    } finally { setAiLoading(false); }
  };

  const removeMaterial = (id: string) => {
    setState(current => {
      const activeId = current.activeWorkspaceId ?? current.workspaces[0]?.id;
      return {
        ...current,
        workspaces: current.workspaces.map(ws =>
          ws.id === activeId ? { ...ws, materials: ws.materials.filter(item => item.id !== id) } : ws
        ),
      };
    });
    if (selectedId === id) setSelectedId(null);
    notify('Material removed from this browser.');
  };

  return (
    <div className="page materials-page">
      <section className="page-title-row">
        <div><span className="eyebrow">Private preparation library</span><h1>Materials</h1><p>Add a CV, job description or notes. Core extraction happens on your device.</p></div>
        <span className="local-status"><LockKeyhole size={16} /> Local-first storage</span>
      </section>

      <section className="material-summary-grid">
        <article><span className="summary-icon"><FileText /></span><div><small>Candidate profile</small><strong>{profile!.name}</strong><span>Stored only in this browser</span></div><CheckCircle2 size={18} className="ok" /></article>
        <article><span className="summary-icon blue"><ShieldCheck /></span><div><small>Active job brief</small><strong>{profile!.jobPosition}</strong><span>{profile!.organization || 'Organization not specified'}</span></div><CheckCircle2 size={18} className="ok" /></article>
        <article><span className="summary-icon gold"><Sparkles /></span><div><small>Practice bank</small><strong>{questionBank.length} oral questions</strong><span>{customQuestions.length} created from your materials</span></div><button className="text-button" onClick={() => startPractice('oral')}>Practise</button></article>
      </section>

      <section className="materials-grid">
        <div className="materials-left">
          <article className="panel upload-panel">
            <div className="panel-heading"><div><span className="eyebrow">Add source material</span><h2>Build a better role pack</h2></div><span className="privacy-chip"><FolderLock size={14} /> Private by default</span></div>
            <div className={`drop-zone ${dragging ? 'dragging' : ''}`} onDragOver={event => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={event => { event.preventDefault(); setDragging(false); handleFiles(event.dataTransfer.files); }}>
              <input ref={inputRef} type="file" multiple accept=".txt,.md,.pdf,.docx,image/jpeg,image/png,image/webp" onChange={event => event.target.files && handleFiles(event.target.files)} hidden />
              <span className="drop-icon">{processing ? <Loader2 className="spin" /> : <UploadCloud />}</span>
              <h3>{processing ? 'Reading your files locally…' : 'Drop CV, advert, notes or images here'}</h3>
              <p>PDF, DOCX, TXT, MD, JPG, PNG or WEBP · up to 8 MB each</p>
              <div><button className="button secondary" onClick={() => inputRef.current?.click()} disabled={processing}><FolderUp size={17} /> Choose files</button><button className="button ghost" onClick={() => setPasteOpen(value => !value)}><Plus size={17} /> Paste text</button></div>
            </div>
            {pasteOpen && <div className="paste-box"><div><label>Source name<input value={pastedName} onChange={event => setPastedName(event.target.value)} /></label><button className="icon-button" onClick={() => setPasteOpen(false)} aria-label="Close paste area"><X size={17} /></button></div><label>Paste content<textarea rows={7} value={pastedText} onChange={event => setPastedText(event.target.value)} placeholder="Paste the current job description, CV text or study notes…" /></label><button className="button primary" onClick={savePaste}>Save private notes</button></div>}
            <div className="privacy-explainer"><ShieldCheck size={19} /><div><strong>Your documents do not upload automatically.</strong><span>Text is extracted and kept in this browser. Only “Create with AI” sends selected text after confirmation.</span></div></div>
          </article>

          <article className="panel sources-panel">
            <div className="panel-heading"><div><span className="eyebrow">Your local library</span><h2>Preparation sources</h2></div><span className="count-chip">{materials.length} sources</span></div>
            <div className="source-list">
              {materials.map(material => (
                <button key={material.id} className={`material-row selectable ${selectedId === material.id ? 'selected' : ''}`} onClick={() => setSelectedId(material.id)}>
                  <span className={`file-type ${material.kind === 'image' ? 'gold' : ''}`}><FileIcon material={material} /></span>
                  <div><strong>{material.name}</strong><span>{formatBytes(material.size)} · {material.status === 'ready' ? `${material.extractedText.length.toLocaleString()} text characters` : 'Image reference · OCR not active'}</span></div>
                  <em>{selectedId === material.id ? <><Check size={14} /> Selected</> : material.kind}</em>
                  <span className="delete-material" role="button" tabIndex={0} aria-label={`Remove ${material.name}`} onClick={event => { event.stopPropagation(); removeMaterial(material.id); }} onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); event.stopPropagation(); removeMaterial(material.id); } }}><Trash2 size={16} /></span>
                </button>
              ))}
              {!materials.length && <div className="empty-library"><ScanText size={24} /><p>Your private files will appear here.</p></div>}
            </div>
          </article>
        </div>

        <aside className="generator-column">
          <article className="panel generator-card">
            <span className="generator-icon"><WandSparkles size={22} /></span>
            <span className="eyebrow">Question builder</span>
            <h2>Turn one source into practice</h2>
            <p>{selected ? <>Selected: <strong>{selected.name}</strong></> : 'Select a text source from your library.'}</p>
            <div className="generator-option local">
              <div><ShieldCheck size={18} /><span><strong>Local cards</strong><small>Private · instant · template-based</small></span></div>
              <button className="button secondary full" onClick={localGenerate} disabled={!selected || selected.status !== 'ready'}>Create locally</button>
            </div>
            <div className="or-divider"><span>or</span></div>
            <div className="generator-option cloud">
              <div><Bot size={18} /><span><strong>Gemini cloud coach</strong><small>{aiStatus === 'ready' ? 'Connected on last request' : aiStatus === 'offline' ? 'Not configured or unavailable' : 'Optional server integration'}</small></span></div>
              <button className="button primary full" onClick={aiGenerate} disabled={!selected || selected.status !== 'ready' || aiLoading || Boolean(aiConfig?.turnstile && !turnstileToken)}>{aiLoading ? <><Loader2 size={16} className="spin" /> Creating…</> : <><Cloud size={16} /> Create with AI</>}</button>
              {aiConfig?.turnstile && !turnstileToken && (
                <div className="turnstile-block">
                  <div ref={turnstileBoxRef} className="turnstile-slot" aria-label="Security verification" />
                  <small className="turnstile-note">This connection needs a quick human check before AI generation.</small>
                </div>
              )}
              {aiConfig?.turnstile && turnstileToken && <small className="turnstile-note ok"><Check size={13} /> Human check complete</small>}
            </div>
            <div className="mini-warning"><AlertCircle size={15} /><span>AI content can be wrong. Verify laws, limits and role facts against official sources.</span></div>
          </article>

          <article className="panel profile-review">
            <div className="panel-heading"><div><span className="eyebrow">Private customization</span><h2>Your current context</h2></div><Info size={18} /></div>
            <div className="fact-row"><span><strong>Candidate</strong><small>{profile!.name}</small></span><em>Local</em></div>
            <div className="fact-row"><span><strong>Position</strong><small>{profile!.jobPosition}</small></span><em>Local</em></div>
            <div className="fact-row"><span><strong>Organization</strong><small>{profile!.organization || 'Not specified'}</small></span><em>Local</em></div>
            <div className="fact-row"><span><strong>Source documents</strong><small>{materials.length} file{materials.length === 1 ? '' : 's'} in this browser</small></span><em>Private</em></div>
            <p>KaziCoach uses this context only on your device. It does not create candidate achievements that are missing from your own files.</p>
          </article>
        </aside>
      </section>
    </div>
  );
}
