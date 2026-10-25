import { AlertCircle, CheckCircle2, Info, Loader2 } from 'lucide-react';
import type { Notice } from '../lib/feedback';

export default function ActionNotice({ notice }: { notice: Notice | null }) {
  if (!notice) return null;
  const Icon = notice.tone === 'error' ? AlertCircle : notice.tone === 'success' ? CheckCircle2 : notice.tone === 'loading' ? Loader2 : Info;
  return <div className={`action-notice action-notice-${notice.tone}`} role={notice.tone === 'error' ? 'alert' : 'status'} aria-live={notice.tone === 'error' ? 'assertive' : 'polite'} aria-atomic="true">
    <Icon size={20} className={notice.tone === 'loading' ? 'spin' : undefined} aria-hidden="true" />
    <div><strong>{notice.title}</strong><p>{notice.message}</p></div>
  </div>;
}
