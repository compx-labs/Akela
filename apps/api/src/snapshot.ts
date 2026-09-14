import { NODELY_INDEXER_BASE, isAlgorandAddress, snapshotAlgorand, type FetchFn } from "@akela/indexers";
import { listAlgorandClaims, persistAlgorandSnapshot } from "./db";
import { loadPriceBook } from "./prices";

export type SnapshotRun = {
  scanned: number;
  snapshotted: number;
  skipped: number;
  failed: Array<{ name: string; address: string; error: string }>;
};

function indexerFetch(): FetchFn {
  return (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(15_000) });
}

export async function snapshotAlgorandAgents(env: CloudflareBindings): Promise<SnapshotRun> {
  const claims = await listAlgorandClaims(env.DB);
  const run: SnapshotRun = { scanned: claims.length, snapshotted: 0, skipped: 0, failed: [] };
  const fetchFn = indexerFetch();
  const indexerBase = env.ALGO_INDEXER_BASE || NODELY_INDEXER_BASE;

  for (const claim of claims) {
    if (!isAlgorandAddress(claim.address)) {
      run.skipped += 1;
      continue;
    }
    try {
      const snapshot = await snapshotAlgorand(claim.address, {
        fetchFn,
        indexerBase,
        registeredAt: claim.claimedAt,
        prices: (ids) => loadPriceBook(env.PRICES, ids, { apiBase: env.PRICE_API_BASE }),
      });
      await persistAlgorandSnapshot(env.DB, claim.agentId, snapshot);
      run.snapshotted += 1;
    } catch (error) {
      run.failed.push({
        name: claim.name,
        address: claim.address,
        error: error instanceof Error ? error.message : "snapshot failed",
      });
    }
  }

  return run;
}
