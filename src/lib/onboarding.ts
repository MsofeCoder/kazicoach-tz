import type { View } from '../types';

export const guideKey = 'kazicoach-tz:guide:v1';

// Separate from study data. A blocked storage API must never block the workspace.
export function shouldOfferGuide(storage: Pick<Storage, 'getItem'>, search: string): boolean {
  const query = new URLSearchParams(search);
  if (query.has('kc_auth') || query.has('kc_recovery') || query.has('code')) return false;
  try { return !storage.getItem(guideKey) && !storage.getItem('kazicoach-tz:v1'); }
  catch { return false; }
}

export function rememberGuide(storage: Pick<Storage, 'setItem'>): void {
  try { storage.setItem(guideKey, 'seen'); } catch { /* Session-only dismissal still works. */ }
}

type TourRect = { top: number; left: number; right: number; bottom: number };
// Keep the highlighted area inside the viewport and above the explanation when overlapping.
export function spotlightBounds(target: TourRect, card: TourRect, width: number, height: number) {
  const left = Math.max(8, target.left - 8);
  let right = Math.min(width - 8, target.right + 8);
  const top = Math.max(50, target.top - 8);
  // On wide screens reveal the usable portion beside the card rather than a thin strip above it.
  if (target.bottom > card.top - 18 && card.left - 18 - left >= 240) right = Math.min(right, card.left - 18);
  const overlapsCard = right > card.left - 12 && left < card.right + 12;
  const bottom = Math.min(height - 8, target.bottom + 8, overlapsCard ? card.top - 18 : height - 8);
  if (right - left < 24 || bottom - top < 24) return null;
  return { top, left, width: right - left, height: bottom - top };
}

export const guideSteps: Array<{ title: string; feature: string; target: string; label: string; body: string; tip: string; view: View }> = [
  { title: 'A clear place to begin', feature: 'Today', target: 'welcome', label: '01 · Welcome', view: 'dashboard',
    body: 'This is your preparation workspace. Today brings your interview plan, practice activity and next focus together so you know where to begin.',
    tip: 'Follow the tour as we move through the real pages. You can leave at any time and replay from Show me around.' },
  { title: 'Make preparation your own', feature: 'Materials', target: 'materials', label: '02 · Bring your experience', view: 'materials',
    body: 'Add your CV, job advert or preparation notes here. Choose files or paste text to build a library based on your own experience.',
    tip: 'Supported documents are read in this browser by default. The tour will never choose a file or upload anything for you.' },
  { title: 'Turn a source into practice', feature: 'Question builder', target: 'builder', label: '03 · Prepare with purpose', view: 'materials',
    body: 'Select a text source in your library, then use Create locally to build practice cards. Your new cards become available in the practice room.',
    tip: 'Local cards stay on your device. Optional cloud AI requires separate availability, access and your confirmation; its advice needs verification.' },
  { title: 'Rehearse with confidence', feature: 'Practice', target: 'practice', label: '04 · Try an answer', view: 'practice',
    body: 'Choose an oral panel or written test here. Work through a question, give your answer and review coaching feedback before trying again.',
    tip: 'Looking around uses no trial questions. Scoring an answer does. Microphone access is optional; voice and panel choices depend on your package.' },
  { title: 'Notice what gets stronger', feature: 'Progress', target: 'progress', label: '05 · Build momentum', view: 'progress',
    body: 'Your recent scores, attempts and XP show how your practice is developing. Use the focus-area breakdown below to choose what to rehearse next.',
    tip: 'These are coaching measures, not official interview grades or hiring predictions.' },
  { title: 'Stay private. Sync by choice.', feature: 'Accounts', target: 'account', label: '06 · Your choice', view: 'settings',
    body: 'An account is optional. If you register, you can choose progress summaries to sync. Your documents and answer text are excluded from summary sync.',
    tip: 'Basic and Plus details are further down this page. The tour never registers you, changes your package or opens a payment conversation.' },
  { title: 'Keep a copy of your work', feature: 'Local backup', target: 'backup', label: '07 · Ready when you are', view: 'settings',
    body: 'Export JSON downloads a private copy of your browser workspace. Keep it somewhere safe, especially before clearing browser data or changing devices.',
    tip: 'Export does not upload your work. Reset all data is destructive: only use it when you intend to erase this browser workspace.' },
];
