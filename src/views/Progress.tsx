import {
  ArrowRight, Award, BarChart3, BookOpenCheck, CheckCircle2, Flame, Medal,
  Mic2, Sparkles, Target, TrendingUp, Trophy, Zap,
} from 'lucide-react';
import { useMemo } from 'react';
import { categoryLabels } from '../data';
import { useApp } from '../context';
import { oralBankFor, writtenBankFor } from '../lib/personalization';
import { calculateReadiness } from '../lib/scoring';
import type { QuestionCategory } from '../types';

export default function Progress() {
  const { state, startPractice } = useApp();
  const attempts = state.attempts;
  const oralQuestions = useMemo(() => oralBankFor(state.profile!, state.materials, state.customQuestions), [state.profile, state.materials, state.customQuestions]);
  const writtenQuestions = useMemo(() => writtenBankFor(state.profile!), [state.profile]);
  const readiness = calculateReadiness(attempts.map(item => item.score));
  const level = Math.floor(state.xp / 180) + 1;
  const average = attempts.length ? Math.round(attempts.reduce((sum, item) => sum + item.score, 0) / attempts.length) : 0;
  const strong = attempts.filter(item => item.score >= 80).length;

  const categories = useMemo(() => (Object.keys(categoryLabels) as QuestionCategory[]).map(category => {
    const categoryAttempts = attempts.filter(item => item.category === category);
    const score = categoryAttempts.length ? Math.round(categoryAttempts.reduce((sum, item) => sum + item.score, 0) / categoryAttempts.length) : 0;
    const available = oralQuestions.filter(item => item.category === category).length + writtenQuestions.filter(item => item.category === category).length;
    return { category, score, attempts: categoryAttempts.length, available };
  }), [attempts, oralQuestions, writtenQuestions]);

  const missed = useMemo(() => {
    const counts = new Map<string, number>();
    attempts.forEach(attempt => attempt.missed.forEach(item => counts.set(item, (counts.get(item) || 0) + 1)));
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [attempts]);

  const trend = attempts.slice(-10).map(item => item.score);
  const points = trend.map((score, index) => `${trend.length === 1 ? 50 : (index / (trend.length - 1)) * 100},${100 - score}`).join(' ');
  const weakest = [...categories].sort((a, b) => (a.attempts ? a.score : -1) - (b.attempts ? b.score : -1))[0];

  const badges = [
    { icon: BookOpenCheck, label: 'First step', hint: 'Complete one answer', active: attempts.length >= 1 },
    { icon: Flame, label: 'On fire', hint: 'Reach a 3-day streak', active: state.streak >= 3 },
    { icon: Medal, label: 'Panel ready', hint: 'Score 80+ three times', active: strong >= 3 },
    { icon: Target, label: 'Well rounded', hint: 'Practise all 5 areas', active: categories.every(item => item.attempts > 0) },
  ];

  return (
    <div className="page progress-page">
      <section className="page-title-row">
        <div><span className="eyebrow">Evidence of improvement</span><h1>Your progress</h1><p>See what is getting stronger and what deserves the next attempt.</p></div>
        <button className="button primary" onClick={() => startPractice('oral')}><Mic2 size={17} /> Continue practice</button>
      </section>

      <section className="progress-hero-grid">
        <article className="panel readiness-overview">
          <div className="progress-ring-large" style={{ '--progress': `${readiness * 3.6}deg` } as React.CSSProperties}><div><strong>{readiness}<span>%</span></strong><small>Readiness</small></div></div>
          <div className="readiness-detail"><span className="eyebrow">Current estimate</span><h2>{readiness >= 75 ? 'You are building panel-level coverage.' : 'The foundation is taking shape.'}</h2><p>Weighted from recent answer scores and practice volume. This is a coaching measure, not a hiring prediction.</p><div className="mini-stats"><span><strong>{average || '—'}</strong>Avg. score</span><span><strong>{attempts.length}</strong>Attempts</span><span><strong>{strong}</strong>Strong</span></div></div>
        </article>
        <article className="panel level-overview">
          <div className="level-burst"><Trophy size={26} /></div>
          <span className="eyebrow">Motivation track</span><h2>Level {level}</h2><strong>Rising Inspector</strong>
          <div className="level-line"><i><b style={{ width: `${((state.xp % 180) / 180) * 100}%` }} /></i><span>{state.xp % 180} / 180 XP</span></div>
          <p><Sparkles size={15} /> {180 - (state.xp % 180)} XP to your next level</p>
        </article>
      </section>

      <section className="progress-content-grid">
        <article className="panel trend-card">
          <div className="panel-heading"><div><span className="eyebrow">Recent attempts</span><h2>Answer trend</h2></div><span className={`trend-chip ${trend.length > 1 && trend[trend.length - 1] >= trend[0] ? 'up' : ''}`}><TrendingUp size={15} /> Last {trend.length || 0}</span></div>
          {trend.length ? <div className="chart-wrap"><div className="chart-grid"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div><svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Recent answer score trend"><defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#0f7b68" stopOpacity=".26" /><stop offset="100%" stopColor="#0f7b68" stopOpacity="0" /></linearGradient></defs><polygon points={`0,100 ${points} 100,100`} fill="url(#chartFill)" /><polyline points={points} fill="none" stroke="#0f7b68" strokeWidth="2.2" vectorEffect="non-scaling-stroke" />{trend.map((score, index) => <circle key={`${score}-${index}`} cx={trend.length === 1 ? 50 : (index / (trend.length - 1)) * 100} cy={100 - score} r="1.8" fill="#fff" stroke="#0f7b68" strokeWidth="1" vectorEffect="non-scaling-stroke" />)}</svg></div> : <div className="chart-empty"><BarChart3 size={27} /><h3>Your trend starts with one answer.</h3><p>Complete a practice question to draw the first point.</p></div>}
        </article>

        <article className="panel category-progress-card">
          <div className="panel-heading"><div><span className="eyebrow">Coverage</span><h2>By focus area</h2></div></div>
          <div className="category-progress-list">
            {categories.map(item => <div className="category-progress-row" key={item.category}><div><span className={`category-dot ${item.category}`} /><span><strong>{categoryLabels[item.category]}</strong><small>{item.attempts} attempts · {item.available} built-in</small></span></div><i><b style={{ width: `${item.score || 4}%` }} /></i><em>{item.attempts ? `${item.score}%` : '—'}</em></div>)}
          </div>
        </article>
      </section>

      <section className="insight-grid">
        <article className="panel improvement-card">
          <span className="improvement-icon"><Zap size={20} /></span><div><span className="eyebrow">Best next improvement</span><h2>{attempts.length ? `Strengthen ${categoryLabels[weakest.category].toLowerCase()}` : 'Start with the advertised inspector duties'}</h2><p>{attempts.length ? `This area is at ${weakest.score}% across ${weakest.attempts} attempt${weakest.attempts === 1 ? '' : 's'}. Use one answer to add missing concepts, then retry it immediately.` : 'Role duties are high-value and give you examples for personal, technical and scenario answers.'}</p><button className="text-button" onClick={() => startPractice('oral', weakest.category)}>Start focused attempt <ArrowRight size={16} /></button></div>
        </article>
        <article className="panel missed-card">
          <div className="panel-heading"><div><span className="eyebrow">Concept signals</span><h2>Often missed</h2></div></div>
          {missed.length ? <div className="missed-list">{missed.map(([item, count]) => <div key={item}><span>{item}</span><em>{count}×</em></div>)}</div> : <div className="small-empty"><CheckCircle2 size={22} /><p>Complete scored answers to reveal recurring gaps.</p></div>}
        </article>
      </section>

      <section className="panel badges-panel">
        <div className="panel-heading"><div><span className="eyebrow">Milestones</span><h2>Practice badges</h2></div><span className="count-chip">{badges.filter(item => item.active).length} / {badges.length} unlocked</span></div>
        <div className="badge-grid">{badges.map(item => { const Icon = item.icon; return <div className={`badge-item ${item.active ? 'active' : ''}`} key={item.label}><span><Icon size={23} /></span><div><strong>{item.label}</strong><small>{item.active ? 'Unlocked' : item.hint}</small></div>{item.active && <Award size={17} />}</div>; })}</div>
      </section>

      <section className="panel recent-table-card">
        <div className="panel-heading"><div><span className="eyebrow">History</span><h2>Recent attempts</h2></div></div>
        {attempts.length ? <div className="attempt-table">{attempts.slice(-8).reverse().map(attempt => <div className="attempt-row" key={attempt.id}><span className={`attempt-mode ${attempt.mode}`}>{attempt.mode === 'oral' ? <Mic2 size={15} /> : <BookOpenCheck size={15} />}</span><div><strong>{attempt.questionId.startsWith('written') ? 'Written knowledge check' : oralQuestions.find(item => item.id === attempt.questionId)?.question || 'Custom practice question'}</strong><small>{categoryLabels[attempt.category]} · {new Date(attempt.createdAt).toLocaleString('en-TZ', { dateStyle: 'medium', timeStyle: 'short' })}</small></div><em className={attempt.score >= 75 ? 'good' : attempt.score >= 50 ? 'mid' : ''}>{attempt.score}</em></div>)}</div> : <div className="empty-history"><BarChart3 size={27} /><h3>No attempts yet</h3><p>Your private practice history will appear here.</p></div>}
      </section>
    </div>
  );
}
