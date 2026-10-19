import type { Attempt } from "../types";
import { darDate } from "./storage";

export interface ProgressRow {
  user_id: string;
  id: string;
  question_id: string;
  category: Attempt["category"];
  mode: Attempt["mode"];
  score: number;
  duration_seconds: number;
  created_at: string;
}
export interface QueueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export const queueKey = (user: string) => `kazicoach-tz:v2:queue:${user}`;
export function progressRow(user: string, attempt: Attempt): ProgressRow {
  return {
    user_id: user,
    id: attempt.id,
    question_id: attempt.questionId,
    category: attempt.category,
    mode: attempt.mode,
    score: Math.round(attempt.score),
    duration_seconds: Math.min(
      86400,
      Math.max(0, Math.round(attempt.durationSeconds)),
    ),
    created_at: attempt.createdAt,
  };
}
export function readQueue(storage: QueueStorage, user: string): ProgressRow[] {
  const raw = storage.getItem(queueKey(user));
  if (!raw) return [];
  const rows: unknown = JSON.parse(raw);
  if (!Array.isArray(rows))
    throw new Error(
      "Invalid sync queue. Export local data before clearing it.",
    );
  return rows.filter((row): row is ProgressRow => row?.user_id === user);
}
export function enqueue(
  storage: QueueStorage,
  user: string,
  attempts: Attempt[],
) {
  const rows = new Map(readQueue(storage, user).map((row) => [row.id, row]));
  for (const attempt of attempts)
    if (!rows.has(attempt.id)) rows.set(attempt.id, progressRow(user, attempt));
  // Never drop unacknowledged data silently.
  if (rows.size > 1000)
    throw new Error(
      "Sync queue is full. Reconnect before selecting more progress.",
    );
  storage.setItem(queueKey(user), JSON.stringify([...rows.values()]));
}
export async function flushQueue(
  storage: QueueStorage,
  user: string,
  send: (rows: ProgressRow[]) => Promise<void>,
  active: () => boolean = () => true,
) {
  const batch = readQueue(storage, user);
  if (!batch.length || !active()) return;
  await send(batch);
  if (!active()) return;
  const sent = new Set(batch.map((row) => row.id));
  storage.setItem(
    queueKey(user),
    JSON.stringify(readQueue(storage, user).filter((row) => !sent.has(row.id))),
  );
}
export function summarizeProgress(rows: ProgressRow[]) {
  const unique = [...new Map(rows.map((row) => [row.id, row])).values()];
  const days = [
    ...new Set(unique.map((row) => darDate(new Date(row.created_at)))),
  ].sort();
  let streak = 0;
  const today = darDate();
  let cursor = new Date(`${today}T12:00:00Z`);
  if (!days.includes(today)) cursor = new Date(cursor.getTime() - 86400000);
  while (days.includes(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor = new Date(cursor.getTime() - 86400000);
  }
  return {
    count: unique.length,
    xp: unique.reduce(
      (sum, row) =>
        sum + 14 + Math.round(row.score / 8) + (row.score >= 80 ? 8 : 0),
      0,
    ),
    streak,
    average: unique.length
      ? Math.round(
          unique.reduce((sum, row) => sum + row.score, 0) / unique.length,
        )
      : 0,
  };
}
