import type { ChainId, WindowId } from "@akela/core";
import { modelValue, scoreAgent } from "@akela/core";
import type { NameSystem } from "@akela/identity";
import { isAlgorandAddress, type Snapshot, type WindowMetrics } from "@akela/indexers";

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

export async function getAgentByName(
  db: D1Database,
  name: string,
  chain: ChainId = "algorand",
): Promise<AgentRecord | null> {
  const row = await db
    .prepare("SELECT agent_id FROM claims WHERE chain = ? AND name = ?")
    .bind(chain, name.trim().toLowerCase())
    .first<{ agent_id: string }>();
  if (!row) {
    return null;
  }
  return getAgent(db, row.agent_id);
}

export type BoardId = "value" | "score" | "rising" | "trusted" | "active";

export type AgentListRow = {
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

const BOARD_ORDER: Record<BoardId, string> = {
  value: "value_usd DESC",
  score: "score DESC",
  rising: "rising_7d DESC",
  trusted: "trust DESC",
  active: "activity DESC",
};

export async function listAgents(
  db: D1Database,
  opts?: { board?: BoardId; windowId?: WindowId; chain?: ChainId },
): Promise<AgentListRow[]> {
  const board = opts?.board ?? "value";
  const windowId = opts?.windowId ?? "7d";
  const chain = opts?.chain ?? "algorand";
  const order = BOARD_ORDER[board];
  const { results } = await db
    .prepare(
      `SELECT a.id AS id, c.name AS name, c.address AS address,
              COALESCE(s.value_usd, 0) AS value_usd,
              COALESCE(s.score, 0) AS score,
              COALESCE(s.activity, 0) AS activity,
              COALESCE(s.usefulness, 0) AS usefulness,
              COALESCE(s.trust, 0) AS trust,
              COALESCE(s.rising_7d, 0) AS rising_7d,
              COALESCE(s.consistency, 1) AS consistency,
              COALESCE(s.eligible, 0) AS eligible,
              snap.equity_usd AS equity_usd,
              snap.windows_json AS windows_json,
              snap.last_seen_at AS last_seen_at
       FROM claims c
       JOIN agents a ON a.id = c.agent_id
       LEFT JOIN scores s ON s.agent_id = a.id AND s.window_id = ?
       LEFT JOIN snapshots snap ON snap.id = (
         SELECT id FROM snapshots WHERE agent_id = a.id ORDER BY captured_at DESC LIMIT 1
       )
       WHERE c.chain = ?
       ORDER BY ${order}`,
    )
    .bind(windowId, chain)
    .all<{
      id: string;
      name: string;
      address: string;
      value_usd: number;
      score: number;
      activity: number;
      usefulness: number;
      trust: number;
      rising_7d: number;
      consistency: number;
      eligible: number;
      equity_usd: number | null;
      windows_json: string | null;
      last_seen_at: string | null;
    }>();

  return (results ?? [])
    .filter((row) => isAlgorandAddress(row.address))
    .map((row) => ({
      id: row.id,
      name: row.name,
      address: row.address,
      valueUsd: row.value_usd,
      score: row.score,
      activity: row.activity,
      usefulness: row.usefulness,
      trust: row.trust,
      rising7d: row.rising_7d,
      consistency: row.consistency,
      heldUsd: row.equity_usd ?? 0,
      volumeUsd: volumeFromWindows(row.windows_json, windowId),
      lastSeenAt: row.last_seen_at,
      eligible: row.eligible === 1,
    }));
}

function volumeFromWindows(raw: string | null, windowId: WindowId): number {
  if (!raw) {
    return 0;
  }
  try {
    const windows = JSON.parse(raw) as Record<string, { volumeUsd?: number }>;
    return Number(windows[windowId]?.volumeUsd ?? 0);
  } catch {
    return 0;
  }
}

export async function upsertNfdSegment(
  db: D1Database,
  input: { name: string; address: string; proof: string },
): Promise<{ id: string; created: boolean }> {
  const name = input.name.trim().toLowerCase();
  const now = new Date().toISOString();
  const existing = await db
    .prepare("SELECT id, agent_id FROM claims WHERE chain = 'algorand' AND name = ?")
    .bind(name)
    .first<{ id: string; agent_id: string }>();

  if (existing) {
    await db.batch([
      db
        .prepare("UPDATE claims SET address = ?, proof = ? WHERE id = ?")
        .bind(input.address, input.proof, existing.id),
      db.prepare("UPDATE agents SET updated_at = ? WHERE id = ?").bind(now, existing.agent_id),
    ]);
    return { id: existing.agent_id, created: false };
  }

  const id = await insertClaimedAgent(db, {
    chain: "algorand",
    system: "nfd",
    name,
    address: input.address,
    proof: input.proof,
  });
  return { id, created: true };
}

export type AlgorandClaim = {
  agentId: string;
  name: string;
  address: string;
  claimedAt: string;
};

export async function listAlgorandClaims(db: D1Database): Promise<AlgorandClaim[]> {
  const { results } = await db
    .prepare("SELECT agent_id, name, address, claimed_at FROM claims WHERE chain = 'algorand'")
    .all<{ agent_id: string; name: string; address: string; claimed_at: string }>();
  return (results ?? []).map((row) => ({
    agentId: row.agent_id,
    name: row.name,
    address: row.address,
    claimedAt: row.claimed_at,
  }));
}

export async function persistAlgorandSnapshot(
  db: D1Database,
  agentId: string,
  snapshot: Snapshot,
  opts: { claimedAt: string },
): Promise<void> {
  const now = snapshot.capturedAt;
  const previous = await db
    .prepare(
      `SELECT peak_equity_usd FROM snapshots
       WHERE agent_id = ? AND chain = 'algorand'
       ORDER BY captured_at DESC LIMIT 1`,
    )
    .bind(agentId)
    .first<{ peak_equity_usd: number }>();
  const peak = Math.max(snapshot.peakEquityUsd, previous?.peak_equity_usd ?? 0);
  const scored = scoreAgent(
    { ...snapshot, peakEquityUsd: peak },
    { claimedAt: opts.claimedAt, now: new Date(snapshot.capturedAt) },
  );

  const scoreUpdates = WINDOWS.map((windowId) => {
    const row = scored.windows[windowId];
    return db
      .prepare(
        `UPDATE scores
         SET value_usd = ?, consistency = ?, score = ?, activity = ?, usefulness = ?, trust = ?,
             rising_7d = ?, eligible = ?, computed_at = ?
         WHERE agent_id = ? AND window_id = ?`,
      )
      .bind(
        row.valueUsd,
        row.consistency,
        row.score,
        row.activity,
        row.usefulness,
        row.trust,
        row.rising7d,
        row.eligible ? 1 : 0,
        now,
        agentId,
        windowId,
      );
  });

  await db.batch([
    db
      .prepare(
        `INSERT INTO snapshots (
          id, agent_id, chain, captured_at, equity_usd, peak_equity_usd,
          last_seen_at, longest_quiet_gap_days, counterparties,
          windows_json, active_days_json, tx_timestamps_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        crypto.randomUUID(),
        agentId,
        snapshot.chain,
        now,
        snapshot.equityUsd,
        peak,
        snapshot.lastSeenAt,
        snapshot.longestQuietGapDays,
        snapshot.counterparties,
        JSON.stringify(snapshot.windows),
        JSON.stringify(snapshot.activeDays),
        JSON.stringify(snapshot.txTimestamps),
      ),
    db.prepare("UPDATE agents SET updated_at = ? WHERE id = ?").bind(now, agentId),
    ...scoreUpdates,
  ]);
}
