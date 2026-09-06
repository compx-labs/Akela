export type MetricId =
  | "value"
  | "score"
  | "activity"
  | "usefulness"
  | "trust"
  | "rising"
  | "consistency"
  | "held"
  | "volume";

export type WindowId = "24h" | "7d" | "30d";

export type ChainId = "algorand" | "solana" | "base";

export type AgentStatus = "live" | "idle" | "dead";

export type BoardId = "value" | "score" | "rising" | "trusted" | "active";

export type SeriesPoint = {
  t: string;
  v: number;
};

export type Metric = {
  id: MetricId;
  label: string;
  unit: "usd" | "score" | "count" | "multiplier" | "delta";
  current: number;
  series: Record<WindowId, SeriesPoint[]>;
  spark: string;
};

export type AgentSummary = {
  id: string;
  name: string;
  chains: ChainId[];
  valueUsd: number;
  score: number;
  activity: number;
  usefulness: number;
  trust: number;
  held: number;
  volumeUsd: number;
  rising7d: number;
  consistency: number;
  status: AgentStatus;
};
