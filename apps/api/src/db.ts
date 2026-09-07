import type { ChainId, WindowId } from "@akela/core";
import { modelValue } from "@akela/core";
import type { NameSystem } from "@akela/identity";
import type { Snapshot, WindowMetrics } from "@akela/indexers";

const WINDOWS: WindowId[] = ["24h", "7d", "30d", "since_registration"];

export type ClaimInput = {
  chain: ChainId;
  system: NameSystem;
  name: string;
  address: string;
  proof?: string;
};

export type AgentRecord = {
  id: string;
  createdAt: string;
  claims: Array<{
    chain: ChainId;
    system: NameSystem;
    name: string;
    address: string;
    claimedAt: string;
  }>;
  snapshots: Snapshot[];
  scores: Array<{
    windowId: WindowId;
    valueUsd: number;
    consistency: number;
    score: number;
    activity: number;
    usefulness: number;
    trust: number;
    rising7d: number;
    eligible: boolean;
    computedAt: string;
  }>;
};

const emptyWindows = (): Record<WindowId, WindowMetrics> => ({
  "24h": { volumeUsd: 0, activeDays: 0 },
  "7d": { volumeUsd: 0, activeDays: 0 },
  "30d": { volumeUsd: 0, activeDays: 0 },
  since_registration: { volumeUsd: 0, activeDays: 0 },
});

export async function pingDb(db: D1Database): Promise<boolean> {
  const row = await db.prepare("SELECT 1 AS ok").first<{ ok: number }>();
  return row?.ok === 1;
}

export async function readFormulaConfig(db: D1Database): Promise<Record<string, string>> {
  const { results } = await db.prepare("SELECT key, value FROM formula_config").all<{
    key: string;
    value: string;
  }>();
  const out: Record<string, string> = {};
  for (const row of results ?? []) {
    out[row.key] = row.value;
  }
  return out;
}

export async function insertClaimedAgent(db: D1Database, input: ClaimInput): Promise<string> {
  const now = new Date().toISOString();
  const agentId = crypto.randomUUID();
  const claimId = crypto.randomUUID();
  const snapshotId = crypto.randomUUID();
  const consistency = 1;
  const valueUsd = modelValue(0, 0, consistency);
  const windows = JSON.stringify(emptyWindows());

  const scoreInserts = WINDOWS.map((windowId) =>
    db
      .prepare(
        `INSERT INTO scores (
          agent_id, window_id, value_usd, consistency, score,
          activity, usefulness, trust, rising_7d, eligible, computed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(agentId, windowId, valueUsd, consistency, 0, 0, 0, 0, 0, 0, now),
  );

  await db.batch([
    db.prepare("INSERT INTO agents (id, created_at, updated_at) VALUES (?, ?, ?)").bind(agentId, now, now),
    db
      .prepare(
        `INSERT INTO claims (id, agent_id, chain, system, name, address, proof, claimed_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(claimId, agentId, input.chain, input.system, input.name, input.address, input.proof ?? "", now),
    db
      .prepare(
        `INSERT INTO snapshots (
          id, agent_id, chain, captured_at, equity_usd, peak_equity_usd,
          last_seen_at, longest_quiet_gap_days, counterparties,
          windows_json, active_days_json, tx_timestamps_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(snapshotId, agentId, input.chain, now, 0, 0, null, 0, 0, windows, "[]", "[]"),
    ...scoreInserts,
  ]);

  return agentId;
}

type AgentRow = { id: string; created_at: string };
type ClaimRow = {
  chain: ChainId;
  system: NameSystem;
  name: string;
  address: string;
  claimed_at: string;
};
type SnapshotRow = {
  chain: ChainId;
  captured_at: string;
  equity_usd: number;
  peak_equity_usd: number;
  last_seen_at: string | null;
  longest_quiet_gap_days: number;
  counterparties: number;
  windows_json: string;
  active_days_json: string;
  tx_timestamps_json: string;
};
type ScoreRow = {
  window_id: WindowId;
  value_usd: number;
  consistency: number;
  score: number;
  activity: number;
  usefulness: number;
  trust: number;
  rising_7d: number;
  eligible: number;
  computed_at: string;
};

export async function getAgent(db: D1Database, id: string): Promise<AgentRecord | null> {
  const agent = await db.prepare("SELECT id, created_at FROM agents WHERE id = ?").bind(id).first<AgentRow>();
  if (!agent) {
    return null;
  }

  const claims = await db
    .prepare("SELECT chain, system, name, address, claimed_at FROM claims WHERE agent_id = ?")
    .bind(id)
    .all<ClaimRow>();
  const snapshots = await db
    .prepare(
      `SELECT chain, captured_at, equity_usd, peak_equity_usd, last_seen_at,
              longest_quiet_gap_days, counterparties, windows_json, active_days_json, tx_timestamps_json
       FROM snapshots WHERE agent_id = ? ORDER BY captured_at DESC`,
    )
    .bind(id)
    .all<SnapshotRow>();
  const scores = await db
    .prepare(
      `SELECT window_id, value_usd, consistency, score, activity, usefulness, trust, rising_7d, eligible, computed_at
       FROM scores WHERE agent_id = ?`,
    )
    .bind(id)
    .all<ScoreRow>();

  const claimRows = claims.results ?? [];
  const addressByChain = new Map(claimRows.map((row) => [row.chain, row.address]));

  return {
    id: agent.id,
    createdAt: agent.created_at,
    claims: claimRows.map((row) => ({
      chain: row.chain,
      system: row.system,
      name: row.name,
      address: row.address,
      claimedAt: row.claimed_at,
    })),
    snapshots: (snapshots.results ?? []).map((row) => ({
      chain: row.chain,
      address: addressByChain.get(row.chain) ?? "",
      capturedAt: row.captured_at,
      equityUsd: row.equity_usd,
      peakEquityUsd: row.peak_equity_usd,
      lastSeenAt: row.last_seen_at,
      longestQuietGapDays: row.longest_quiet_gap_days,
      counterparties: row.counterparties,
      windows: JSON.parse(row.windows_json) as Record<WindowId, WindowMetrics>,
      activeDays: JSON.parse(row.active_days_json) as string[],
      txTimestamps: JSON.parse(row.tx_timestamps_json) as number[],
    })),
    scores: (scores.results ?? []).map((row) => ({
      windowId: row.window_id,
      valueUsd: row.value_usd,
      consistency: row.consistency,
      score: row.score,
      activity: row.activity,
      usefulness: row.usefulness,
      trust: row.trust,
      rising7d: row.rising_7d,
      eligible: row.eligible === 1,
      computedAt: row.computed_at,
    })),
  };
}
