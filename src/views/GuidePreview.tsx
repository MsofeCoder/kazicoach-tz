import { useState } from 'react';
import { ArrowRight, BookOpenText, Check, CheckCircle2, Cloud, FileText, FolderOpen, Laptop, LockKeyhole, Mic2, PenLine, Sparkles, Target, TrendingUp } from 'lucide-react';

// Tutorial state only: no uploads, microphone, account calls, XP or scored attempts.
export default function GuidePreview({ step }: { step: number }) {
  const [choice, setChoice] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const labels = step === 0 ? ['Prepare', 'Practise', 'Grow'] : step === 1 ? ['CV', 'Job brief', 'Notes'] : step === 2 ? ['Oral', 'Written'] : step === 3 ? ['Clarity', 'Evidence', 'Consistency'] : ['Private', 'Optional account'];
  const hints = step === 0
    ? ['Bring your own experience and preparation materials.', 'Build a clear answer with focused questions.', 'Review feedback, then try again with confidence.']
    : step === 1 ? ['Example CV · your experience', 'Example job brief · role requirements', 'Example notes · topics to revise']
    : step === 2 ? ['Read aloud or type instead. You choose when to enable your microphone.', 'Organise your points before submitting a written answer.']
    : step === 3 ? ['Lead with a direct answer, then explain your points.', 'Connect each point to a truthful example from your experience.', 'Small, regular sessions help you build a preparation habit.']
    : ['Prepare on this device without registering. Keep a private export as a backup.', 'Choose which progress summaries to sync. Documents and answer text stay out of sync.'];
  return <section className="guide-preview" aria-label="Interactive feature preview">
    <div className="guide-preview-caption"><span className="guide-preview-dot" /> TRY IT HERE <span>Example only</span></div>
    <div className="guide-demo-art" aria-hidden="true">
      {step === 0 && <div className="guide-roadmap-art"><div className="guide-orbit"><Sparkles size={38} /></div><span className="guide-float guide-float-a"><FolderOpen size={23} /></span><span className="guide-float guide-float-b"><Mic2 size={23} /></span><span className="guide-float guide-float-c"><TrendingUp size={23} /></span></div>}
      {step === 1 && <div className="guide-document-art"><div className="guide-paper-back" /><div className="guide-paper"><FileText size={30} /><strong>{labels[choice]}</strong><i /><i /><i /><span><LockKeyhole size={13} /> On your device</span></div><span className="guide-art-seal"><Check size={21} /></span></div>}
      {step === 2 && <div className="guide-practice-art"><span className="guide-demo-symbol">{choice === 0 ? <Mic2 size={34} /> : <PenLine size={34} />}</span><div className="guide-sound-bars">{[16,30,46,24,38,52,32,18,36].map((height,i) => <i key={i} style={{height: choice === 0 ? height : 7, width: choice === 0 ? 7 : 16}} />)}</div><span>{choice === 0 ? 'Your voice. Your pace.' : 'One clear point at a time.'}</span></div>}
      {step === 3 && <div className="guide-growth-art"><span className="guide-growth-line" /><span><BookOpenText size={22} /><small>Practise</small></span><span><Target size={22} /><small>Review</small></span><span><TrendingUp size={22} /><small>Improve</small></span></div>}
      {step === 4 && <div className="guide-privacy-art"><span><Laptop size={35} /><small>Your workspace</small></span>{choice === 0 ? <LockKeyhole size={25} /> : <ArrowRight size={25} />}<span>{choice === 0 ? <LockKeyhole size={35} /> : <Cloud size={35} />}<small>{choice === 0 ? 'Private by default' : 'Selected summaries'}</small></span></div>}
    </div>
    <div className="guide-demo-options" role="group" aria-label="Try a preview option">{labels.map((label,index) => <button key={label} aria-pressed={choice === index} onClick={() => { setChoice(index); setRevealed(false); }}>{label}</button>)}</div>
    <div className="guide-demo-detail" role="status"><p>{hints[choice]}</p></div>
    {(step === 1 || step === 2) && <><button className="guide-demo-action" aria-expanded={revealed} onClick={() => setRevealed(!revealed)}>{revealed ? 'Hide example' : step === 1 ? 'See the preparation flow' : 'Reveal an answer structure'} <ArrowRight size={15} /></button>{revealed && <div className="guide-demo-reveal"><CheckCircle2 size={17} /><span>{step === 1 ? 'Add a source → read locally → create practice cards.' : 'Make your point → give a real example → connect it to the role.'}</span></div>}</>}
    <p className="guide-demo-footnote">Explore safely. Nothing here uploads, records or changes your progress.</p>
  </section>;
}
