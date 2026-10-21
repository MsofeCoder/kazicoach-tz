import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Compass, LockKeyhole, X } from 'lucide-react';
import { guideSteps } from '../lib/onboarding';
import type { View } from '../types';

export default function WelcomeGuide({ close, navigate }: { close: () => void; navigate: (view: View) => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(0);
  const current = guideSteps[step];

  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, []);
  useEffect(() => { title.current?.focus(); }, [step]);

  return <dialog ref={dialog} className="welcome-guide" aria-labelledby="guide-title" aria-describedby="guide-description" onCancel={event => { event.preventDefault(); close(); }}>
    <div className="guide-top"><span><Compass size={18} aria-hidden="true" /> KaziCoach guide</span><button className="icon-button" onClick={close} aria-label="Close guide"><X size={20} /></button></div>
    <div className="guide-content">
      <span className="eyebrow">{current.label}</span>
      <h2 id="guide-title" ref={title} tabIndex={-1}>{current.title}</h2>
      <p id="guide-description">{current.body}</p>
      <div className="guide-tip"><LockKeyhole size={19} aria-hidden="true" /><p>{current.tip}</p></div>
      <nav className="guide-steps" aria-label="Guide steps">{guideSteps.map((item, index) => <button key={item.title} aria-label={`Step ${index + 1}: ${item.title}`} aria-current={index === step ? 'step' : undefined} onClick={() => setStep(index)}><span>{index + 1}</span></button>)}</nav>
      <p className="guide-count" role="status">Step {step + 1} of {guideSteps.length}</p>
    </div>
    <footer className="guide-footer"><button className="button secondary" onClick={() => step === 0 ? close() : setStep(step - 1)}>{step === 0 ? 'Not now' : <><ArrowLeft size={16} /> Back</>}</button><button className="button primary" onClick={() => step === guideSteps.length - 1 ? navigate('practice') : setStep(step + 1)}>{step === guideSteps.length - 1 ? 'Start exploring' : 'Next'}<ArrowRight size={16} /></button></footer>
    {step > 0 && <button className="guide-page-link" onClick={() => navigate(current.view)}>Open {current.view === 'materials' ? 'Materials' : current.view === 'practice' ? 'Practice' : current.view === 'progress' ? 'Progress' : 'Settings'} now</button>}
  </dialog>;
}
