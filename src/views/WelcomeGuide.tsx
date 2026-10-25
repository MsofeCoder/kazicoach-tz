import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Compass, Lightbulb, X } from 'lucide-react';
import { guideSteps, spotlightBounds } from '../lib/onboarding';
import type { View } from '../types';

export default function WelcomeGuide({ close, navigate, explore, activeView }: {
  close: () => void;
  navigate: (view: View) => void;
  explore: (view: View) => void;
  activeView: View;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const card = useRef<HTMLElement>(null);
  const title = useRef<HTMLHeadingElement>(null);
  const [step, setStep] = useState(0);
  const [spotlight, setSpotlight] = useState<ReturnType<typeof spotlightBounds>>(null);
  const current = guideSteps[step];

  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    element?.showModal();
    return () => {
      element?.close();
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    setSpotlight(null);
    navigate(current.view);
    title.current?.focus({ preventScroll: true });
  }, [current, navigate]);

  useEffect(() => {
    if (activeView !== current.view) return;
    let observer: ResizeObserver | undefined;
    let target: HTMLElement | null = null;
    let frame = 0;
    const measure = () => {
      if (!target || !card.current) return;
      setSpotlight(spotlightBounds(target.getBoundingClientRect(), card.current.getBoundingClientRect(), window.innerWidth, window.innerHeight));
    };
    frame = requestAnimationFrame(() => {
      target = document.querySelector<HTMLElement>(`[data-tour-page]:not([hidden]) [data-tour="${current.target}"]`)
        ?? document.querySelector<HTMLElement>('[data-tour-page]:not([hidden]) .page-title-row');
      // Native modal makes the page inert; scrollIntoView can then be ignored.
      // Scroll the window explicitly without making background controls interactive.
      if (target) window.scrollTo({ top: window.scrollY + target.getBoundingClientRect().top - 100,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      measure();
      observer = new ResizeObserver(measure);
      if (target) observer.observe(target);
      if (card.current) observer.observe(card.current);
    });
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    window.visualViewport?.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
      window.visualViewport?.removeEventListener('resize', measure);
    };
  }, [current, activeView]);

  return <dialog ref={dialog} className="feature-tour" aria-labelledby="guide-title" aria-describedby="guide-description" onCancel={event => { event.preventDefault(); close(); }}>
    <div className={`tour-shade ${spotlight ? 'has-spotlight' : ''}`} aria-hidden="true" />
    {spotlight && <div className="tour-spotlight" style={spotlight} aria-hidden="true"><span>You are here · {current.feature}</span></div>}
    <section ref={card} className={`tour-card tour-card-${current.target}`}>
      <header className="tour-header"><span><Compass size={18} aria-hidden="true" /> YOUR WORKSPACE TOUR</span><button className="icon-button" onClick={close} aria-label="Close guide"><X size={20} /></button></header>
      <nav className="tour-dots" aria-label="Guide steps">{guideSteps.map((item, index) => <button key={item.target} aria-label={`Step ${index + 1}: ${item.feature}`} aria-current={index === step ? 'step' : undefined} onClick={() => setStep(index)}><span /></button>)}</nav>
      <div className="tour-copy" key={step}>
        <span className="eyebrow">{current.label} · {current.feature}</span>
        <h2 id="guide-title" ref={title} tabIndex={-1}>{current.title}</h2>
        <p id="guide-description">{current.body}</p>
        <div className="tour-tip"><Lightbulb size={17} aria-hidden="true" /><p>{current.tip}</p></div>
      </div>
      <button className="tour-explore" onClick={() => explore(current.view)}>Explore {current.feature}<ArrowRight size={15} /></button>
      <footer className="tour-footer">
        <button className="button secondary" onClick={() => step === 0 ? close() : setStep(step - 1)}>{step === 0 ? 'Skip tour' : <><ArrowLeft size={16} /> Back</>}</button>
        <span className="tour-count" role="status" aria-live="polite">{step + 1} / {guideSteps.length}</span>
        <button className="button primary" onClick={() => step === guideSteps.length - 1 ? explore(current.view) : setStep(step + 1)}>{step === guideSteps.length - 1 ? 'Finish tour' : 'Next'}<ArrowRight size={16} /></button>
      </footer>
    </section>
  </dialog>;
}
