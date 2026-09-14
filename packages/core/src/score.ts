import type { WindowId } from "./knobs";
import { CONSISTENCY_MAX, CONSISTENCY_MIN, SCORE_WEIGHTS, modelValue } from "./knobs";

export const CONSISTENCY_MIX = {
  coverage: 0.4,
  gap: 0.25,
  cadence: 0.25,
  lastSeen: 0.1,
} as const;

export const CONSISTENCY_CURVE =
  "C = clip(0.50, 1.20, 0.50 + 0.70 × (0.40 coverage + 0.25 gap + 0.25 cadence + 0.10 lastSeen))";

export const ACTIVITY_TX_SATURATION = 500;
export const ACTIVITY_VOLUME_SATURATION_USD = 10_000;
export const TRUST_EQUITY_SATURATION_USD = 100_000;
export const TURNOVER_CAP = 2;
export const LAST_SEEN_STALE_DAYS = 7;
export const ACTIVITY_LAST_SEEN_DAMP = 0.3;

export const ELIGIBILITY = {
  tooNewDays: 3,
  minActiveDays7d: 2,
  minEquityUsd: 10,
  minVolume7dUsd: 5,
  staleAfterDays: 14,
} as const;

const MS_DAY = 86_400_000;

export type ScoreWindowMetrics = {
  volumeUsd: number;
  activeDays: number;
};

/** Snapshot fields the scorer needs. Structurally compatible with @akela/indexers Snapshot. */
export type ScoreSnapshot = {
  capturedAt: string;
  equityUsd: number;
  peakEquityUsd: number;
  lastSeenAt: string | null;
  longestQuietGapDays: number;
  counterparties: number;
  windows: Record<WindowId, ScoreWindowMetrics>;
  activeDays: string[];
  txTimestamps: number[];
};

export type ScoreContext = {
  claimedAt: string;
  now?: Date;
};

export type WindowScore = {
  windowId: WindowId;
  valueUsd: number;
  consistency: number;
  score: number;
  activity: number;
  usefulness: number;
  trust: number;
  rising7d: number;
  eligible: boolean;
};

export type AgentScore = {
  windows: Record<WindowId, WindowScore>;
};

const WINDOW_IDS: WindowId[] = ["24h", "7d", "30d", "since_registration"];

export function clip(min: number, max: number, value: number): number {
  return Math.min(max, Math.max(min, value));
}

export function utcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function calendarDaysBetween(fromMs: number, toMs: number): number {
  const start = Date.parse(`${utcDay(fromMs)}T00:00:00.000Z`);
  const end = Date.parse(`${utcDay(toMs)}T00:00:00.000Z`);
  return Math.max(0, Math.round((end - start) / MS_DAY));
}

export function windowLengthDays(windowId: WindowId, claimedAtMs: number, nowMs: number): number {
  if (windowId === "24h") {
    return 1;
  }
  if (windowId === "7d") {
    return 7;
  }
  if (windowId === "30d") {
    return 30;
  }
  return Math.max(1, calendarDaysBetween(claimedAtMs, nowMs) || 1);
}

export function windowStartMs(windowId: WindowId, claimedAtMs: number, nowMs: number): number {
  if (windowId === "since_registration") {
    return claimedAtMs;
  }
  return nowMs - windowLengthDays(windowId, claimedAtMs, nowMs) * MS_DAY;
}

export function lastSeenScore(lastSeenAt: string | null, nowMs: number): number {
  if (!lastSeenAt) {
    return 0;
  }
  const seenMs = Date.parse(lastSeenAt);
  if (!Number.isFinite(seenMs)) {
    return 0;
  }
  const hours = (nowMs - seenMs) / 3_600_000;
  if (hours <= 24) {
    return 1;
  }
  if (hours >= LAST_SEEN_STALE_DAYS * 24) {
    return 0;
  }
  return 1 - (hours - 24) / (24 * (LAST_SEEN_STALE_DAYS - 1));
}

