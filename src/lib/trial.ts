export const trialKey = "kazicoach-tz:v2:trial-used";
export function loadTrial(storage: Pick<Storage, "getItem">) {
  try {
    const value = Number(storage.getItem(trialKey));
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  } catch {
    return 0;
  }
}
export function trialAvailable(used: number, limit: number, premium: boolean) {
  return premium || used < limit;
}
