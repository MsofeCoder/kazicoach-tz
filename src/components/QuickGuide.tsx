import { BookOpen, CheckCircle2, ChevronRight, Lightbulb, Mic2, X } from 'lucide-react';
import { useState } from 'react';

const steps = [
  {
    icon: BookOpen,
    title: '1. Ongeza Nyaraka Zako',
    subtitle: 'Add Your Documents',
    body: 'Weka CV, barua ya maombi, maelezo ya kazi, au noti za masomo. Zote husindika ndani ya kifaa chako — hazitumwi mtandaoni.',
    bodyEn: 'Upload your CV, application letter, job description, or study notes. Everything stays on your device — nothing is uploaded.',
  },
  {
    icon: Mic2,
    title: '2. Jibu Maswali kwa Sauti',
    subtitle: 'Answer Questions Aloud',
    body: 'Bofya "Start mock panel" na ujibu maswali kama uko kwenye usaili halisi. Unaweza pia kuandika jibu lako.',
    bodyEn: 'Click "Start mock panel" and answer questions like a real interview. You can also type your answer.',
  },
  {
    icon: Lightbulb,
    title: '3. Pata Maoni ya Mkufunzi',
    subtitle: 'Get Coach Feedback',
    body: 'Baada ya kila jibu, utapata alama, pointi ulizofanya vizuri, na nini unaweza kuboresha. Pia kuna jibu la mfano la kujifunza.',
    bodyEn: 'After each answer you get a score, what you did well, and what to improve. There is also a model answer to learn from.',
  },
  {
    icon: CheckCircle2,
    title: '4. Fuatilia Maendeleo Yako',
    subtitle: 'Track Your Progress',
    body: 'Angalia alama zako, eneo bora na dhaifu, na hatua ya usaili. Endelea kujaribu kila siku.',
    bodyEn: 'Check your scores, strong and weak areas, and interview readiness. Keep practising every day.',
  },
];

export default function QuickGuide({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const Icon = current.icon;
  const isLast = step === steps.length - 1;

  return (
    <div className="guide-backdrop" role="dialog" aria-label="Quick guide">
      <div className="guide-card panel">
        <button className="guide-close icon-button" onClick={onClose} aria-label="Close guide"><X size={20} /></button>

        <div className="guide-progress">
          {steps.map((_, i) => <span key={i} className={i === step ? 'active' : i < step ? 'done' : ''} />)}
        </div>

        <div className="guide-body">
          <span className="guide-icon"><Icon size={32} /></span>
          <h2>{current.title}</h2>
          <p className="guide-subtitle">{current.subtitle}</p>
          <p className="guide-text">{current.body}</p>
          <p className="guide-text-en">{current.bodyEn}</p>
        </div>

        <div className="guide-actions">
          {step > 0 && <button className="button ghost" onClick={() => setStep(s => s - 1)}><ChevronRight size={16} style={{ transform: 'rotate(180deg)' }} /> Back</button>}
          <button className="button primary" onClick={() => isLast ? onClose() : setStep(s => s + 1)}>
            {isLast ? 'Anza Sasa — Start Now' : 'Next'} {!isLast && <ChevronRight size={16} />}
          </button>
        </div>
      </div>
    </div>
  );
}
