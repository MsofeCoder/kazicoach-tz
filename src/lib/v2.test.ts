import { beforeEach, describe, expect, it } from "vitest";
import {
  enqueue,
  flushQueue,
  progressRow,
  queueKey,
  readQueue,
  summarizeProgress,
} from "./sync";
import { localCloudConfig } from "./cloud";
import { activePackage, billing } from "./plans";
import { loadTrial, trialAvailable } from "./trial";
import { loadState, saveState } from "./storage";
import type { Attempt } from "../types";

const attempt: Attempt = {
  id: "20000000-0000-4000-8000-000000000001",
  questionId: "q1",
  category: "role",
  mode: "oral",
  answer: "PRIVATE ANSWER",
  score: 80,
  matched: ["PRIVATE"],
  missed: ["PRIVATE"],
  createdAt: "2026-10-19T10:00:00Z",
  durationSeconds: 20,
};
const storage = {
  map: new Map<string, string>(),
  getItem(key: string) {
    return this.map.get(key) ?? null;
  },
  setItem(key: string, value: string) {
    this.map.set(key, value);
  },
  removeItem(key: string) {
    this.map.delete(key);
  },
};
beforeEach(() => storage.map.clear());
describe("private workspace compatibility and explicit sync payloads", () => {
  it("reads and preserves v1 answers and materials without migrating storage keys", () => {
    Object.defineProperty(globalThis, "localStorage", {
      value: storage,
      configurable: true,
    });
    storage.setItem(
      "kazicoach-tz:v1",
      JSON.stringify({
        version: 1,
        attempts: [attempt],
        materials: [{ id: "cv", extractedText: "PRIVATE CV" }],
        xp: 32,
      }),
    );
    const state = loadState();
    expect(state.attempts[0].answer).toBe("PRIVATE ANSWER");
    expect(state.materials[0].extractedText).toBe("PRIVATE CV");
    saveState(state);
    expect(storage.map.size).toBe(1);
    expect(loadState()).toEqual(state);
  });
  it("syncs only an explicit allowlist, never text or derived self-awarded XP", () => {
    const row = progressRow("A", attempt);
    expect(Object.keys(row).sort()).toEqual(
      [
        "user_id",
        "id",
        "question_id",
        "category",
        "mode",
        "score",
        "duration_seconds",
        "created_at",
      ].sort(),
    );
    expect(JSON.stringify(row)).not.toContain("PRIVATE");
  });
  it("deduplicates immutable IDs with first queued value winning", () => {
    enqueue(storage, "A", [attempt]);
    enqueue(storage, "A", [{ ...attempt, score: 100 }]);
    expect(readQueue(storage, "A")).toHaveLength(1);
    expect(readQueue(storage, "A")[0].score).toBe(80);
  });
  it("separates queues across accounts and ignores mismatched owners", () => {
    enqueue(storage, "A", [attempt]);
    expect(readQueue(storage, "B")).toEqual([]);
    storage.setItem(queueKey("B"), storage.getItem(queueKey("A"))!);
    expect(readQueue(storage, "B")).toEqual([]);
  });
  it("retains failed uploads and acknowledges only successfully sent IDs", async () => {
    enqueue(storage, "A", [attempt]);
    await expect(
      flushQueue(storage, "A", async () => {
        throw new Error("offline");
      }),
    ).rejects.toThrow();
    expect(readQueue(storage, "A")).toHaveLength(1);
    await flushQueue(storage, "A", async () => {
      enqueue(storage, "A", [{ ...attempt, id: "new" }]);
    });
    expect(readQueue(storage, "A").map((row) => row.id)).toEqual(["new"]);
  });
  it("does not send after consent is revoked or acknowledge a switched account", async () => {
    enqueue(storage, "A", [attempt]);
    let sends = 0;
    await flushQueue(
      storage,
      "A",
      async () => {
        sends++;
      },
      () => false,
    );
    expect(sends).toBe(0);
    let active = true;
    await flushQueue(
      storage,
      "A",
      async () => {
        active = false;
      },
      () => active,
    );
    expect(readQueue(storage, "A")).toHaveLength(1);
  });
  it("fails visibly instead of silently discarding a corrupt or full queue", () => {
    storage.setItem(queueKey("A"), "broken");
    expect(() => readQueue(storage, "A")).toThrow();
    storage.map.clear();
    expect(() =>
      enqueue(
        storage,
        "A",
        Array.from({ length: 1001 }, (_, i) => ({ ...attempt, id: String(i) })),
      ),
    ).toThrow(/full/);
  });
  it("derives gamification from unique attempts without double XP on replay", () => {
    const row = progressRow("A", attempt);
    expect(summarizeProgress([row, row]).count).toBe(1);
    expect(summarizeProgress([row, row]).xp).toBe(32);
  });
});
describe("entitlement and local connection boundaries", () => {
  it("expires at the boundary and rejects future or absent grants", () => {
    const entitlement = {
      package_id: "basic" as const,
      starts_at: "2026-10-19T00:00:00Z",
      expires_at: "2026-10-26T00:00:00Z",
    };
    expect(activePackage(entitlement, Date.parse(entitlement.starts_at))).toBe(
      "basic",
    );
    expect(
      activePackage(entitlement, Date.parse(entitlement.expires_at)),
    ).toBeNull();
    expect(activePackage(entitlement, 0)).toBeNull();
    expect(activePackage(null)).toBeNull();
    expect(activePackage({...entitlement,expires_at:'invalid'})).toBeNull();
  });
  it("never activates billing during review", async () => {
    expect(billing.enabled).toBe(false);
    await expect(billing.requestActivation()).rejects.toThrow(/disabled/);
  });
  it("requires both loopback browser and endpoint plus explicit opt in", () => {
    const anon = `a.${btoa(JSON.stringify({ role: "anon" }))}.c`;
    expect(
      localCloudConfig("true", "http://127.0.0.1:57421", anon, "localhost"),
    ).toBeTruthy();
    expect(
      localCloudConfig(undefined, "http://127.0.0.1:57421", anon, "localhost"),
    ).toBeNull();
    expect(
      localCloudConfig(
        "true",
        "https://example.supabase.co",
        anon,
        "localhost",
      ),
    ).toBeNull();
    expect(
      localCloudConfig(
        "true",
        "http://127.0.0.1:57421",
        anon,
        "public.example",
      ),
    ).toBeNull();
    expect(
      localCloudConfig(
        "true",
        "http://user:pass@127.0.0.1:57421",
        anon,
        "localhost",
      ),
    ).toBeNull();
  });
  it("rejects privileged or malformed browser keys", () => {
    for (const key of [
      "sb_secret_test",
      `a.${btoa(JSON.stringify({ role: "service_role" }))}.c`,
      "invalid",
    ])
      expect(
        localCloudConfig("true", "http://127.0.0.1:57421", key, "localhost"),
      ).toBeNull();
  });
  it("offers exactly five scored guest attempts and preserves the count independently of workspace reset", () => {
    expect(trialAvailable(4, 5, false)).toBe(true);
    expect(trialAvailable(5, 5, false)).toBe(false);
    expect(trialAvailable(500, 5, true)).toBe(true);
    storage.setItem("kazicoach-tz:v2:trial-used", "5");
    storage.removeItem("kazicoach-tz:v1");
    expect(loadTrial(storage)).toBe(5);
    storage.setItem("kazicoach-tz:v2:trial-used", "NaN");
    expect(loadTrial(storage)).toBe(0);
  });
});
