import {
  AlertCircle, ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2,
  CircleStop, Clock3, Crown, Eye, EyeOff, Headphones, Lightbulb, Mic, Mic2,
  RotateCcw, ShieldCheck, Sparkles, Target, UserRound, Users, Volume2, X, XCircle,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { categoryLabels, memoryAids, panelMemberForQuestion, panelMembers } from '../data';
import { useApp } from '../context';
import { realisticCoachNote } from '../lib/coaching';
import { oralBankFor, writtenBankFor } from '../lib/personalization';
import { scoreAnswer } from '../lib/scoring';
import { selectPanelVoice, voiceDelivery, voiceStyleOptions } from '../lib/voices';
import {
  cancelSpeech, createRecognition, recognitionSupported, speechSupported, speakText,
  type RecognitionEvent, type SpeechRecognitionLike,
} from '../lib/speech';
import type { OralQuestion, QuestionCategory, ScoreResult, VoiceStyle } from '../types';

const categories: Array<'all' | QuestionCategory> = ['all', 'personal', 'role', 'technical', 'scenario', 'ethics'];

function formatTime(seconds: number) {
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function PanelIdentity({ category, questionIndex, voiceStyle, onVoiceStyle }: { category: QuestionCategory; questionIndex: number; voiceStyle: VoiceStyle; onVoiceStyle: (style: VoiceStyle) => void }) {
  const member = panelMemberForQuestion(category, questionIndex);
  const activeIndex = panelMembers.findIndex(item => item.id === member.id);
  return (
    <div className="panel-identity panel-roster">
      <div className="panel-current">
        <span className="panel-avatar">{member.role === 'Chairperson' ? <Crown size={18} /> : <UserRound size={18} />}</span>
        <div><small>Member {activeIndex + 1} of 5 · now asking</small><strong>{member.role} · {member.name}</strong><em>{member.speciality}</em></div>
      </div>
      <div className="panel-faces" aria-label="Five-member interview panel">
        {panelMembers.map((item, index) => <span key={item.id} className={item.id === member.id ? 'active' : ''} title={`${item.role}: ${item.style}`}>{index + 1}</span>)}
      </div>
      <label className="voice-select"><Volume2 size={15} /><span>Voice<select value={voiceStyle} onChange={event => onVoiceStyle(event.target.value as VoiceStyle)}>{voiceStyleOptions.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}</select></span></label>
      <span className="simulation-pill"><i /> 5-person simulation</span>
    </div>
  );
}

function OralPractice() {
  const { state, setState, profile, materials, customQuestions, recordAttempt, notify, practiceCategory } = useApp();
  const [category, setCategory] = useState<'all' | QuestionCategory>(practiceCategory);
  const allQuestions = useMemo(() => oralBankFor(profile!, materials, customQuestions), [profile, materials, customQuestions]);
  const questions = useMemo(() => category === 'all' ? allQuestions : allQuestions.filter(item => item.category === category), [allQuestions, category]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [listening, setListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [activeVoiceName, setActiveVoiceName] = useState('Best available device voice');
  const [complete, setComplete] = useState(false);
  const [sessionScores, setSessionScores] = useState<number[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const question = questions[Math.min(index, Math.max(0, questions.length - 1))] as OralQuestion | undefined;
  const currentMember = question ? panelMemberForQuestion(question.category, index) : panelMembers[0];
  const currentMemberIndex = panelMembers.findIndex(item => item.id === currentMember.id);
  const updateVoiceStyle = (voiceStyle: VoiceStyle) => setState(current => ({ ...current, preferences: { ...current.preferences, voiceStyle } }));

  useEffect(() => {
    if (result) return;
    const timer = window.setInterval(() => setElapsed(value => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [result, index]);

  useEffect(() => () => {
    recognitionRef.current?.stop?.();
    cancelSpeech();
  }, []);

  const resetAnswer = () => {
    recognitionRef.current?.stop?.();
    setListening(false);
    setAnswer('');
    setResult(null);
    setElapsed(0);
    setSpeechError(null);
    cancelSpeech();
  };

  const selectCategory = (next: typeof category) => {
    setCategory(next);
    setIndex(0);
    setComplete(false);
    setSessionScores([]);
    resetAnswer();
  };

  const move = (direction: number) => {
    if (direction > 0 && index >= questions.length - 1) {
      resetAnswer();
      setComplete(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setIndex(current => Math.max(0, Math.min(questions.length - 1, current + direction)));
    resetAnswer();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const speak = (text: string) => {
    if (!speechSupported()) {
      setSpeechError('Read-aloud is not available in this browser.');
      return;
    }
    const voice = selectPanelVoice(state.preferences.voiceStyle, currentMemberIndex);
    const delivery = voiceDelivery(state.preferences.voiceStyle, state.preferences.speechRate);
    if (voice) setActiveVoiceName(voice.name);
    else setActiveVoiceName('Browser default voice');
    speakText(text, {
      voice,
      lang: 'en-GB',
      rate: delivery.rate,
      pitch: delivery.pitch,
      volume: delivery.volume,
    });
  };

  const toggleListening = () => {
    if (listening) {
      recognitionRef.current?.stop?.();
      setListening(false);
      return;
    }
    if (!recognitionSupported()) {
      setSpeechError('Voice capture is not supported here. Type your answer below—your coaching will be the same.');
      return;
    }
    try {
      const recognition = createRecognition();
      if (!recognition) {
        setSpeechError('Voice capture is not supported here. Type your answer below—your coaching will be the same.');
        return;
      }
      recognition.onresult = (event: RecognitionEvent) => {
        let transcript = '';
        for (let item = 0; item < event.results.length; item += 1) transcript += `${event.results[item][0].transcript} `;
        setAnswer(transcript.trim());
      };
      recognition.onerror = () => {
        setListening(false);
        setSpeechError('I could not capture that clearly. You can try again or type your answer.');
      };
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
      recognition.start();
      setListening(true);
      setSpeechError(null);
    } catch {
      setSpeechError('Microphone access was unavailable. Type your answer below.');
    }
  };

  const submit = () => {
    if (!question || answer.trim().length < 3) {
      notify('Add an answer first — even a short starting point is useful.');
      return;
    }
    recognitionRef.current?.stop?.();
    setListening(false);
    const scored = scoreAnswer(question, answer);
    setResult(scored);
    setSessionScores(current => [...current, scored.score]);
    recordAttempt({
      id: crypto.randomUUID(), questionId: question.id, category: question.category,
      mode: 'oral', answer: answer.trim(), score: scored.score, matched: scored.matched,
      missed: scored.missed, createdAt: new Date().toISOString(), durationSeconds: elapsed,
    });
    notify(`Answer saved · +${14 + Math.round(scored.score / 8) + (scored.score >= 80 ? 8 : 0)} XP`);
  };

  const restartSession = () => {
    setComplete(false);
    setIndex(0);
    setSessionScores([]);
    resetAnswer();
  };

  const clearPerformanceAndRestart = () => {
    if (!window.confirm('Clear all scores, attempts, XP and streak, then start again? Your materials and custom questions will stay.')) return;
    setState(current => {
      const activeId = current.activeWorkspaceId ?? current.workspaces[0]?.id;
      return {
        ...current,
        xp: 0, streak: 0, lastActiveDate: null,
        workspaces: current.workspaces.map(ws =>
          ws.id === activeId ? { ...ws, attempts: [] } : ws
        ),
      };
    });
    restartSession();
    notify('Performance progress cleared. Your preparation materials are safe.');
  };

  if (!question) return <div className="empty-state panel"><BookOpen size={28} /><h2>No questions in this category</h2><button className="button secondary" onClick={() => selectCategory('all')}>Show built-in questions</button></div>;
  if (complete) return <SessionComplete mode="oral" scores={sessionScores} onRestart={restartSession} onClear={clearPerformanceAndRestart} />;

  const timerPct = Math.min(100, (elapsed / question.timeLimit) * 100);

  return (
    <div className="practice-layout">
      <section className="practice-main">
        <PanelIdentity category={question.category} questionIndex={index} voiceStyle={state.preferences.voiceStyle} onVoiceStyle={updateVoiceStyle} />
        <div className="device-voice-note"><Users size={14} /><span>{currentMember.role} asks this question · voice on this device: <strong>{activeVoiceName}</strong></span></div>
        <div className="category-scroller" aria-label="Question category">
          {categories.map(item => <button key={item} className={category === item ? 'active' : ''} onClick={() => selectCategory(item)}>{item === 'all' ? 'All questions' : categoryLabels[item]}</button>)}
        </div>

        <article className="question-panel">
          <div className="question-topline">
            <div><span className={`category-badge ${question.category}`}>{categoryLabels[question.category]}</span><span className="difficulty">{question.difficulty}</span></div>
            <div className={`question-timer ${elapsed > question.timeLimit ? 'over' : ''}`}><Clock3 size={15} /><span>{formatTime(elapsed)}</span><i><b style={{ width: `${timerPct}%` }} /></i></div>
          </div>
          <div className="question-number">Question {index + 1} of {questions.length}</div>
          <h2>{question.question}</h2>
          <div className="question-actions">
            <button className="listen-button" onClick={() => speak(question.question)}><Volume2 size={17} /> Hear the panel ask</button>
            <span>Suggested: {Math.round(question.timeLimit / 30) * 0.5} min</span>
          </div>
          {state.preferences.swahiliCoach && <div className="coach-hint"><Lightbulb size={17} /><div><strong>Coach hint</strong><span>{question.swHint}</span></div></div>}
        </article>

        <article className={`answer-panel ${listening ? 'is-listening' : ''}`}>
          <div className="answer-heading">
            <div><span className="card-kicker">Your response</span><h3>{listening ? 'Listening… take your time' : result ? 'Response captured' : 'Answer as if the panel is listening'}</h3></div>
            <span className="privacy-chip"><ShieldCheck size={14} /> No audio stored</span>
          </div>
          {!result && (
            <>
              <button className={`record-button ${listening ? 'active' : ''}`} onClick={toggleListening}>
                <span>{listening ? <CircleStop size={27} /> : <Mic size={27} />}</span>
                <strong>{listening ? 'Stop recording' : 'Start speaking'}</strong>
                <small>{listening ? 'Your words are appearing below' : 'Browser microphone · or type instead'}</small>
                {listening && <i className="sound-wave"><b /><b /><b /><b /><b /></i>}
              </button>
              {speechError && <div className="inline-alert"><AlertCircle size={16} /> {speechError}</div>}
            </>
          )}
          <label className="answer-input-label" htmlFor="practice-answer">{result ? 'Your answer' : 'Transcript / typed answer'}<span>{answer.trim() ? answer.trim().split(/\s+/).length : 0} words</span></label>
          <textarea id="practice-answer" value={answer} readOnly={Boolean(result)} onChange={event => setAnswer(event.target.value)} placeholder="Start with your main point, then support it with evidence and a clear conclusion…" rows={7} />
          {!result ? (
            <div className="answer-actions"><button className="button ghost" onClick={resetAnswer}><RotateCcw size={16} /> Clear</button><button className="button primary large" onClick={submit}>Get my feedback <Sparkles size={17} /></button></div>
          ) : (
            <Feedback result={result} question={question} speak={speak} retry={resetAnswer} next={() => move(1)} />
          )}
        </article>
      </section>

      <aside className="session-sidebar">
        <article className="session-card">
          <span className="card-kicker">Session progress</span>
          <div className="session-progress"><div><strong>{index + 1}</strong><span>of {questions.length}</span></div><i><b style={{ width: `${((index + 1) / questions.length) * 100}%` }} /></i></div>
          <div className="session-nav"><button onClick={() => move(-1)}><ArrowLeft size={16} /> Previous</button><button onClick={() => move(1)}>Skip <ArrowRight size={16} /></button></div>
        </article>
        <article className="interview-note">
          <Headphones size={19} />
          <div><strong>Panel technique</strong><p>Pause for two seconds. Lead with your answer—not the background. Then give evidence.</p></div>
        </article>
        <article className="source-card">
          <span>Question source</span><strong>{question.source}</strong><p>Verify technical and legal details against current official material.</p>
        </article>
      </aside>
    </div>
  );
}

function Feedback({ result, question, speak, retry, next }: { result: ScoreResult; question: OralQuestion; speak: (text: string) => void; retry: () => void; next: () => void }) {
  const [revealed, setRevealed] = useState(false);
  const coach = realisticCoachNote(result.score, result.missed);
  const fallbackPoints = question.keyPoints.slice(0, 5).map(point => `Explain ${point.toLowerCase()} clearly and connect it to the inspector role.`);
  const aid = question.memoryAid || memoryAids[question.id] || {
    code: question.keyPoints.slice(0, 5).map(point => point.charAt(0)).join('').toUpperCase(),
    phrase: 'Five answer anchors',
    points: fallbackPoints,
  };

  return (
    <div className="feedback-block">
      <div className="feedback-summary">
        <div className={`score-badge ${result.score >= 75 ? 'strong' : result.score >= 50 ? 'building' : ''}`}><strong>{result.score}</strong><span>/100</span></div>
        <div><span className="card-kicker">Coach feedback</span><h3>{result.headline}</h3><p>{result.improvement}</p></div>
      </div>
      <div className="score-breakdown">
        <div><span>Concepts</span><i><b style={{ width: `${(result.conceptScore / 65) * 100}%` }} /></i><strong>{result.conceptScore}/65</strong></div>
        <div><span>Depth</span><i><b style={{ width: `${(result.depthScore / 20) * 100}%` }} /></i><strong>{result.depthScore}/20</strong></div>
        <div><span>Structure</span><i><b style={{ width: `${(result.structureScore / 15) * 100}%` }} /></i><strong>{result.structureScore}/15</strong></div>
      </div>
      <div className="concept-columns">
        <div><strong><CheckCircle2 size={16} /> Concepts heard</strong>{result.matched.length ? result.matched.map(item => <span className="concept-pill good" key={item}>{item}</span>) : <p>No target concepts detected yet.</p>}</div>
        <div><strong><Target size={16} /> Add next time</strong>{result.missed.length ? result.missed.map(item => <span className="concept-pill missing" key={item}>{item}</span>) : <span className="concept-pill good">All core concepts covered</span>}</div>
      </div>

      <div className="real-coach-note">
        <span><Sparkles size={18} /></span>
        <div><strong>{coach.title}</strong><p>{coach.message}</p><em>{coach.swahili}</em></div>
      </div>

      <section className="probable-answer-card">
        <div className="probable-answer-head">
          <div><span className="eyebrow">Most probable answer structure</span><h3>Five points the panel is likely listening for</h3></div>
          <button className="button secondary small" onClick={() => setRevealed(value => !value)}>{revealed ? <EyeOff size={16} /> : <Eye size={16} />}{revealed ? 'Hide answer' : 'Reveal answer'}</button>
        </div>
        <div className={`probable-answer-content ${revealed ? 'revealed' : 'faded'}`} aria-hidden={!revealed}>
          <div className="mnemonic-box"><strong>{aid.code}</strong><span>{aid.phrase}</span></div>
          <ol>{aid.points.slice(0, 5).map((point, index) => <li key={point}><span>{index + 1}</span><p>{point}</p></li>)}</ol>
          <div className="full-model"><strong>Natural full answer</strong><p>{question.modelAnswer}</p><button className="listen-button" disabled={!revealed} tabIndex={revealed ? 0 : -1} onClick={() => speak(question.modelAnswer)}><Volume2 size={16} /> Hear this answer</button></div>
        </div>
        {!revealed && <button className="reveal-overlay" onClick={() => setRevealed(true)}><Eye size={22} /><strong>Reveal after your attempt</strong><span>Compare ideas—do not memorize every sentence.</span></button>}
      </section>

      <div className="feedback-actions"><button className="button secondary" onClick={retry}><RotateCcw size={16} /> Try again</button><button className="button primary" onClick={next}>Next question <ArrowRight size={17} /></button></div>
    </div>
  );
}

function SessionComplete({ mode, scores, onRestart, onClear }: { mode: 'oral' | 'written'; scores: number[]; onRestart: () => void; onClear: () => void }) {
  const average = scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0;
  const strong = scores.filter(score => score >= 80).length;
  return (
    <section className="session-complete panel">
      <span className="complete-burst"><CheckCircle2 size={34} /></span>
      <span className="eyebrow">Session finished</span>
      <h2>Umemaliza—now choose your next round.</h2>
      <p>{scores.length ? `You completed ${scores.length} scored ${mode} answer${scores.length === 1 ? '' : 's'}. A fresh round should focus on the points you missed, not on speaking faster.` : 'You reached the end. Start again and give each question one complete five-point answer.'}</p>
      <div className="complete-stats"><span><strong>{scores.length}</strong><small>Answered</small></span><span><strong>{scores.length ? `${average}%` : '—'}</strong><small>Average</small></span><span><strong>{strong}</strong><small>Strong answers</small></span></div>
      <div className="complete-advice"><Lightbulb size={18} /><span><strong>Realistic next step</strong><p>Take five minutes away from the screen. Then retry only your weakest three answers without reading the model response.</p></span></div>
      <div className="complete-actions"><button className="button primary" onClick={onRestart}><RotateCcw size={17} /> Start this session again</button><button className="button danger" onClick={onClear}><TrashIcon /> Clear progress & start fresh</button></div>
      <small className="clear-note">Clearing performance keeps your uploaded materials and custom question bank.</small>
    </section>
  );
}

function TrashIcon() {
  return <XCircle size={17} />;
}

function WrittenPractice() {
  const { state, setState, profile, recordAttempt, notify } = useApp();
  const writtenQuestions = useMemo(() => writtenBankFor(profile!), [profile]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [complete, setComplete] = useState(false);
  const [sessionScores, setSessionScores] = useState<number[]>([]);
  const question = writtenQuestions[index];
  const updateVoiceStyle = (voiceStyle: VoiceStyle) => setState(current => ({ ...current, preferences: { ...current.preferences, voiceStyle } }));

  const check = () => {
    if (selected === null) { notify('Choose one answer before checking.'); return; }
    const correct = selected === question.correctIndex;
    const score = correct ? 100 : 0;
    setChecked(true);
    setSessionScores(current => [...current, score]);
    if (correct) setCorrectCount(value => value + 1);
    recordAttempt({
      id: crypto.randomUUID(), questionId: question.id, category: question.category, mode: 'written',
      answer: question.options[selected], score,
      matched: correct ? ['Correct option and concept'] : [], missed: correct ? [] : ['Review the explanation'],
      createdAt: new Date().toISOString(), durationSeconds: 0,
    });
    notify(correct ? 'Correct · written score saved' : 'Reviewed · keep the explanation in mind');
  };

  const next = () => {
    if (index === writtenQuestions.length - 1) {
      setComplete(true);
    } else setIndex(value => value + 1);
    setSelected(null); setChecked(false);
  };

  const restart = () => {
    setIndex(0); setSelected(null); setChecked(false); setCorrectCount(0); setSessionScores([]); setComplete(false);
  };
  const clearPerformance = () => {
    if (!window.confirm('Clear all scores, attempts, XP and streak, then start again? Your materials and custom questions will stay.')) return;
    setState(current => {
      const activeId = current.activeWorkspaceId ?? current.workspaces[0]?.id;
      return {
        ...current,
        xp: 0, streak: 0, lastActiveDate: null,
        workspaces: current.workspaces.map(ws =>
          ws.id === activeId ? { ...ws, attempts: [] } : ws
        ),
      };
    });
    restart(); notify('Performance progress cleared. Your preparation materials are safe.');
  };

  if (complete) return <SessionComplete mode="written" scores={sessionScores} onRestart={restart} onClear={clearPerformance} />;

  return (
    <div className="written-layout">
      <section className="written-main panel">
        <PanelIdentity category={question.category} questionIndex={index} voiceStyle={state.preferences.voiceStyle} onVoiceStyle={updateVoiceStyle} />
        <div className="written-progress-row"><span>Written drill</span><strong>{index + 1} / {writtenQuestions.length}</strong></div>
        <div className="wide-progress"><i style={{ width: `${((index + 1) / writtenQuestions.length) * 100}%` }} /></div>
        <span className={`category-badge ${question.category}`}>{categoryLabels[question.category]}</span>
        <h2>{question.question}</h2>
        <div className="option-list">
          {question.options.map((option, optionIndex) => {
            const isCorrect = checked && optionIndex === question.correctIndex;
            const isWrong = checked && optionIndex === selected && optionIndex !== question.correctIndex;
            return (
              <button key={option} disabled={checked} className={`${selected === optionIndex ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`} onClick={() => setSelected(optionIndex)}>
                <span>{String.fromCharCode(65 + optionIndex)}</span><strong>{option}</strong>{isCorrect && <Check size={18} />}{isWrong && <X size={18} />}
              </button>
            );
          })}
        </div>
        {checked && <div className={`written-explanation ${selected === question.correctIndex ? 'correct' : 'wrong'}`}>{selected === question.correctIndex ? <CheckCircle2 size={20} /> : <XCircle size={20} />}<div><strong>{selected === question.correctIndex ? 'Correct — well done.' : 'Not quite — learn the reason.'}</strong><p>{question.explanation}</p><small>Source: {question.source}</small></div></div>}
        <div className="written-actions"><span>Score this run: <strong>{correctCount}/{index + (checked ? 1 : 0)}</strong></span>{!checked ? <button className="button primary" onClick={check}>Check answer</button> : <button className="button primary" onClick={next}>{index === writtenQuestions.length - 1 ? 'View session result' : 'Next question'} <ArrowRight size={17} /></button>}</div>
      </section>
      <aside className="session-sidebar">
        <article className="interview-note"><Lightbulb size={19} /><div><strong>Written-test habit</strong><p>Read the stem twice. Eliminate unsafe or absolute options before choosing.</p></div></article>
        <article className="source-card"><span>Practice note</span><strong>Not an official PSRS paper</strong><p>These questions test the supplied role context and do not predict the official exam.</p></article>
      </aside>
    </div>
  );
}

export default function Practice() {
  const { practiceMode, setPracticeMode } = useApp();
  return (
    <div className="page practice-page">
      <section className="page-title-row">
        <div><span className="eyebrow">Focused rehearsal</span><h1>Practice room</h1><p>Train for clarity, evidence and calm delivery—not memorised perfection.</p></div>
        <div className="mode-switch" role="group" aria-label="Practice mode">
          <button className={practiceMode === 'oral' ? 'active' : ''} onClick={() => setPracticeMode('oral')}><Mic2 size={17} /> Oral panel</button>
          <button className={practiceMode === 'written' ? 'active' : ''} onClick={() => setPracticeMode('written')}><BookOpen size={17} /> Written test</button>
        </div>
      </section>
      {practiceMode === 'oral' ? <OralPractice /> : <WrittenPractice />}
    </div>
  );
}
