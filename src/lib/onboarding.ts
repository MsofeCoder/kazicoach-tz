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

export const guideSteps: Array<{ title: string; label: string; body: string; tip: string; view: View }> = [
  { title: 'Your preparation starts here', label: 'Welcome · Karibu',
    body: 'Build confidence one answer at a time. Explore your private workspace without creating an account.',
    tip: 'This short guide is always available from Show me around in the menu or Settings.', view: 'dashboard' },
  { title: 'Bring your own materials', label: '01 · Prepare',
    body: 'Open Materials to add a CV, job description or preparation notes. Supported documents are read in this browser by default.',
    tip: 'Use your real experience. The example role pack is coaching material; verify current requirements with official sources.', view: 'materials' },
  { title: 'Practise a clear answer', label: '02 · Practise',
    body: 'Choose oral or written practice. Read the question, organise your points and use feedback to improve your next answer.',
    tip: 'Free practice includes a limited trial. Available voices and panel options follow your active package; microphone access is optional.', view: 'practice' },
  { title: 'See how you are improving', label: '03 · Grow',
    body: 'Open Progress to review your scores, practice streak, XP and milestones. Coaching scores help you prepare; they are not official interview grades.',
    tip: 'Your workspace stays in this browser. Use Settings → Export JSON to keep a private backup, especially on a shared device.', view: 'progress' },
  { title: 'Choose what works for you', label: '04 · Your choice',
    body: 'Accounts are optional. Registered Free users can choose to sync progress summaries; documents and answer text are excluded. Basic and Plus options are explained in Settings.',
    tip: 'Upgrade links open the business WhatsApp chat with the selected package only. Activation follows verification; no payment is taken in this app.', view: 'settings' },
];