export function cadenceScore(timestamps: number[]): number {
  if (timestamps.length < 2) {
    return 0.5;
  }
  const sorted = [...timestamps].sort((a, b) => a - b);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i] - sorted[i - 1];
    if (gap > 0) {
      gaps.push(gap);
    }
  }
  if (gaps.length === 0) {
    return 0.5;
  }
  const mean = gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length;
  if (mean <= 0) {
    return 0.5;
  }
  const variance = gaps.reduce((sum, gap) => sum + (gap - mean) ** 2, 0) / gaps.length;
  const cv = Math.sqrt(variance) / mean;
  return 1 / (1 + cv);
}

export function longestQuietGapDays(
  timestamps: number[],
  windowStartMsValue: number,
  nowMs: number,
): number {
  const days = [...new Set(timestamps.map(utcDay))].sort();
  const windowDays = Math.max(1, calendarDaysBetween(windowStartMsValue, nowMs) || 1);
  if (days.length === 0) {
    return windowDays;
  }
  const startDay = utcDay(windowStartMsValue);
  const nowDay = utcDay(nowMs);
  let longest = calendarDaysBetween(Date.parse(`${startDay}T00:00:00.000Z`), Date.parse(`${days[0]}T00:00:00.000Z`));
  for (let i = 1; i < days.length; i++) {
    const gap =
      calendarDaysBetween(Date.parse(`${days[i - 1]}T00:00:00.000Z`), Date.parse(`${days[i]}T00:00:00.000Z`)) - 1;
    if (gap > longest) {
      longest = gap;
    }
  }
  const trailing = calendarDaysBetween(
    Date.parse(`${days[days.length - 1]}T00:00:00.000Z`),
    Date.parse(`${nowDay}T00:00:00.000Z`),
  );
  return Math.max(longest, trailing, 0);
}

export type ConsistencyInput = {
  windowId: WindowId;
  activeDays: number;
  timestamps: number[];
  lastSeenAt: string | null;
  claimedAtMs: number;
  nowMs: number;
};

export function scoreConsistency(input: ConsistencyInput): number {
  const days = windowLengthDays(input.windowId, input.claimedAtMs, input.nowMs);
  const start = windowStartMs(input.windowId, input.claimedAtMs, input.nowMs);
  const coverage = clip(0, 1, days === 0 ? 0 : input.activeDays / days);
  const gapDays = longestQuietGapDays(input.timestamps, start, input.nowMs);
  const gap = 1 - Math.min(1, gapDays / (days / 2));
  const cadence = cadenceScore(input.timestamps);
  const seen = lastSeenScore(input.lastSeenAt, input.nowMs);
  const mix =
    CONSISTENCY_MIX.coverage * coverage +
    CONSISTENCY_MIX.gap * gap +
    CONSISTENCY_MIX.cadence * cadence +
    CONSISTENCY_MIX.lastSeen * seen;
  return clip(CONSISTENCY_MIN, CONSISTENCY_MAX, CONSISTENCY_MIN + (CONSISTENCY_MAX - CONSISTENCY_MIN) * mix);
}

function logCap(value: number, saturation: number): number {
  return clip(0, 1, Math.log10(1 + Math.max(0, value)) / Math.log10(1 + saturation));
}

function timestampsInWindow(timestamps: number[], startMs: number, nowMs: number): number[] {
  return timestamps.filter((ms) => ms >= startMs && ms <= nowMs);
}

export function isEligible(snapshot: ScoreSnapshot, claimedAtMs: number, nowMs: number): boolean {
  const claimAgeDays = calendarDaysBetween(claimedAtMs, nowMs);
  const active7d = snapshot.windows["7d"]?.activeDays ?? 0;
  const volume7d = snapshot.windows["7d"]?.volumeUsd ?? 0;
  const tooNew = claimAgeDays < ELIGIBILITY.tooNewDays && active7d < ELIGIBILITY.minActiveDays7d;
  const tooThin = snapshot.equityUsd < ELIGIBILITY.minEquityUsd && volume7d < ELIGIBILITY.minVolume7dUsd;
  const lastSeenMs = snapshot.lastSeenAt ? Date.parse(snapshot.lastSeenAt) : Number.NaN;
  const stale = !Number.isFinite(lastSeenMs) || nowMs - lastSeenMs >= ELIGIBILITY.staleAfterDays * MS_DAY;
  return !tooNew && !tooThin && !stale;
}

