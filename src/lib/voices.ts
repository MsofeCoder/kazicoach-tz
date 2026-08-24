import type { VoiceStyle } from '../types';

export const voiceStyleOptions: Array<{ value: VoiceStyle; label: string; note: string }> = [
  { value: 'mixed', label: 'Mixed 5-person panel', note: 'Different voices by panel member' },
  { value: 'male', label: 'Male interviewer', note: 'Best available device voice' },
  { value: 'female', label: 'Female interviewer', note: 'Best available device voice' },
  { value: 'soft', label: 'Soft interviewer', note: 'Gentle pace and volume' },
  { value: 'deep', label: 'Deep interviewer', note: 'Lower pitch and measured pace' },
];

const maleHints = ['male', 'david', 'mark', 'james', 'daniel', 'george', 'arthur', 'ryan', 'liam', 'thomas', 'oliver', 'alex', 'fred'];
const femaleHints = ['female', 'zira', 'hazel', 'susan', 'samantha', 'victoria', 'karen', 'moira', 'fiona', 'ava', 'aria', 'salli', 'joanna'];

function hasHint(voice: SpeechSynthesisVoice, hints: string[]) {
  const name = `${voice.name} ${voice.voiceURI}`.toLowerCase();
  return hints.some(hint => name.includes(hint));
}

export function englishVoices(): SpeechSynthesisVoice[] {
  if (!('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices().filter(voice => /^en([-_]|$)/i.test(voice.lang));
}

function voiceFromGroup(voices: SpeechSynthesisVoice[], preferred: 'male' | 'female', offset = 0) {
  const hints = preferred === 'male' ? maleHints : femaleHints;
  const matches = voices.filter(voice => hasHint(voice, hints));
  const pool = matches.length ? matches : voices;
  return pool.length ? pool[offset % pool.length] : null;
}

export function selectPanelVoice(style: VoiceStyle, memberIndex: number): SpeechSynthesisVoice | null {
  const voices = englishVoices();
  if (!voices.length) return null;
  if (style === 'mixed') {
    const preferred: Array<'female' | 'male'> = ['female', 'male', 'male', 'female', 'female'];
    return voiceFromGroup(voices, preferred[memberIndex % preferred.length], memberIndex);
  }
  if (style === 'male' || style === 'deep') return voiceFromGroup(voices, 'male', memberIndex);
  return voiceFromGroup(voices, 'female', memberIndex);
}

export function voiceDelivery(style: VoiceStyle, baseRate: number) {
  if (style === 'deep') return { rate: Math.max(.65, baseRate * .9), pitch: .72, volume: 1 };
  if (style === 'soft') return { rate: Math.max(.68, baseRate * .9), pitch: 1.02, volume: .82 };
  if (style === 'female') return { rate: baseRate, pitch: 1.08, volume: 1 };
  if (style === 'male') return { rate: baseRate, pitch: .9, volume: 1 };
  return { rate: baseRate, pitch: 1, volume: 1 };
}
