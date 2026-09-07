import type { ChainId, WindowId } from "@akela/core";

export type { ChainId, WindowId };

/** Per-window totals. Adapters must also emit timestamps / active-day sets on Snapshot. */
export type WindowMetrics = {
  volumeUsd: number;
  activeDays: number;
};

/**
 * Shared indexer output. Same shape on Algo / Solana / Base.
 * Totals-only adapters fail consistency (NEO-378) — timestamps and active-day sets are required.
 */
export type Snapshot = {
  chain: ChainId;
  address: string;
  capturedAt: string;
  /** Average equity marked to USD when priced; unpriced assets stay out (neutral). */
  equityUsd: number;
  peakEquityUsd: number;
  lastSeenAt: string | null;
  longestQuietGapDays: number;
  counterparties: number;
  windows: Record<WindowId, WindowMetrics>;
  /** Calendar days with ≥1 on-chain interaction, `YYYY-MM-DD`. */
  activeDays: string[];
  /** Unix ms of txs / app calls / program interactions used to build activeDays. */
  txTimestamps: number[];
};

export type ChainIndexer = {
  readonly chain: ChainId;
  snapshot(address: string): Promise<Snapshot>;
};
