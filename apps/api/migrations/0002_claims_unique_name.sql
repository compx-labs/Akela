-- Jersey is the name. Two segments may share a wallet.
CREATE TABLE claims_new (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL REFERENCES agents (id) ON DELETE CASCADE,
  chain TEXT NOT NULL,
  system TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  proof TEXT NOT NULL DEFAULT '',
  claimed_at TEXT NOT NULL,
  UNIQUE (chain, name)
);

INSERT INTO claims_new SELECT id, agent_id, chain, system, name, address, proof, claimed_at FROM claims;

DROP TABLE claims;
ALTER TABLE claims_new RENAME TO claims;
CREATE INDEX claims_agent_id ON claims (agent_id);
CREATE INDEX claims_chain_address ON claims (chain, address);
