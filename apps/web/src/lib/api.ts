import { modelValue } from "@akela/core";
import type { AgentStatus, AgentSummary, BoardId, Metric, MetricId, WindowId } from "../types";
import { SPARK } from "./chart";

const API_BASE = (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") || "/api";

export type BoardResponse = {
  board: BoardId;
  window: WindowId | "since_registration";
  agents: ApiAgentRow[];
};

export type ApiAgentRow = {
  id: string;
  name: string;
  address: string;
  valueUsd: number;
  score: number;
  activity: number;
  usefulness: number;
  trust: number;
  rising7d: number;
  consistency: number;
  heldUsd: number;
  volumeUsd: number;
  lastSeenAt: string | null;
  eligible: boolean;
};

export type ApiAgentDetail = {
  id: string;
  createdAt: string;
  claims: Array<{ chain: string; name: string; address: string }>;
  snapshots: Array<{
    capturedAt: string;
    equityUsd: number;
    lastSeenAt: string | null;
    windows: Record<string, { volumeUsd: number; activeDays: number }>;
  }>;
  scores: Array<{
    windowId: string;
    valueUsd: number;
    consistency: number;
    score: number;
    activity: number;
    usefulness: number;
    trust: number;
    rising7d: number;
    eligible: boolean;
  }>;
};

export type FormulaResponse = {
  disclaimer: string;
  value: {
    a: number;
    b: number;
    formula: string;
    consistency: { min: number; max: number; mix?: Record<string, number>; formula?: string };
  };
  score: { formula: string; weights: { activity: number; usefulness: number; trust: number } };
  floors: Record<string, number | string>;
};

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    throw new Error(`${path} failed ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export function fetchBoard(board: BoardId, windowId: WindowId): Promise<BoardResponse> {
  return getJson(`/v1/agents?board=${board}&window=${windowId}`);
}

export function fetchAgent(idOrName: string): Promise<ApiAgentDetail> {
  return getJson(`/v1/agents/${encodeURIComponent(idOrName)}`);
}

export function fetchFormula(): Promise<FormulaResponse> {
  return getJson("/formula");
}

const MS_HOUR = 3_600_000;
const MS_DAY = 86_400_000;

export function statusFromLastSeen(lastSeenAt: string | null): AgentStatus {
  if (!lastSeenAt) {
    return "idle";
  }
  const age = Date.now() - Date.parse(lastSeenAt);
  if (!Number.isFinite(age) || age > 14 * MS_DAY) {
    return "dead";
  }
  if (age > 2 * MS_DAY) {
    return "idle";
  }
  return "live";
}

export function lastSeenLabel(lastSeenAt: string | null): string {
  if (!lastSeenAt) {
    return "n/a";
  }
  const age = Date.now() - Date.parse(lastSeenAt);
  if (!Number.isFinite(age) || age < 0) {
    return "n/a";
  }
  if (age < MS_HOUR) {
    return `${Math.max(1, Math.round(age / 60_000))}m ago`;
  }
  if (age < MS_DAY) {
    return `${Math.round(age / MS_HOUR)}h ago`;
  }
  return `${Math.round(age / MS_DAY)}d ago`;
}

export function toAgentSummary(row: ApiAgentRow): AgentSummary {
  return {
    id: row.id,
    name: row.name,
    address: row.address,
    chains: ["algorand"],
    valueUsd: row.valueUsd,
    score: row.score,
    activity: row.activity,
    usefulness: row.usefulness,
    trust: row.trust,
    held: row.heldUsd,
    volumeUsd: row.volumeUsd,
    rising7d: row.rising7d,
    consistency: row.consistency,
    status: statusFromLastSeen(row.lastSeenAt),
    lastSeenAt: row.lastSeenAt,
    eligible: row.eligible,
  };
}

export function rankedAgents(agents: AgentSummary[], board: BoardId): AgentSummary[] {
  const key: Record<BoardId, keyof AgentSummary> = {
    value: "valueUsd",
    score: "score",
    rising: "rising7d",
    trusted: "trust",
    active: "activity",
  };
  const field = key[board];
  return [...agents].sort((a, b) => Number(b[field]) - Number(a[field]));
}

const PANE_META: Array<{ id: MetricId; label: string; unit: Metric["unit"]; field: keyof AgentSummary }> = [
  { id: "value", label: "Akela Value", unit: "usd", field: "valueUsd" },
  { id: "held", label: "Held / Trust", unit: "usd", field: "held" },
  { id: "volume", label: "Volume", unit: "usd", field: "volumeUsd" },
  { id: "score", label: "Akela Score", unit: "score", field: "score" },
  { id: "rising", label: "Rising", unit: "delta", field: "rising7d" },
  { id: "consistency", label: "Consistency", unit: "multiplier", field: "consistency" },
  { id: "usefulness", label: "Usefulness", unit: "score", field: "usefulness" },
];

export function boardMetrics(agents: AgentSummary[]): Metric[] {
  const leader = agents[0];
  return PANE_META.map((meta) => {
    const current = meta.id === "rising" ? risingPct(leader?.rising7d ?? 0) : Number(leader?.[meta.field] ?? 0);
    const points = agents.map((agent) => ({ t: agent.name, v: metricPoint(agent, meta.id) }));
    const series = points.length === 1 ? [points[0], points[0]] : points;
    return {
      id: meta.id,
      label: meta.label,
      unit: meta.unit,
      current,
      spark: SPARK[meta.id],
      series: { "24h": series, "7d": series, "30d": series },
    };
  });
}

function metricPoint(agent: AgentSummary, id: MetricId): number {
  if (id === "value") {
    return agent.valueUsd;
  }
  if (id === "held" || id === "trust") {
    return agent.held;
  }
  if (id === "volume") {
    return agent.volumeUsd;
  }
  if (id === "score") {
    return agent.score;
  }
  if (id === "rising") {
    return risingPct(agent.rising7d);
  }
  if (id === "consistency") {
    return agent.consistency;
  }
  if (id === "activity") {
    return agent.activity;
  }
  return agent.usefulness;
}

export function risingPct(ratio: number): number {
  return (ratio - 1) * 100;
}

export function sparkDisplay(values: number[], fallback: number): number[] {
  if (values.length >= 2) {
    return values;
  }
  const current = values[0] ?? fallback;
  return [current, current];
}

export function sparkFromSnapshots(
  detail: ApiAgentDetail | undefined,
  kind: "value" | "volume" | "score",
  windowId: "7d" | "30d",
  fallback: number,
): number[] {
  if (kind === "score") {
    return sparkDisplay([], fallback);
  }
  const snaps = [...(detail?.snapshots ?? [])].sort(
    (a, b) => Date.parse(a.capturedAt) - Date.parse(b.capturedAt),
  );
  if (snaps.length < 2) {
    return sparkDisplay([], fallback);
  }
  const consistency = detail?.scores.find((row) => row.windowId === windowId)?.consistency ?? 1;
  return snaps.map((snap) => {
    const volume = snap.windows[windowId]?.volumeUsd ?? 0;
    if (kind === "volume") {
      return volume;
    }
    return modelValue(snap.equityUsd, volume, consistency);
  });
}
