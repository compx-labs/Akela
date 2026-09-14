import { describe, expect, it } from "vitest";
import {
  isEligible,
  scoreAgent,
  scoreConsistency,
  utcDay,
  windowStartMs,
  type ScoreSnapshot,
  type WindowId,
} from "./index";

const NOW = new Date("2026-09-14T12:00:00.000Z");
const NOW_MS = NOW.getTime();
const DAY = 86_400_000;
const CLAIMED_OLD = new Date(NOW_MS - 30 * DAY).toISOString();

function emptyWindows(): ScoreSnapshot["windows"] {
  return {
    "24h": { volumeUsd: 0, activeDays: 0 },
    "7d": { volumeUsd: 0, activeDays: 0 },
    "30d": { volumeUsd: 0, activeDays: 0 },
    since_registration: { volumeUsd: 0, activeDays: 0 },
  };
}

function metricsFor(
  timestamps: number[],
  volumes: Partial<Record<WindowId, number>>,
  claimedAt: string,
): ScoreSnapshot["windows"] {
  const claimedAtMs = Date.parse(claimedAt);
  const windows = emptyWindows();
  const ids: WindowId[] = ["24h", "7d", "30d", "since_registration"];
  for (const windowId of ids) {
    const start = windowStartMs(windowId, claimedAtMs, NOW_MS);
    const days = new Set(timestamps.filter((ms) => ms >= start && ms <= NOW_MS).map(utcDay));
    windows[windowId] = { volumeUsd: volumes[windowId] ?? 0, activeDays: days.size };
  }
  return windows;
}

function snapshot(partial: Partial<ScoreSnapshot> & { txTimestamps: number[]; claimedAt?: string }): ScoreSnapshot {
  const claimedAt = partial.claimedAt ?? CLAIMED_OLD;
  const last = partial.txTimestamps[partial.txTimestamps.length - 1];
  const windows = partial.windows ?? metricsFor(partial.txTimestamps, {}, claimedAt);
  return {
    capturedAt: NOW.toISOString(),
    equityUsd: 10_000,
    peakEquityUsd: 10_000,
    lastSeenAt: last ? new Date(last).toISOString() : null,
    longestQuietGapDays: 0,
    counterparties: 8,
    activeDays: [...new Set(partial.txTimestamps.map(utcDay))].sort(),
    ...partial,
    windows,
  };
}

describe("scoreConsistency", () => {
  it("scores empty activity near the floor", () => {
    const c = scoreConsistency({
      windowId: "7d",
      activeDays: 0,
      timestamps: [],
      lastSeenAt: null,
      claimedAtMs: Date.parse(CLAIMED_OLD),
      nowMs: NOW_MS,
    });
    expect(c).toBeGreaterThanOrEqual(0.5);
    expect(c).toBeLessThan(0.7);
  });

  it("gives steady daily cadence C > 1 on 7d", () => {
    const timestamps = Array.from({ length: 7 }, (_, i) => NOW_MS - (6 - i) * DAY);
    const c = scoreConsistency({
      windowId: "7d",
      activeDays: 7,
      timestamps,
      lastSeenAt: new Date(NOW_MS).toISOString(),
      claimedAtMs: Date.parse(CLAIMED_OLD),
      nowMs: NOW_MS,
    });
    expect(c).toBeGreaterThan(1);
    expect(c).toBeLessThanOrEqual(1.2);
  });

  it("damps a one-day binge below 1.0 on 7d", () => {
    const timestamps = Array.from({ length: 20 }, (_, i) => NOW_MS - i * 60_000);
    const c = scoreConsistency({
      windowId: "7d",
      activeDays: 1,
      timestamps,
      lastSeenAt: new Date(NOW_MS).toISOString(),
      claimedAtMs: Date.parse(CLAIMED_OLD),
      nowMs: NOW_MS,
    });
    expect(c).toBeLessThan(1);
    expect(c).toBeGreaterThanOrEqual(0.5);
  });

  it("puts abandoned agents near 0.50 on 30d", () => {
    const seen = NOW_MS - 20 * DAY;
    const c = scoreConsistency({
      windowId: "30d",
      activeDays: 1,
      timestamps: [seen],
      lastSeenAt: new Date(seen).toISOString(),
      claimedAtMs: Date.parse(CLAIMED_OLD),
      nowMs: NOW_MS,
    });
    expect(c).toBeGreaterThanOrEqual(0.5);
    expect(c).toBeLessThan(0.7);
  });
});

describe("scoreAgent", () => {
  it("returns zeros-ish value and ineligible for an empty wallet", () => {
    const empty = snapshot({
      txTimestamps: [],
      equityUsd: 0,
      peakEquityUsd: 0,
      lastSeenAt: null,
      counterparties: 0,
      windows: emptyWindows(),
    });
    const scored = scoreAgent(empty, { claimedAt: CLAIMED_OLD, now: NOW });
    expect(scored.windows["7d"].valueUsd).toBe(0);
    expect(scored.windows["7d"].eligible).toBe(false);
    expect(scored.windows["7d"].consistency).toBeGreaterThanOrEqual(0.5);
  });

  it("scores a steady agent with C > 1, Score > 0, eligible", () => {
    const timestamps = Array.from({ length: 7 }, (_, i) => NOW_MS - (6 - i) * DAY);
    const agent = snapshot({
      txTimestamps: timestamps,
      windows: metricsFor(timestamps, { "24h": 400, "7d": 4_000, "30d": 12_000, since_registration: 12_000 }, CLAIMED_OLD),
    });
    const scored = scoreAgent(agent, { claimedAt: CLAIMED_OLD, now: NOW });
    const row = scored.windows["7d"];
    expect(row.consistency).toBeGreaterThan(1);
    expect(row.score).toBeGreaterThan(0);
    expect(row.activity).toBeGreaterThan(0);
    expect(row.usefulness).toBeGreaterThan(0);
    expect(row.trust).toBeGreaterThan(0);
    expect(row.eligible).toBe(true);
    expect(row.valueUsd).toBeGreaterThan(0);
  });

  it("marks too-thin dust ineligible", () => {
    const timestamps = [NOW_MS];
    const claimedAt = CLAIMED_OLD;
    const agent = snapshot({
      txTimestamps: timestamps,
      equityUsd: 5,
      peakEquityUsd: 5,
      counterparties: 1,
      windows: metricsFor(timestamps, { "24h": 1, "7d": 1, "30d": 1, since_registration: 1 }, claimedAt),
    });
    expect(isEligible(agent, Date.parse(claimedAt), NOW_MS)).toBe(false);
    expect(scoreAgent(agent, { claimedAt, now: NOW }).windows["7d"].eligible).toBe(false);
  });
});
