import type { OralQuestion, ScoreResult } from '../types';

const normalize = (value: string) => value
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[^a-z0-9%+\-\s/]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

const structureMarkers = [
  'first', 'second', 'third', 'finally', 'before', 'during', 'after',
  'because', 'therefore', 'for example', 'my role', 'i would', 'the result',
  'step 1', 'step one', 'in summary', 'however', 'if',
];

export function scoreAnswer(question: OralQuestion, rawAnswer: string): ScoreResult {
  const answer = normalize(rawAnswer);
  const words = answer ? answer.split(' ').filter(Boolean) : [];

  if (!answer) {
    return {
      score: 0, conceptScore: 0, depthScore: 0, structureScore: 0,
      matched: [], missed: question.keyPoints,
      headline: 'Add an answer to receive coaching',
      improvement: `Start with this anchor: ${question.keyPoints[0]}.`,
    };
  }

  const groupMatches = question.keywords.map(group =>
    group.some(keyword => answer.includes(normalize(keyword)))
  );
  const matched = question.keyPoints.filter((_, index) => groupMatches[index]);
  const missed = question.keyPoints.filter((_, index) => !groupMatches[index]);
  const conceptRatio = groupMatches.filter(Boolean).length / Math.max(1, groupMatches.length);
  const conceptScore = Math.round(conceptRatio * 65);

  let depthScore = 0;
  if (words.length >= 15) depthScore = 6;
  if (words.length >= 35) depthScore = 12;
  if (words.length >= 60) depthScore = 17;
  if (words.length >= 90) depthScore = 20;

  const markerCount = structureMarkers.filter(marker => answer.includes(marker)).length;
  const sentenceCount = rawAnswer.split(/[.!?]+/).filter(item => item.trim().length > 8).length;
  let structureScore = Math.min(10, markerCount * 2);
  if (sentenceCount >= 2) structureScore += 2;
  if (sentenceCount >= 4) structureScore += 2;
  if (words.length >= 30 && words.length <= 220) structureScore += 1;
  structureScore = Math.min(15, structureScore);

  const score = Math.min(100, conceptScore + depthScore + structureScore);
  const headline = score >= 85
    ? 'Panel-ready answer'
    : score >= 70
      ? 'Strong foundation — tighten one gap'
      : score >= 50
        ? 'Good start — add the missing evidence'
        : 'Build the answer around the key concepts';

  const improvement = missed.length
    ? `On your next attempt, explicitly include: ${missed.slice(0, 2).join(' and ')}.`
    : words.length < 60
      ? 'All core concepts appeared. Add one concrete example and a clear conclusion.'
      : 'Keep this content, but deliver it calmly within the suggested time.';

  return { score, conceptScore, depthScore, structureScore, matched, missed, headline, improvement };
}

export function calculateReadiness(scores: number[]): number {
  if (!scores.length) return 18;
  const recent = scores.slice(-12);
  const average = recent.reduce((sum, score) => sum + score, 0) / recent.length;
  const practiceBonus = Math.min(12, scores.length * 1.2);
  return Math.min(96, Math.round(average * 0.88 + practiceBonus));
}
