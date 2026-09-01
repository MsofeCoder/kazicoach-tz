import {
  ArrowRight, BookOpen, CheckCircle2, ChevronRight, FolderUp,
  Lightbulb, LockKeyhole, Mic2, BarChart3, Settings,
  ShieldCheck, Sparkles, Target, X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface GuideStep {
  id: string;
  icon: typeof ShieldCheck;
  iconColor: string;
  title: string;
  subtitle: string;
  body: string;
  bullets?: string[];
  tip?: string;
  highlight?: 'sidebar' | 'practice' | 'materials' | 'progress' | 'settings' | 'none';
}

const steps: GuideStep[] = [
  {
    id: 'welcome',
    icon: ShieldCheck,
    iconColor: '#0f7b68',
    title: 'Karibu KaziCoach TZ',
    subtitle: 'Welcome to KaziCoach TZ',
    body: 'Your private, offline-first interview preparation tool. Everything stays on this device — there is no account, no cloud database, and no personal content ever leaves your browser.',
    bullets: [
      'Built for Tanzanian public-service interview candidates',
      'Works offline after first load — no internet needed',
      'Your data is stored only in this browser',
    ],
    tip: 'You can export a JSON backup at any time from Settings.',
  },
  {
    id: 'privacy',
    icon: LockKeyhole,
    iconColor: '#073c35',
    title: 'Your Data Stays Private',
    subtitle: 'Privacy-first by design',
    body: 'KaziCoach is designed so that no personal information — your name, CV, job description, notes, or practice answers — is ever sent to any server or third party.',
    bullets: [
      'All documents are extracted and stored locally in your browser',
      'Practice answers are scored on-device using concept matching',
      'Optional AI generation sends only the text you confirm, after explicit consent',
      'Anonymous usage stats (if enabled) contain zero personal content',
    ],
    tip: 'If you clear browser data, your workspace is lost. Export a JSON backup regularly.',
  },
  {
    id: 'profile',
    icon: Target,
    iconColor: '#187aa8',
    title: 'Set Up Your Profile',
    subtitle: 'Step 1 — Create your workspace',
    body: 'Enter your name, the job position you are preparing for, and the organisation. The more accurate your details, the better the practice questions will be tailored to your role.',
    bullets: [
      'Candidate name — your preferred or official name',
      'Job position — the exact title from the advert (e.g. "Human Resource Officer II")',
      'Organisation — the employer or institution (optional but recommended)',
      'Interview date — set a countdown on your dashboard',
    ],
    tip: 'You can create multiple workspaces for different job applications from Settings.',
    highlight: 'sidebar',
  },
  {
    id: 'materials',
    icon: FolderUp,
    iconColor: '#d7a82e',
    title: 'Add Your Documents',
    subtitle: 'Step 2 — Upload materials',
    body: 'Upload your CV, application letter, job description, or study notes. KaziCoach extracts text from PDF, DOCX, TXT, and MD files directly in your browser.',
    bullets: [
      'Drag and drop files or click to browse',
      'Supported: PDF, DOCX, TXT, MD, JPG, PNG, WEBP (up to 8 MB each)',
      'Images are stored as references — no OCR is performed',
      'You can also paste text directly into the app',
    ],
    tip: 'The job description is the most important document — it drives personalised questions.',
    highlight: 'materials',
  },
  {
    id: 'questions',
    icon: Sparkles,
    iconColor: '#d96d2d',
    title: 'Generate Practice Questions',
    subtitle: 'Step 3 — Build your question bank',
    body: 'Once you have uploaded materials, KaziCoach can create custom practice questions from your documents — entirely on your device.',
    bullets: [
      'Local generation: sentence-based, instant, fully private',
      'AI generation (optional): richer questions via Gemini, requires server confirmation',
      'Questions are tailored to your role, organisation, and uploaded content',
      'You can create up to 60 custom questions per workspace',
    ],
    tip: 'Review AI-generated questions against official sources — they can contain errors.',
    highlight: 'materials',
  },
  {
    id: 'oral-practice',
    icon: Mic2,
    iconColor: '#0f7b68',
    title: 'Oral Mock Panel',
    subtitle: 'Step 4 — Practise speaking',
    body: 'The oral practice simulates a 5-member interview panel. Each member has a unique voice and speciality. Answer aloud or type your response.',
    bullets: [
      'Click "Start speaking" to use your device microphone',
      'Or type your answer in the text area — coaching is identical',
      'A countdown timer tracks your response duration',
      'The "Hear the panel ask" button reads the question aloud',
    ],
    tip: 'Use the voice selector to switch between mixed, male, female, soft, or deep panel voices.',
    highlight: 'practice',
  },
  {
    id: 'scoring',
    icon: BarChart3,
    iconColor: '#187aa8',
    title: 'Scoring & Coach Feedback',
    subtitle: 'Step 5 — Understand your results',
    body: 'After each answer, you receive a score out of 100 based on three dimensions: concept coverage, depth of response, and structural clarity.',
    bullets: [
      'Concepts (0–65): how many key points from the model answer you included',
      'Depth (0–20): word count and detail level of your response',
      'Structure (0–15): use of signposting, examples, and logical flow',
      'Coach feedback highlights what to improve and shows a model answer',
    ],
    tip: 'Reveal the model answer only after your own attempt — compare, don\'t memorise.',
    highlight: 'practice',
  },
  {
    id: 'progress',
    icon: BarChart3,
    iconColor: '#d7a82e',
    title: 'Track Your Progress',
    subtitle: 'Step 6 — Review and improve',
    body: 'The Progress view shows your XP, daily streak, category breakdown, score trend, and full attempt history.',
    bullets: [
      'XP is earned for every scored answer — bonus for high scores',
      'Daily streaks encourage consistent practice',
      'Category breakdown shows your strongest and weakest areas',
      'Score trend chart tracks improvement over time',
    ],
    tip: 'Aim for consistent daily practice — even 15 minutes builds momentum.',
    highlight: 'progress',
  },
  {
    id: 'written-practice',
    icon: BookOpen,
    iconColor: '#187aa8',
    title: 'Written Test Mode',
    subtitle: 'Alternative practice format',
    body: 'In addition to oral panel simulation, KaziCoach offers written multiple-choice questions to test your knowledge of role-specific concepts.',
    bullets: [
      'Multiple-choice format with immediate feedback',
      'Explanations provided for every answer choice',
      'Questions drawn from your profile context and uploaded materials',
      'Score tracked alongside oral attempts',
    ],
    tip: 'Use written drills to reinforce concepts before an oral session.',
    highlight: 'practice',
  },
  {
    id: 'settings',
    icon: Settings,
    iconColor: '#66736f',
    title: 'Settings & Data Export',
    subtitle: 'Step 7 — Customise and back up',
    body: 'Settings lets you control coaching preferences, manage workspaces, export your progress as JSON, or reset everything.',
    bullets: [
      'Toggle Swahili coach hints on or off',
      'Adjust read-aloud speed and voice style',
      'Export a JSON backup of all your data',
      'Delete a workspace or clear all data permanently',
    ],
    tip: 'Export your progress weekly — browser data can be cleared unexpectedly.',
    highlight: 'settings',
  },
  {
    id: 'ready',
    icon: Lightbulb,
    iconColor: '#d7a82e',
    title: 'You Are Ready',
    subtitle: 'Start your preparation journey',
    body: 'You now know everything you need to begin. Start with the dashboard, add your materials, and begin your first mock panel session. Jiamini. Jitayarishe.',
    bullets: [
      'Begin with "Start mock panel" from the dashboard',
      'Upload your job description first for the best results',
      'Practice a little every day — consistency beats cramming',
      'Export your progress regularly as a backup',
    ],
  },
];

interface InteractiveGuideProps {
  onClose: () => void;
}

export default function InteractiveGuide({ onClose }: InteractiveGuideProps) {
  const [step, setStep] = useState(0);
  const [exiting, setExiting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const current = steps[step];
  const Icon = current.icon;
  const isFirst = step === 0;
  const isLast = step === steps.length - 1;
  const progress = ((step + 1) / steps.length) * 100;

  // Focus trap: focus the card on mount and trap tab inside
  useEffect(() => {
    const card = cardRef.current;
    if (!card) return;
    const focusable = card.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length) focusable[0].focus();

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !card.contains(document.activeElement)) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleTab);
    return () => document.removeEventListener('keydown', handleTab);
  }, [step]);

  const close = useCallback(() => {
    setExiting(true);
    setTimeout(onClose, 280);
  }, [onClose]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight' && !isLast) setStep(s => s + 1);
      if (e.key === 'ArrowLeft' && !isFirst) setStep(s => s - 1);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [close, isFirst, isLast]);

  const next = () => {
    if (isLast) { close(); return; }
    setStep(s => s + 1);
  };

  const prev = () => {
    if (!isFirst) setStep(s => s - 1);
  };

  return (
    <div className={`ig-backdrop ${exiting ? 'ig-exiting' : ''}`} role="dialog" aria-label="Interactive guide" aria-modal="true">
      <div className="ig-overlay" onClick={close} onKeyDown={e => { if (e.key === 'Escape') close(); }} role="presentation" />
      <div className="ig-card" role="document" ref={cardRef}>
        <button className="ig-close" onClick={close} aria-label="Close guide"><X size={20} /></button>

        <div className="ig-progress-bar">
          <div className="ig-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="ig-step-label">Step {step + 1} of {steps.length}</div>

        <div className="ig-body">
          <div className="ig-icon-wrap" style={{ background: `${current.iconColor}14`, color: current.iconColor }}>
            <Icon size={30} />
          </div>
          <h2 className="ig-title">{current.title}</h2>
          <p className="ig-subtitle">{current.subtitle}</p>
          <p className="ig-text">{current.body}</p>

          {current.bullets && (
            <ul className="ig-bullets">
              {current.bullets.map((bullet, i) => (
                <li key={i}><CheckCircle2 size={15} className="ig-bullet-icon" />{bullet}</li>
              ))}
            </ul>
          )}

          {current.tip && (
            <div className="ig-tip">
              <Lightbulb size={15} />
              <span>{current.tip}</span>
            </div>
          )}
        </div>

        <div className="ig-nav">
          <div className="ig-nav-left">
            {!isFirst && (
              <button className="button ghost" onClick={prev}>
                <ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} /> Back
              </button>
            )}
          </div>
          <div className="ig-nav-dots">
            {steps.map((_, i) => (
              <button
                key={i}
                className={`ig-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}
                onClick={() => setStep(i)}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>
          <div className="ig-nav-right">
            <button className="button primary" onClick={next}>
              {isLast ? (
                <><Sparkles size={16} /> Start Preparing</>
              ) : (
                <>{step === 0 ? 'Get Started' : 'Next'} <ArrowRight size={16} /></>
              )}
            </button>
          </div>
        </div>

        {isFirst && (
          <div className="ig-skip">
            <button className="text-button" onClick={close}>Skip introduction</button>
          </div>
        )}
      </div>
    </div>
  );
}
