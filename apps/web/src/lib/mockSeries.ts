import type { AgentSummary, BoardId, Metric, MetricId, SeriesPoint, WindowId } from "../types";

const WINDOWS: WindowId[] = ["24h", "7d", "30d"];

export const SPARK: Record<MetricId, string> = {
  value: "#ffb000",
  held: "#ff7a1a",
  trust: "#ff7a1a",
  volume: "#3ecfff",
  score: "#ececec",
  rising: "#3cff6b",
  consistency: "#ffb000",
  usefulness: "#3ecfff",
  activity: "#3cff6b",
};

function makeSeries(seed: number, points: number, base: number, amplitude: number): SeriesPoint[] {
  const out: SeriesPoint[] = [];
  for (let i = 0; i < points; i += 1) {
    const drift = (i / points) * amplitude * 0.35;
    const wave = Math.sin(i / 2.4 + seed) * amplitude;
    const noise = Math.sin(i * 1.7 + seed * 2) * amplitude * 0.18;
    const v = Math.max(0, base + drift + wave + noise);
    out.push({ t: `t${i + 1}`, v: Math.round(v * 100) / 100 });
  }
  return out;
}

function windowsFor(seed: number, base: number, amplitude: number): Record<WindowId, SeriesPoint[]> {
  return {
    "24h": makeSeries(seed, 24, base, amplitude),
    "7d": makeSeries(seed + 1, 14, base * 0.96, amplitude * 1.1),
    "30d": makeSeries(seed + 2, 30, base * 0.9, amplitude * 1.25),
  };
}

const METRICS: Metric[] = [
  {
    id: "value",
    label: "Akela Value",
    unit: "usd",
    current: 18420,
    series: windowsFor(0.4, 16200, 2200),
    spark: SPARK.value,
  },
  {
    id: "score",
    label: "Akela Score",
    unit: "score",
    current: 76.4,
    series: windowsFor(1.1, 68, 8),
    spark: SPARK.score,
  },
  {
    id: "activity",
    label: "Activity",
    unit: "count",
    current: 148,
    series: windowsFor(2.2, 110, 28),
    spark: SPARK.activity,
  },
  {
    id: "usefulness",
    label: "Usefulness",
    unit: "score",
    current: 81.2,
    series: windowsFor(0.8, 72, 9),
    spark: SPARK.usefulness,
  },
  {
    id: "trust",
    label: "Trust (held)",
    unit: "usd",
    current: 12640,
    series: windowsFor(1.6, 10800, 1400),
    spark: SPARK.trust,
  },
  {
    id: "rising",
    label: "Rising",
    unit: "delta",
    current: 12.8,
    series: windowsFor(2.8, 4, 6),
    spark: SPARK.rising,
  },
  {
    id: "consistency",
    label: "Consistency",
    unit: "multiplier",
    current: 1.08,
    series: windowsFor(0.2, 0.92, 0.14),
    spark: SPARK.consistency,
  },
  {
    id: "held",
    label: "Held / Trust",
    unit: "usd",
    current: 12640,
    series: windowsFor(1.9, 10800, 1400),
    spark: SPARK.held,
  },
  {
    id: "volume",
    label: "Volume",
    unit: "usd",
    current: 7340,
    series: windowsFor(3.1, 6100, 1100),
    spark: SPARK.volume,
  },
];

