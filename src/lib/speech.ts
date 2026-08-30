/**
 * Thin, testable wrappers around the browser speech engines.
 * The views never touch `window.speechSynthesis` or the vendor-prefixed
 * SpeechRecognition constructors directly, so unit tests can run in jsdom
 * where neither engine exists.
 */

export interface SpeakOptions {
  voice: SpeechSynthesisVoice | null;
  lang: string;
  rate: number;
  pitch: number;
  volume: number;
}

export interface RecognitionResultItem {
  transcript: string;
}

export interface RecognitionResult {
  0: RecognitionResultItem;
  length: number;
}

export interface RecognitionEvent {
  results: ArrayLike<RecognitionResult>;
}

export interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
}

export function speechSupported(): boolean {
  try {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  } catch {
    return false;
  }
}

export function cancelSpeech(): void {
  if (speechSupported()) window.speechSynthesis.cancel();
}

export function speakText(text: string, options: SpeakOptions): void {
  if (!speechSupported()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  if (options.voice) {
    utterance.voice = options.voice;
    utterance.lang = options.voice.lang;
  } else {
    utterance.lang = options.lang;
  }
  utterance.rate = options.rate;
  utterance.pitch = options.pitch;
  utterance.volume = options.volume;
  window.speechSynthesis.speak(utterance);
}

type RecognitionConstructor = new () => SpeechRecognitionLike;

function recognitionConstructor(): RecognitionConstructor | null {
  try {
    if (typeof window === 'undefined') return null;
    return (window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor }).SpeechRecognition
      || (window as unknown as { webkitSpeechRecognition?: RecognitionConstructor }).webkitSpeechRecognition
      || null;
  } catch {
    return null;
  }
}

export function recognitionSupported(): boolean {
  return recognitionConstructor() !== null;
}

export function createRecognition(): SpeechRecognitionLike | null {
  const Constructor = recognitionConstructor();
  if (!Constructor) return null;
  const recognition = new Constructor();
  recognition.lang = 'en-TZ';
  recognition.continuous = true;
  recognition.interimResults = true;
  return recognition;
}
