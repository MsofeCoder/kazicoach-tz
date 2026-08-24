import {
  AlertCircle, Bot, Check, CheckCircle2, Cloud, File, FileImage, FileText,
  FolderLock, FolderUp, Info, Loader2, LockKeyhole, Plus, ScanText, ShieldCheck,
  Sparkles, Trash2, UploadCloud, WandSparkles, X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { candidate, oralQuestions } from '../data';
import { useApp } from '../context';
import { createLocalQuestions, extractMaterial } from '../lib/materials';
import type { Material, OralQuestion, QuestionCategory } from '../types';

const formatBytes = (value: number) => value < 1024 ? `${value} B` : value < 1024 * 1024 ? `${Math.round(value / 1024)} KB` : `${(value / (1024 * 1024)).toFixed(1)} MB`;

function FileIcon({ material }: { material: Material }) {
  if (material.kind === 'image') return <FileImage size={21} />;
  if (material.kind === 'cv') return <FileText size={21} />;
  return <File size={21} />;
}

function validateAIQuestion(value: any, index: number): OralQuestion | null {
  if (!value || typeof value.question !== 'string' || typeof value.modelAnswer !== 'string') return null;
  const points = Array.isArray(value.keyPoints) ? value.keyPoints.filter((item: unknown) => typeof item === 'string').slice(0, 6) : [];
  if (!points.length) return null;
  const allowed: QuestionCategory[] = ['personal', 'role', 'technical', 'scenario', 'ethics'];
  const category: QuestionCategory = allowed.includes(value.category) ? value.category : 'technical';
  return {
    id: `ai-${Date.now()}-${index}`, category, difficulty: 'Core',
    question: value.question.slice(0, 500), swHint: typeof value.swHint === 'string' ? value.swHint.slice(0, 500) : 'Jibu kwa mpangilio na utoe mfano mmoja.',
    modelAnswer: value.modelAnswer.slice(0, 3000), keyPoints: points,
    keywords: points.map((point: string) => [point.toLowerCase()]), timeLimit: 90,
    source: 'Optional AI generation · verify before use', custom: true,
  };
}

export default function Materials() {
  const { state, setState, notify, startPractice } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pastedName, setPastedName] = useState('My preparation notes');
  const [pastedText, setPastedText] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(state.materials.find(item => item.status === 'ready')?.id || null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiStatus, setAiStatus] = useState<'unknown' | 'ready' | 'offline'>('unknown');

  const selected = state.materials.find(item => item.id === selectedId);

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
      setState(current => ({ ...current, materials: [...additions, ...current.materials].slice(0, 20) }));
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
    setState(current => ({ ...current, materials: [material, ...current.materials].slice(0, 20) }));
    setSelectedId(material.id); setPastedText(''); setPasteOpen(false); notify('Notes saved privately in this browser.');
  };

  const localGenerate = () => {
    if (!selected?.extractedText) { notify('Select a text-based material first. Images need OCR or the optional cloud coach.'); return; }
    const cards = createLocalQuestions(selected.extractedText, selected.name);
    if (!cards.length) { notify('I need longer complete sentences in this material to create local cards.'); return; }
    setState(current => ({ ...current, customQuestions: [...cards, ...current.customQuestions].slice(0, 60) }));
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
          role: candidate.role,
          organization: candidate.organization,
        }),
      });
      if (!response.ok) throw new Error(response.status === 503 ? 'Cloud coach is not configured yet.' : response.status === 429 ? 'Free AI quota is busy. Try local generation now.' : 'Cloud generation failed safely.');
      const payload = await response.json();
      const cards = (Array.isArray(payload.questions) ? payload.questions : []).map(validateAIQuestion).filter(Boolean) as OralQuestion[];
      if (!cards.length) throw new Error('The cloud response did not contain valid practice cards.');
      setState(current => ({ ...current, customQuestions: [...cards, ...current.customQuestions].slice(0, 60) }));
      setAiStatus('ready');
      notify(`${cards.length} AI-assisted cards added. Please verify their facts.`);
    } catch (error) {
      setAiStatus('offline');
      notify(error instanceof Error ? error.message : 'Cloud coach unavailable. Local generation still works.');
    } finally { setAiLoading(false); }
  };

  const removeMaterial = (id: string) => {
    setState(current => ({ ...current, materials: current.materials.filter(item => item.id !== id) }));
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
        <article><span className="summary-icon"><FileText /></span><div><small>Candidate profile</small><strong>{candidate.name}</strong><span>{candidate.profileFacts.length} facts grounded in current CV</span></div><CheckCircle2 size={18} className="ok" /></article>
        <article><span className="summary-icon blue"><ShieldCheck /></span><div><small>Active job brief</small><strong>{candidate.role}</strong><span>{candidate.organizationShort} · {candidate.vacancyCount} posts</span></div><CheckCircle2 size={18} className="ok" /></article>
        <article><span className="summary-icon gold"><Sparkles /></span><div><small>Practice bank</small><strong>{oralQuestions.length + state.customQuestions.length} oral questions</strong><span>{state.customQuestions.length} created from your materials</span></div><button className="text-button" onClick={() => startPractice('oral')}>Practise</button></article>
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
            <div className="panel-heading"><div><span className="eyebrow">Your library</span><h2>Preparation sources</h2></div><span className="count-chip">{state.materials.length + 4} sources</span></div>
            <div className="source-list">
              <div className="material-row built-in"><span className="file-type"><FileText size={21} /></span><div><strong>Nyunyusa current candidate profile</strong><span>Grounded in uploaded 12-page application/CV</span></div><em>Verified source</em></div>
              <div className="material-row built-in"><span className="file-type blue"><ShieldCheck size={21} /></span><div><strong>TAEC Inspector II role brief</strong><span>context.md + official vacancy duties</span></div><em>Built in</em></div>
              <div className="material-row built-in"><span className="file-type"><FileText size={21} /></span><div><strong>Tanzania radiation regulation notes</strong><span>Atomic Energy Act, licensing, emergency and inspection topics</span></div><em>Built in</em></div>
              <div className="material-row built-in"><span className="file-type gold"><ScanText size={21} /></span><div><strong>Field interview research report</strong><span>Technical, instrumentation and scenario question guidance</span></div><em>Built in</em></div>
              {state.materials.map(material => (
                <button key={material.id} className={`material-row selectable ${selectedId === material.id ? 'selected' : ''}`} onClick={() => setSelectedId(material.id)}>
                  <span className={`file-type ${material.kind === 'image' ? 'gold' : ''}`}><FileIcon material={material} /></span>
                  <div><strong>{material.name}</strong><span>{formatBytes(material.size)} · {material.status === 'ready' ? `${material.extractedText.length.toLocaleString()} text characters` : 'Image reference · OCR not active'}</span></div>
                  <em>{selectedId === material.id ? <><Check size={14} /> Selected</> : material.kind}</em>
                  <span className="delete-material" role="button" tabIndex={0} aria-label={`Remove ${material.name}`} onClick={event => { event.stopPropagation(); removeMaterial(material.id); }}><Trash2 size={16} /></span>
                </button>
              ))}
              {!state.materials.length && <div className="empty-library"><ScanText size={24} /><p>Your private files will appear here.</p></div>}
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
              <button className="button primary full" onClick={aiGenerate} disabled={!selected || selected.status !== 'ready' || aiLoading}>{aiLoading ? <><Loader2 size={16} className="spin" /> Creating…</> : <><Cloud size={16} /> Create with AI</>}</button>
            </div>
            <div className="mini-warning"><AlertCircle size={15} /><span>AI content can be wrong. Verify laws, limits and role facts against official sources.</span></div>
          </article>

          <article className="panel profile-review">
            <div className="panel-heading"><div><span className="eyebrow">Candidate facts</span><h2>Ground answers in evidence</h2></div><Info size={18} /></div>
            {candidate.profileFacts.map(fact => <div className="fact-row" key={fact.label}><span><strong>{fact.label}</strong><small>{fact.detail}</small></span><em>{fact.status}</em></div>)}
            <p>These non-sensitive facts were extracted from the current uploaded application. Use them naturally; do not invent responsibilities or research results.</p>
          </article>
        </aside>
      </section>
    </div>
  );
}