export const MOCK_AGENTS: AgentSummary[] = [
  {
    id: "bot",
    name: "bot.akela.algo",
    chains: ["algorand", "base"],
    valueUsd: 18420,
    score: 76.4,
    activity: 148,
    usefulness: 81.2,
    trust: 9420,
    held: 12640,
    volumeUsd: 7340,
    rising7d: 12.8,
    consistency: 1.08,
    status: "live",
  },
  {
    id: "scout",
    name: "scout.akela.sol",
    chains: ["solana", "algorand"],
    valueUsd: 11350,
    score: 69.1,
    activity: 96,
    usefulness: 74.0,
    trust: 6100,
    held: 7820,
    volumeUsd: 4210,
    rising7d: 4.2,
    consistency: 0.97,
    status: "live",
  },
  {
    id: "hex",
    name: "hex.base.eth",
    chains: ["base"],
    valueUsd: 9820,
    score: 71.8,
    activity: 121,
    usefulness: 77.4,
    trust: 5400,
    held: 6910,
    volumeUsd: 3880,
    rising7d: 8.1,
    consistency: 1.02,
    status: "live",
  },
  {
    id: "rune",
    name: "rune.akela.algo",
    chains: ["algorand", "solana"],
    valueUsd: 7410,
    score: 64.3,
    activity: 88,
    usefulness: 69.5,
    trust: 4280,
    held: 5120,
    volumeUsd: 2740,
    rising7d: -1.4,
    consistency: 0.91,
    status: "idle",
  },
  {
    id: "nova",
    name: "nova.akela.sol",
    chains: ["solana"],
    valueUsd: 6230,
    score: 67.9,
    activity: 102,
    usefulness: 72.1,
    trust: 3910,
    held: 4480,
    volumeUsd: 2210,
    rising7d: 6.6,
    consistency: 0.99,
    status: "live",
  },
  {
    id: "ash",
    name: "ash.akela.algo",
    chains: ["algorand", "base"],
    valueUsd: 4180,
    score: 58.2,
    activity: 64,
    usefulness: 61.0,
    trust: 2740,
    held: 3310,
    volumeUsd: 1490,
    rising7d: 2.3,
    consistency: 0.86,
    status: "idle",
  },
  {
    id: "drift",
    name: "drift.base.eth",
    chains: ["base"],
    valueUsd: 3560,
    score: 55.4,
    activity: 71,
    usefulness: 59.8,
    trust: 2210,
    held: 2680,
    volumeUsd: 1320,
    rising7d: 9.4,
    consistency: 0.88,
    status: "idle",
  },
  {
    id: "kiln",
    name: "kiln.akela.algo",
    chains: ["algorand", "solana"],
    valueUsd: 2190,
    score: 51.7,
    activity: 43,
    usefulness: 54.6,
    trust: 1680,
    held: 1910,
    volumeUsd: 740,
    rising7d: -3.1,
    consistency: 0.81,
    status: "dead",
  },
  {
    id: "pike",
    name: "pike.akela.sol",
    chains: ["solana", "base"],
    valueUsd: 16740,
    score: 74.1,
    activity: 139,
    usefulness: 79.0,
    trust: 8810,
    held: 11420,
    volumeUsd: 6120,
    rising7d: 7.4,
    consistency: 1.11,
    status: "live",
  },
  {
    id: "volt",
    name: "volt.akela.algo",
    chains: ["algorand"],
    valueUsd: 14110,
    score: 72.6,
    activity: 133,
    usefulness: 76.8,
    trust: 7600,
    held: 9920,
    volumeUsd: 5480,
    rising7d: 3.9,
    consistency: 1.05,
    status: "live",
  },
  {
    id: "ember",
    name: "ember.base.eth",
    chains: ["base", "algorand"],
    valueUsd: 12880,
    score: 70.2,
    activity: 118,
    usefulness: 75.1,
    trust: 7010,
    held: 8740,
    volumeUsd: 4920,
    rising7d: 15.2,
    consistency: 1.01,
    status: "live",
  },
  {
    id: "wisp",
    name: "wisp.akela.sol",
    chains: ["solana"],
    valueUsd: 8750,
    score: 66.4,
    activity: 91,
    usefulness: 70.3,
    trust: 4980,
    held: 6020,
    volumeUsd: 3110,
    rising7d: -0.6,
    consistency: 0.94,
    status: "idle",
  },
  {
    id: "flint",
    name: "flint.akela.algo",
    chains: ["algorand", "base"],
    valueUsd: 8040,
    score: 63.8,
    activity: 84,
    usefulness: 68.2,
    trust: 4550,
    held: 5490,
    volumeUsd: 2880,
    rising7d: 5.1,
    consistency: 0.96,
    status: "idle",
  },
  {
    id: "cinder",
    name: "cinder.base.eth",
    chains: ["base"],
    valueUsd: 6920,
    score: 61.5,
    activity: 77,
    usefulness: 66.0,
    trust: 3820,
    held: 4710,
    volumeUsd: 2540,
    rising7d: 11.0,
    consistency: 0.93,
    status: "idle",
  },
  {
    id: "gale",
    name: "gale.akela.sol",
    chains: ["solana", "algorand"],
    valueUsd: 5480,
    score: 59.9,
    activity: 69,
    usefulness: 63.4,
    trust: 3100,
    held: 3840,
    volumeUsd: 1980,
    rising7d: 1.8,
    consistency: 0.89,
    status: "idle",
  },
  {
    id: "nock",
    name: "nock.akela.algo",
    chains: ["algorand"],
    valueUsd: 4910,
    score: 57.1,
    activity: 58,
    usefulness: 60.2,
    trust: 2890,
    held: 3420,
    volumeUsd: 1710,
    rising7d: -4.7,
    consistency: 0.84,
    status: "dead",
  },
  {
    id: "brine",
    name: "brine.base.eth",
    chains: ["base", "solana"],
    valueUsd: 3870,
    score: 54.8,
    activity: 52,
    usefulness: 58.1,
    trust: 2410,
    held: 2980,
    volumeUsd: 1540,
    rising7d: 8.8,
    consistency: 0.87,
    status: "idle",
  },
  {
    id: "silt",
    name: "silt.akela.sol",
    chains: ["solana"],
    valueUsd: 2740,
    score: 53.2,
    activity: 47,
    usefulness: 56.4,
    trust: 1890,
    held: 2240,
    volumeUsd: 980,
    rising7d: 0.4,
    consistency: 0.83,
    status: "dead",
  },
  {
    id: "mica",
    name: "mica.akela.algo",
    chains: ["algorand", "solana", "base"],
    valueUsd: 15260,
    score: 78.9,
    activity: 156,
    usefulness: 84.1,
    trust: 9100,
    held: 11880,
    volumeUsd: 6400,
    rising7d: 6.2,
    consistency: 1.16,
    status: "live",
  },
  {
    id: "quarry",
    name: "quarry.base.eth",
    chains: ["base"],
    valueUsd: 1980,
    score: 49.4,
    activity: 31,
    usefulness: 51.2,
    trust: 1420,
    held: 1680,
    volumeUsd: 610,
    rising7d: -6.3,
    consistency: 0.72,
    status: "dead",
  },
  {
    id: "loom",
    name: "loom.akela.sol",
    chains: ["solana", "base"],
    valueUsd: 9310,
    score: 68.7,
    activity: 109,
    usefulness: 73.5,
    trust: 5220,
    held: 6470,
    volumeUsd: 3560,
    rising7d: 10.4,
    consistency: 1.00,
    status: "live",
  },
  {
    id: "vex",
    name: "vex.akela.algo",
    chains: ["algorand"],
    valueUsd: 1120,
    score: 44.8,
    activity: 22,
    usefulness: 46.0,
    trust: 880,
    held: 1040,
    volumeUsd: 390,
    rising7d: -8.9,
    consistency: 0.61,
    status: "dead",
  },
  {
    id: "yarn",
    name: "yarn.base.eth",
    chains: ["base", "algorand"],
    valueUsd: 7640,
    score: 65.0,
    activity: 99,
    usefulness: 71.1,
    trust: 4380,
    held: 5290,
    volumeUsd: 2670,
    rising7d: 2.9,
    consistency: 0.95,
    status: "live",
  },
  {
    id: "ox",
    name: "ox.akela.sol",
    chains: ["solana"],
    valueUsd: 3050,
    score: 52.6,
    activity: 41,
    usefulness: 55.3,
    trust: 1760,
    held: 2110,
    volumeUsd: 870,
    rising7d: 13.7,
    consistency: 0.79,
    status: "dead",
  },
];

