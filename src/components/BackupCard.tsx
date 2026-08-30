import { Download, HardDriveDownload } from 'lucide-react';
import { useApp } from '../context';
import { exportWorkspace, shouldSuggestBackup, workspaceItemCount } from '../lib/backup';

/** Weekly JSON-export nudge. Renders nothing while the workspace is freshly backed up. */
export default function BackupCard() {
  const { state, setState, notify } = useApp();
  if (!shouldSuggestBackup(state)) return null;

  const backUp = () => {
    const filename = exportWorkspace(state);
    setState(current => ({ ...current, lastExportAt: new Date().toISOString() }));
    notify(`Backup downloaded (${filename}).`);
  };

  const items = workspaceItemCount(state);
  return (
    <article className="backup-card panel" role="status">
      <span className="backup-icon"><HardDriveDownload size={20} /></span>
      <div className="backup-copy">
        <strong>Back up your private workspace</strong>
        <p>{items} saved item{items === 1 ? '' : 's'} live only in this browser. Download a JSON copy so clearing browser data never costs your preparation. A silent IndexedDB mirror already guards it between exports.</p>
      </div>
      <button className="button secondary" onClick={backUp}><Download size={16} /> Export JSON now</button>
    </article>
  );
}
