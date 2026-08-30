import {
  ArrowRight, BriefcaseBusiness, CalendarDays, Check, FileCheck2, FileText,
  FlaskConical, FolderUp, Image, Loader2, LockKeyhole, NotebookPen, ShieldCheck,
  Sparkles, UserRound,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useApp } from '../context';
import { createLocalQuestions, extractMaterial } from '../lib/materials';
import { sampleToMaterials, testSamples, type TestSample } from '../samples';
import type { Material } from '../types';

interface LocalForm {
  name: string;
  jobPosition: string;
  organization: string;
  interviewDate: string;
  jobDescription: string;
  sampleId?: string;
}

const emptyForm: LocalForm = { name: '', jobPosition: '', organization: '', interviewDate: '', jobDescription: '' };
const accepted = '.txt,.md,.pdf,.docx,image/jpeg,image/png,image/webp';

export default function Onboarding() {
  const { setState, notify } = useApp();
  const [form, setForm] = useState<LocalForm>(emptyForm);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cvRef = useRef<HTMLInputElement>(null);
  const letterRef = useRef<HTMLInputElement>(null);
  const jobRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLInputElement>(null);

  const materialByKind = useMemo(() => ({
    cv: materials.find(item => item.kind === 'cv'),
    letter: materials.find(item => item.kind === 'letter'),
    job: materials.find(item => item.kind === 'job'),
    notes: materials.filter(item => item.kind === 'notes' || item.kind === 'image'),
  }), [materials]);

  const update = (key: keyof LocalForm, value: string) => setForm(current => ({ ...current, [key]: value, ...(key === 'sampleId' ? {} : { sampleId: undefined }) }));

  const readFiles = async (files: FileList | File[], forcedKind: Material['kind']) => {
    setProcessing(forcedKind);
    setError(null);
    const added: Material[] = [];
    for (const file of Array.from(files)) {
      try {
        const extracted = await extractMaterial(file);
        added.push({ ...extracted, kind: file.type.startsWith('image/') ? 'image' : forcedKind });
      } catch (reason) {
        setError(`${file.name}: ${reason instanceof Error ? reason.message : 'Could not read this file.'}`);
      }
    }
    if (added.length) {
      setMaterials(current => forcedKind === 'notes'
        ? [...current, ...added]
        : [...current.filter(item => item.kind !== forcedKind), ...added]);
      if (forcedKind === 'job' && added[0].extractedText) update('jobDescription', added[0].extractedText);
    }
    setProcessing(null);
  };

  const loadSample = (sample: TestSample) => {
    setForm({ ...sample.profile, jobDescription: sample.jobDescription });
    setMaterials(sampleToMaterials(sample));
    setError(null);
    notify(`${sample.label} fictional test data loaded locally.`);
  };

  const submit = () => {
    if (form.name.trim().length < 2) { setError('Enter the candidate name or preferred name.'); return; }
    if (form.jobPosition.trim().length < 3) { setError('Enter the job position being prepared for.'); return; }
    if (form.jobDescription.trim().length < 40) { setError('Add at least a short job description so the practice can be customized.'); return; }

    const now = new Date().toISOString();
    const jobMaterial: Material = {
      id: materialByKind.job?.id || crypto.randomUUID(),
      name: materialByKind.job?.name || `${form.jobPosition.trim()} — Job Description.txt`,
      kind: 'job', mime: materialByKind.job?.mime || 'text/plain',
      size: new Blob([form.jobDescription]).size,
      extractedText: form.jobDescription.trim().slice(0, 100_000), status: 'ready',
      addedAt: materialByKind.job?.addedAt || now,
    };
    const allMaterials = [jobMaterial, ...materials.filter(item => item.kind !== 'job')];
    const sourceText = allMaterials.filter(item => item.extractedText).map(item => `${item.name}. ${item.extractedText}`).join(' ');
    const generated = createLocalQuestions(sourceText, 'private onboarding materials').slice(0, 6);

    setState(current => ({
      ...current,
      version: 2,
      profile: {
        id: crypto.randomUUID(), name: form.name.trim(), jobPosition: form.jobPosition.trim(),
        organization: form.organization.trim(), interviewDate: form.interviewDate,
        createdAt: now, sampleId: form.sampleId,
      },
      attempts: [], xp: 0, streak: 0, lastActiveDate: null,
      materials: allMaterials,
      customQuestions: generated,
    }));
    notify('Private practice workspace created on this device.');
  };

  const uploadCard = (kind: 'cv' | 'letter' | 'notes', title: string, note: string, ref: React.RefObject<HTMLInputElement>, Icon: typeof FileText) => {
    const value = kind === 'notes' ? materialByKind.notes : materialByKind[kind];
    const hasValue = Array.isArray(value) ? value.length > 0 : Boolean(value);
    const label = Array.isArray(value) ? `${value.length} file${value.length === 1 ? '' : 's'} added` : value?.name;
    return (
      <button type="button" className={`onboarding-upload ${hasValue ? 'added' : ''}`} onClick={() => ref.current?.click()}>
        <input ref={ref} hidden type="file" multiple={kind === 'notes'} accept={accepted} onChange={event => event.target.files && readFiles(event.target.files, kind)} />
        <span>{processing === kind ? <Loader2 className="spin" /> : hasValue ? <Check /> : <Icon />}</span>
        <div><strong>{title}</strong><small>{label || note}</small></div>
        <FolderUp size={17} />
      </button>
    );
  };

  return (
    <main className="onboarding-page">
      <header className="onboarding-header">
        <div className="brand onboarding-brand"><span className="brand-mark"><ShieldCheck size={23} /></span><span className="brand-copy"><strong>KaziCoach <i>TZ</i></strong><small>Private interview practice</small></span></div>
        <span className="onboarding-step">Setup · about 3 minutes</span>
      </header>

      <section className="privacy-hero" aria-label="Local privacy notice">
        <span><LockKeyhole size={26} /></span>
        <div><strong>YOUR DETAILS STAY ON THIS DEVICE</strong><h1>We are not collecting or uploading the information you enter here.</h1><p>Your name, CV, application letter, job description and notes are used inside this browser only to customize your practice. There is no account, analytics database or hidden upload in private mode. If you later choose the optional cloud AI feature, KaziCoach asks for separate confirmation before sending selected text.</p></div>
      </section>

      <div className="onboarding-layout">
        <section className="onboarding-form panel">
          <div className="onboarding-form-head"><span className="eyebrow">Create your private workspace</span><h2>Who and what are we preparing for?</h2><p>Use accurate details. Better context produces more useful questions and answer guidance.</p></div>

          <div className="onboarding-fields">
            <label><span><UserRound size={16} /> Candidate name or preferred name <b>Required</b></span><input value={form.name} onChange={event => update('name', event.target.value)} placeholder="Example: Asha Mrema" autoComplete="off" /></label>
            <label><span><BriefcaseBusiness size={16} /> Job position <b>Required</b></span><input value={form.jobPosition} onChange={event => update('jobPosition', event.target.value)} placeholder="Example: Human Resource Officer II" autoComplete="off" /></label>
            <label><span><ShieldCheck size={16} /> Organization or employer <em>Optional</em></span><input value={form.organization} onChange={event => update('organization', event.target.value)} placeholder="Example: A Tanzanian public institution" autoComplete="off" /></label>
            <label><span><CalendarDays size={16} /> Interview date <em>Optional</em></span><input type="date" value={form.interviewDate} onChange={event => update('interviewDate', event.target.value)} /></label>
          </div>

          <label className="job-description-field"><span><FileText size={16} /> Job description <b>Required</b></span><textarea rows={8} value={form.jobDescription} onChange={event => update('jobDescription', event.target.value)} placeholder="Paste the advertised duties, qualifications and responsibilities here…" /><div><small>{form.jobDescription.length.toLocaleString()} characters · processed locally</small><button type="button" className="text-button" onClick={() => jobRef.current?.click()}><FolderUp size={15} /> Upload job description</button><input ref={jobRef} hidden type="file" accept=".txt,.md,.pdf,.docx" onChange={event => event.target.files && readFiles(event.target.files, 'job')} /></div></label>

          <div className="onboarding-upload-grid">
            {uploadCard('cv', 'CV / résumé', 'PDF, DOCX, TXT or MD', cvRef, FileText)}
            {uploadCard('letter', 'Application letter', 'PDF, DOCX, TXT or MD', letterRef, FileCheck2)}
            {uploadCard('notes', 'Study notes & images', 'Text is read; images stay as references', notesRef, Image)}
          </div>

          <div className="onboarding-local-note"><ShieldCheck size={18} /><span><strong>No document leaves this browser during setup.</strong><small>You can delete everything at any time from Settings. Clearing browser storage also removes this workspace.</small></span></div>
          {error && <div className="onboarding-error" role="alert">{error}</div>}
          <button className="button primary onboarding-submit" onClick={submit} disabled={Boolean(processing)}><Sparkles size={18} /> Create my private practice <ArrowRight size={18} /></button>
        </section>

        <aside className="sample-panel panel">
          <span className="sample-icon"><FlaskConical size={22} /></span>
          <span className="eyebrow">Testing without personal files</span>
          <h2>Load fictional sample data</h2>
          <p>These three profiles are entirely fictional and are included only for testing the customization flow.</p>
          <div className="sample-list">{testSamples.map((sample, index) => <button type="button" key={sample.id} className={form.sampleId === sample.id ? 'active' : ''} onClick={() => loadSample(sample)}><span>{index + 1}</span><div><strong>{sample.label}</strong><small>{sample.sector} · {sample.description}</small></div>{form.sampleId === sample.id && <Check size={16} />}</button>)}</div>
          <div className="sample-tip"><NotebookPen size={18} /><span><strong>Recommended test</strong><small>Load each sample, enter the app and compare the dashboard, panel questions and materials. Reset from Settings between samples.</small></span></div>
        </aside>
      </div>

      <footer className="onboarding-footer"><LockKeyhole size={14} /> Local private mode · no account · no tracking · no sale of personal data</footer>
    </main>
  );
}