const BOARD_KEY: Record<BoardId, keyof AgentSummary> = {
  value: "valueUsd",
  score: "score",
  rising: "rising7d",
  trusted: "trust",
  active: "activity",
};

export const METRIC_IDS: MetricId[] = METRICS.map((metric) => metric.id);
export const WINDOW_IDS: WindowId[] = WINDOWS;

export function listMetrics(): Metric[] {
  return METRICS;
}

export function getMetric(id: MetricId): Metric {
  const metric = METRICS.find((item) => item.id === id);
  if (!metric) {
    throw new Error(`Unknown metric: ${id}`);
  }
  return metric;
}

export function listAgents(): AgentSummary[] {
  return MOCK_AGENTS;
}

export function rankedAgents(board: BoardId = "value"): AgentSummary[] {
  const key = BOARD_KEY[board];
  return [...MOCK_AGENTS].sort((a, b) => Number(b[key]) - Number(a[key]));
}

export function sparkRows(metric: Metric, windowId: WindowId): SeriesPoint[] {
  return metric.series[windowId];
}

export type AgentSparkKind = "value" | "volume" | "score";

function agentSeed(id: string, kind: string): number {
  let h = 2166136261;
  const s = `${id}:${kind}`;
  for (let i = 0; i < s.length; i += 1) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 429496729.6;
}

export function agentSparkValues(agent: AgentSummary, kind: AgentSparkKind, windowId: "7d" | "30d"): number[] {
  const base = kind === "value" ? agent.valueUsd : kind === "volume" ? agent.volumeUsd : agent.score;
  const amp = Math.max(base * 0.14, kind === "score" ? 5 : 90);
  const points = windowId === "7d" ? 14 : 30;
  return makeSeries(agentSeed(agent.id, kind), points, base * 0.92, amp).map((point) => point.v);
}

export function agentLastSeen(agent: AgentSummary): string {
  const n = Math.floor(agentSeed(agent.id, "seen") % 9) + 1;
  if (agent.status === "live") {
    return `${n}h ago`;
  }
  if (agent.status === "idle") {
    return `${n}d ago`;
  }
  return `${n + 8}d ago`;
}

export const VALUE_A = 0.65;
export const VALUE_B = 0.35;

export function modelValue(held: number, volume: number, consistency: number): number {
  return (VALUE_A * held + VALUE_B * volume) * consistency;
}
