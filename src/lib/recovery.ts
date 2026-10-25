import {requestRecovery, type Notice} from './feedback';

export const recoveryCooldownKey = 'kazicoach-tz:recovery-cooldown:v1';
const waitMs = 65_000;
type GateStorage = Pick<Storage, 'getItem' | 'setItem'>;

// One timestamp only; no email, password, token or PKCE verifier is stored here.
export function recoveryWait(storage: GateStorage, now = Date.now()): number {
  const end = Number(storage.getItem(recoveryCooldownKey));
  if (!Number.isFinite(end)) return 0;
  return Math.ceil(Math.max(0, Math.min(waitMs, end - now)) / 1000);
}

export async function guardedRecovery(send: () => Promise<{error: unknown}>, storage: GateStorage, local = false, now = Date.now()): Promise<Notice> {
  const remaining = recoveryWait(storage, now);
  if (remaining) return {tone:'info',title:'Please wait before requesting another link',message:`Wait ${remaining} seconds. Open the email already requested in the same browser and profile. A new request can replace the previous recovery link.`};
  // Reserve before invoking the SDK, including for rejected requests. A rejected
  // second request can remove the SDK's verifier for the previously sent email.
  storage.setItem(recoveryCooldownKey, String(now + waitMs));
  return requestRecovery(send, local);
}
