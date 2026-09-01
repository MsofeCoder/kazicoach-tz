export type View = 'dashboard' | 'practice' | 'materials' | 'progress' | 'settings';
export type PracticeMode = 'oral' | 'written';
export type VoiceStyle = 'mixed' | 'male' | 'female' | 'soft' | 'deep';
export type QuestionCategory = 'personal' | 'role' | 'technical' | 'scenario' | 'ethics';
export type Difficulty = 'Foundation' | 'Core' | 'Stretch';

export interface OralQuestion {
  id: string;
  category: QuestionCategory;
  difficulty: Difficulty;
  question: string;
  swHint: string;
  modelAnswer: string;
  keyPoints: string[];
  keywords: string[][];
  timeLimit: number;
  source: string;
  followUp?: string;
  memoryAid?: {
    code: string;
    phrase: string;
    points: string[];
  };
  custom?: boolean;
}

export interface WrittenQuestion {
  id: string;
  category: QuestionCategory;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  source: string;
}

export interface ScoreResult {
  score: number;
  conceptScore: number;
  depthScore: number;
  structureScore: number;
  matched: string[];
  missed: string[];
  headline: string;
  improvement: string;
}

export interface Attempt {
  id: string;
  questionId: string;
  category: QuestionCategory;
  mode: PracticeMode;
  answer: string;
  score: number;
  matched: string[];
  missed: string[];
  createdAt: string;
  durationSeconds: number;
}

export interface CandidateProfile {
  id: string;
  name: string;
  jobPosition: string;
  organization: string;
  interviewDate: string;
  createdAt: string;
  sampleId?: string;
}

export interface Material {
  id: string;
  name: string;
  kind: 'cv' | 'job' | 'letter' | 'notes' | 'image';
  mime: string;
  size: number;
  extractedText: string;
  status: 'ready' | 'reference-only' | 'error';
  addedAt: string;
}

export interface Preferences {
  swahiliCoach: boolean;
  speechRate: number;
  voiceStyle: VoiceStyle;
}

export interface Workspace {
  id: string;
  profile: CandidateProfile;
  materials: Material[];
  customQuestions: OralQuestion[];
  attempts: Attempt[];
  createdAt: string;
}

export interface AppState {
  version: number;
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  xp: number;
  streak: number;
  lastActiveDate: string | null;
  lastExportAt: string | null;
  preferences: Preferences;
}