function rising7d(snapshot: ScoreSnapshot): number {
  const vol7 = snapshot.windows["7d"]?.volumeUsd ?? 0;
  const vol30 = snapshot.windows["30d"]?.volumeUsd ?? 0;
  return vol7 / 7 / Math.max(vol30 / 30, 0.01);
}

function pillarActivity(
  coverage: number,
  txCount: number,
  volumeUsd: number,
  counterparties: number,
  seen: number,
): number {
  const raw =
    0.4 * coverage +
    0.3 * logCap(txCount, ACTIVITY_TX_SATURATION) +
    0.2 * logCap(volumeUsd, ACTIVITY_VOLUME_SATURATION_USD) +
    0.1 * Math.min(counterparties / 20, 1);
  return clip(0, 100, 100 * raw * (1 - ACTIVITY_LAST_SEEN_DAMP + ACTIVITY_LAST_SEEN_DAMP * seen));
}

function pillarUsefulness(consistency: number, volumeUsd: number, equityUsd: number): number {
  const sleeve = clip(0, 1, (consistency - CONSISTENCY_MIN) / (CONSISTENCY_MAX - CONSISTENCY_MIN));
  const turnover = clip(0, TURNOVER_CAP, volumeUsd / Math.max(equityUsd, 1)) / TURNOVER_CAP;
  return clip(0, 100, 100 * (0.5 * sleeve + 0.5 * turnover));
}

function pillarTrust(equityUsd: number, peakEquityUsd: number): number {
  const held = logCap(equityUsd, TRUST_EQUITY_SATURATION_USD);
  const peak = Math.max(peakEquityUsd, equityUsd, 0);
  const drawdown = peak === 0 ? 0 : equityUsd / peak;
  return clip(0, 100, 100 * (0.7 * held + 0.3 * clip(0, 1, drawdown)));
}

export function scoreAgent(snapshot: ScoreSnapshot, ctx: ScoreContext): AgentScore {
  const now = ctx.now ?? new Date(snapshot.capturedAt);
  const nowMs = now.getTime();
  const claimedAtMs = Date.parse(ctx.claimedAt);
  const eligible = isEligible(snapshot, Number.isFinite(claimedAtMs) ? claimedAtMs : nowMs, nowMs);
  const rising = rising7d(snapshot);
  const seen = lastSeenScore(snapshot.lastSeenAt, nowMs);
  const windows = {} as Record<WindowId, WindowScore>;

  for (const windowId of WINDOW_IDS) {
    const metrics = snapshot.windows[windowId] ?? { volumeUsd: 0, activeDays: 0 };
    const days = windowLengthDays(windowId, claimedAtMs, nowMs);
    const start = windowStartMs(windowId, claimedAtMs, nowMs);
    const inWindow = timestampsInWindow(snapshot.txTimestamps, start, nowMs);
    const consistency = scoreConsistency({
      windowId,
      activeDays: metrics.activeDays,
      timestamps: inWindow,
      lastSeenAt: snapshot.lastSeenAt,
      claimedAtMs,
      nowMs,
    });
    const coverage = clip(0, 1, days === 0 ? 0 : metrics.activeDays / days);
    const activity = pillarActivity(coverage, inWindow.length, metrics.volumeUsd, snapshot.counterparties, seen);
    const usefulness = pillarUsefulness(consistency, metrics.volumeUsd, snapshot.equityUsd);
    const trust = pillarTrust(snapshot.equityUsd, snapshot.peakEquityUsd);
    const score =
      SCORE_WEIGHTS.activity * activity + SCORE_WEIGHTS.usefulness * usefulness + SCORE_WEIGHTS.trust * trust;
    windows[windowId] = {
      windowId,
      valueUsd: Math.max(0, modelValue(snapshot.equityUsd, metrics.volumeUsd, consistency)),
      consistency,
      score,
      activity,
      usefulness,
      trust,
      rising7d: rising,
      eligible,
    };
  }

  return { windows };
}
