-- Migration number: 0001 	 2026-09-07T12:59:10.387Z
-- Registry only — no marketplace / listing / order-book tables.

CREATE TABLE agents (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE claims (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
  chain TEXT NOT NULL,
  system TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  proof TEXT NOT NULL DEFAULT '',
  claimed_at TEXT NOT NULL,
  UNIQUE (chain, name),
  UNIQUE (chain, address)
);

CREATE INDEX claims_agent_id ON claims (agent_id);

CREATE TABLE snapshots (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
  chain TEXT NOT NULL,
  captured_at TEXT NOT NULL,
  equity_usd REAL NOT NULL,
  peak_equity_usd REAL NOT NULL,
  last_seen_at TEXT,
  longest_quiet_gap_days REAL NOT NULL,
  counterparties INTEGER NOT NULL,
  windows_json TEXT NOT NULL,
  active_days_json TEXT NOT NULL,
  tx_timestamps_json TEXT NOT NULL
);

CREATE INDEX snapshots_agent_captured ON snapshots (agent_id, captured_at DESC);

CREATE TABLE scores (
  agent_id TEXT NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
  window_id TEXT NOT NULL,
  value_usd REAL NOT NULL,
  consistency REAL NOT NULL,
  score REAL NOT NULL,
  activity REAL NOT NULL,
  usefulness REAL NOT NULL,
  trust REAL NOT NULL,
  rising_7d REAL NOT NULL,
  eligible INTEGER NOT NULL,
  computed_at TEXT NOT NULL,
  PRIMARY KEY (agent_id, window_id)
);

CREATE TABLE formula_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

INSERT INTO formula_config (key, value, updated_at) VALUES
  ('value_a', '0.65', '2026-09-07T00:00:00.000Z'),
  ('value_b', '0.35', '2026-09-07T00:00:00.000Z'),
  ('score_activity', '0.35', '2026-09-07T00:00:00.000Z'),
  ('score_usefulness', '0.40', '2026-09-07T00:00:00.000Z'),
  ('score_trust', '0.25', '2026-09-07T00:00:00.000Z'),
  ('consistency_min', '0.5', '2026-09-07T00:00:00.000Z'),
  ('consistency_max', '1.2', '2026-09-07T00:00:00.000Z'),
  ('price_source', 'defillama', '2026-09-07T00:00:00.000Z'),
  ('price_source_fallback', 'coingecko', '2026-09-07T00:00:00.000Z'),
  ('min_activity_floor', 'unset', '2026-09-07T00:00:00.000Z'),
  ('min_equity_floor_usd', 'unset', '2026-09-07T00:00:00.000Z');
