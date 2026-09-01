import {
  ArrowRight, Award, BookOpenCheck, CalendarDays, CheckCircle2, ChevronRight,
  Clock3, Flame, HelpCircle, LockKeyhole, Mic2, PenLine, Radio, ShieldCheck, Sparkles, Trophy,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { categoryLabels, encouragements } from '../data';
import { useApp } from '../context';
import { useGuide } from '../App';
import BackupCard from '../components/BackupCard';
import { oralBankFor } from '../lib/personalization';
import { calculateReadiness } from '../lib/scoring';
import type { QuestionCategory } from '../types';

function useCountdown(interviewDate: string) {
  const calculate = useCallback(
    () => interviewDate ? new Date(`${interviewDate}T08:00:00+03:00`).getTime() - Date.now() : null,
    [interviewDate],
  );
  const [distance, setDistance] = useState<number | null>(calculate);
  useEffect(() => {
    const timer = window.setInterval(() => setDistance(calculate()), 60_000);
    return () => window.clearInterval(timer);
  }, [calculate]);
  if (distance === null) return null;
  const positive = Math.max(0, distance);
  const hours = Math.floor(positive / 3_600_000);
  return { days: Math.floor(hours / 24), hours: hours % 24, passed: distance <= 0 };
}

export default function Dashboard() {
  const { state, profile, materials, customQuestions, attempts, startPractice, setView } = useApp();
  const guide = useGuide();
  const countdown = useCountdown(profile!.interviewDate);
  const readiness = calculateReadiness(attempts.map(item => item.score));
  const encouragement = encouragements[attempts.length % encouragements.length];
  const level = Math.floor(state.xp / 180) + 1;
  const questionBank = useMemo(() => oralBankFor(profile!, materials, customQuestions), [profile, materials, customQuestions]);
  const firstName = profile!.name.trim().split(/\s+/)[0];
  const todayLabel = new Intl.DateTimeFormat('en-TZ', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Africa/Dar_es_Salaam' }).format(new Date());
  const interviewLabel = profile!.interviewDate ? new Intl.DateTimeFormat('en-TZ', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${profile!.interviewDate}T12:00:00+03:00`)) : '';

  const categoryScores = useMemo(() => {
    const categories = Object.keys(categoryLabels) as QuestionCategory[];
    return categories.map(category => {
      const catAttempts = attempts.filter(item => item.category === category);
      const score = catAttempts.length ? Math.round(catAttempts.reduce((sum, item) => sum + item.score, 0) / catAttempts.length) : 0;
      return { category, score, attempts: catAttempts.length };
    });
  }, [attempts]);

  const focus = attempts.length
    ? [...categoryScores].sort((a, b) => (a.attempts ? a.score : -1) - (b.attempts ? b.score : -1))[0]
    : categoryScores.find(item => item.category === 'role')!;
  const completedQuestions = new Set(attempts.map(item => item.questionId)).size;
  const coverage = questionBank.length ? Math.min(100, Math.round((completedQuestions / questionBank.length) * 100)) : 0;

  return (
    <div className="page dashboard-page">
      <section className="welcome-row">
        <div>
          <span className="eyebrow"><span className="live-dot" /> {todayLabel} · private workspace</span>
          <h1>Habari, {firstName}.</h1>
          <p>{encouragement}</p>
        </div>
        {profile!.interviewDate
          ? <div className="interview-chip"><CalendarDays size={17} /><span><small>Interview date</small><strong>{interviewLabel}</strong></span></div>
          : <button className="interview-chip plain" onClick={() => setView('settings')}><CalendarDays size={17} /><span><small>Study plan</small><strong>Practise at your pace</strong></span></button>}
      </section>

      <BackupCard />

      <section className="hero-grid">
        <div className="countdown-card">
          <div className="countdown-copy">
            <span className="card-kicker"><Radio size={15} /> Your target</span>
            <h2>{profile!.jobPosition}</h2>
            <p>{profile!.organization || 'Organization not specified'} · Personalized from your private materials</p>
            <div className="venue"><LockKeyhole size={16} /> Local-only candidate workspace</div>
          </div>
          <div className="countdown-box" aria-label={countdown ? `${countdown.days} days and ${countdown.hours} hours to the interview date` : 'Practice at your own pace'}>
            {!countdown ? <><strong>Ready</strong><span>At your pace</span></> : countdown.passed ? <><strong>Today</strong><span>Stay calm</span></> : <><div><strong>{String(countdown.days).padStart(2, '0')}</strong><span>Days</span></div><i>:</i><div><strong>{String(countdown.hours).padStart(2, '0')}</strong><span>Hours</span></div></>}
          </div>
          <div className="target-footer">
            <span><ShieldCheck size={15} /> {materials.length} private source{materials.length === 1 ? '' : 's'} · {questionBank.length} oral questions</span>
            <span>Stored on this device <CheckCircle2 size={14} /></span>
          </div>
        </div>

        <div className="readiness-card">
          <div className="ring" style={{ '--progress': `${readiness * 3.6}deg` } as React.CSSProperties}>
            <div><strong>{readiness}</strong><span>%</span></div>
          </div>
          <div className="readiness-copy">
            <span className="card-kicker">Interview readiness</span>
            <h3>{readiness >= 75 ? 'Nearly panel-ready' : readiness >= 50 ? 'Momentum is building' : 'Your baseline is ready'}</h3>
            <p>{attempts.length ? 'Based on your recent answer coverage and practice consistency.' : 'Complete three answers to replace the starter estimate with your score.'}</p>
          </div>
          <button className="text-button" onClick={() => setView('progress')}>See breakdown <ArrowRight size={15} /></button>
        </div>
      </section>

      <section className="metric-grid">
        <article className="metric-card"><span className="metric-icon green"><BookOpenCheck size={19} /></span><div><strong>{completedQuestions}<small> / {questionBank.length}</small></strong><span>Questions covered</span></div><em>{coverage}%</em></article>
        <article className="metric-card"><span className="metric-icon gold"><Sparkles size={19} /></span><div><strong>{state.xp}</strong><span>Experience points</span></div><em>Level {level}</em></article>
        <article className="metric-card"><span className="metric-icon orange"><Flame size={19} /></span><div><strong>{state.streak}</strong><span>Day practice streak</span></div><em>{state.streak ? 'Keep it alive' : 'Start today'}</em></article>
        <article className="metric-card"><span className="metric-icon blue"><Award size={19} /></span><div><strong>{attempts.filter(item => item.score >= 80).length}</strong><span>Strong answers</span></div><em>80%+</em></article>
      </section>

      <section className="content-grid">
        <article className="mission-card panel">
          <div className="panel-heading">
            <div><span className="eyebrow">Recommended next</span><h2>Your 15-minute mission</h2></div>
            <span className="time-pill"><Clock3 size={14} /> 15 min</span>
          </div>
          <div className="mission-main">
            <span className="mission-number">01</span>
            <div className="mission-copy">
              <span className={`category-badge ${focus.category}`}>{categoryLabels[focus.category]}</span>
              <h3>{focus.attempts ? `Strengthen your ${categoryLabels[focus.category].toLowerCase()} answers` : `Master the advertised ${profile!.jobPosition} duties`}</h3>
              <p>Three panel questions · answer aloud · get concept-by-concept feedback.</p>
              <div className="mission-meta"><span><Mic2 size={14} /> Oral panel</span><span><Trophy size={14} /> Up to 90 XP</span></div>
            </div>
            <button className="button primary" onClick={() => startPractice('oral', focus.category)}>Start mission <ArrowRight size={17} /></button>
          </div>
          <div className="mission-steps">
            <span className="done"><CheckCircle2 size={15} /> Private profile ready</span><span><i>2</i> Role knowledge</span><span><i>3</i> Scenario response</span>
          </div>
        </article>

        <article className="panel focus-card">
          <div className="panel-heading"><div><span className="eyebrow">Coverage map</span><h2>Focus areas</h2></div><button className="icon-button subtle" onClick={() => setView('progress')} aria-label="View detailed progress"><ChevronRight size={18} /></button></div>
          <div className="focus-list">
            {categoryScores.slice(0, 5).map(item => (
              <div className="focus-item" key={item.category}>
                <div><span>{categoryLabels[item.category]}</span><small>{item.attempts ? `${item.attempts} attempt${item.attempts === 1 ? '' : 's'}` : 'Not started'}</small></div>
                <div className="focus-bar"><i style={{ width: `${item.score || 6}%` }} className={item.score >= 75 ? 'good' : item.attempts ? 'mid' : ''} /></div>
                <strong>{item.attempts ? `${item.score}%` : '—'}</strong>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="quick-row">
        <button className="quick-card" onClick={() => startPractice('oral')}><span className="quick-icon"><Mic2 /></span><div><small>90-second drill</small><strong>Answer one panel question</strong></div><ArrowRight size={18} /></button>
        <button className="quick-card" onClick={() => startPractice('written')}><span className="quick-icon blue"><PenLine /></span><div><small>Knowledge drill</small><strong>Take a written quick test</strong></div><ArrowRight size={18} /></button>
        <button className="quick-card" onClick={() => setView('materials')}><span className="quick-icon gold"><BookOpenCheck /></span><div><small>Private by default</small><strong>Add preparation materials</strong></div><ArrowRight size={18} /></button>
        <button className="quick-card" onClick={guide?.openGuide}><span className="quick-icon"><HelpCircle /></span><div><small>New here?</small><strong>How to use this app</strong></div><ArrowRight size={18} /></button>
      </section>
    </div>
  );
}
