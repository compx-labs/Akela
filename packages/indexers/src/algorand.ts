import type { WindowId } from "@akela/core";
import type { ChainIndexer, Snapshot, WindowMetrics } from "./index";

export const NODELY_INDEXER_BASE = "https://mainnet-idx.algonode.cloud";
export const ALGO_PRICE_ID = "coingecko:algorand";
export const ALGO_DECIMALS = 6;

const PAGE_SIZE = 1000;
const MAX_PAGES = 10;
const MAX_TIMESTAMPS = 4000;
const LOOKBACK_MS = 30 * 24 * 60 * 60 * 1000;

export type FetchFn = (
  input: string,
  init?: { method?: string; headers?: Record<string, string> },
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

export type AssetPrice = {
  usd: number;
  decimals: number;
};

export type PriceLookup = (ids: string[]) => Promise<Map<string, AssetPrice>>;

export type SnapshotOpts = {
  registeredAt?: string;
  now?: Date;
};

type AccountAsset = { assetId: number; amount: number };
type Transfer = { usd: number; counterparty: string | null };
type ParsedTx = {
  ms: number;
  volume: Transfer[];
  counterparties: string[];
};

const WINDOWS: WindowId[] = ["24h", "7d", "30d", "since_registration"];

export function asaPriceId(assetId: number): string {
  return `algorand:${assetId}`;
}

export function isAlgorandAddress(value: string): boolean {
  return /^[A-Z2-7]{58}$/.test(value);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value ? value : null;
}

function windowStartMs(windowId: WindowId, nowMs: number, registeredAtMs: number): number {
  if (windowId === "24h") {
    return nowMs - 24 * 60 * 60 * 1000;
  }
  if (windowId === "7d") {
    return nowMs - 7 * 24 * 60 * 60 * 1000;
  }
  if (windowId === "30d") {
    return nowMs - 30 * 24 * 60 * 60 * 1000;
  }
  return registeredAtMs;
}

function utcDay(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

function dayUtcMs(day: string): number {
  return Date.parse(`${day}T00:00:00.000Z`);
}

export function longestQuietGapDays(days: string[], nowMs: number): number {
  if (days.length === 0) {
    return 0;
  }
  const sorted = [...days].sort();
  let longest = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = (dayUtcMs(sorted[i]) - dayUtcMs(sorted[i - 1])) / 86_400_000 - 1;
    if (gap > longest) {
      longest = gap;
    }
  }
  const trailing = (dayUtcMs(utcDay(nowMs)) - dayUtcMs(sorted[sorted.length - 1])) / 86_400_000;
  return Math.max(longest, trailing, 0);
}

function toMicroUsd(amount: number, decimals: number, usd: number): number {
  return (amount / 10 ** decimals) * usd;
}

async function fetchJson(fetchFn: FetchFn, url: string, label: string): Promise<unknown> {
  const res = await fetchFn(url, {
    headers: { accept: "application/json", "user-agent": "Akela/0.1 (algorand-indexer)" },
  });
  if (!res.ok) {
    throw new Error(`${label} failed ${res.status} ${url}`);
  }
  return res.json();
}

function parseAssets(account: Record<string, unknown>): AccountAsset[] {
  const raw = account.assets;
  if (!Array.isArray(raw)) {
    return [];
  }
  const out: AccountAsset[] = [];
  for (const row of raw) {
    const item = asRecord(row);
    if (!item) {
      continue;
    }
    const assetId = asNumber(item["asset-id"]);
    const amount = asNumber(item.amount);
    if (assetId === null || amount === null || amount <= 0) {
      continue;
    }
    out.push({ assetId, amount });
  }
  return out;
}

function equityUsd(account: Record<string, unknown>, prices: Map<string, AssetPrice>): number {
  const algo = prices.get(ALGO_PRICE_ID);
  const micro = asNumber(account.amount) ?? 0;
  let equity = 0;
  if (algo) {
    equity += toMicroUsd(micro, ALGO_DECIMALS, algo.usd);
  }
  for (const holding of parseAssets(account)) {
    const quote = prices.get(asaPriceId(holding.assetId));
    if (!quote) {
      continue;
    }
    equity += toMicroUsd(holding.amount, quote.decimals, quote.usd);
  }
  return equity;
}

function counterparty(address: string, sender: string | null, receiver: string | null): string | null {
  if (sender && sender !== address) {
    return sender;
  }
  if (receiver && receiver !== address) {
    return receiver;
  }
  return null;
}

function collectTransfers(
  tx: Record<string, unknown>,
  address: string,
  prices: Map<string, AssetPrice>,
): Transfer[] {
  const sender = asString(tx.sender);
  const out: Transfer[] = [];
  const pay = asRecord(tx["payment-transaction"]);
  if (pay) {
    const receiver = asString(pay.receiver);
    const involved = sender === address || receiver === address;
    const quote = prices.get(ALGO_PRICE_ID);
    const amount = (asNumber(pay.amount) ?? 0) + (asNumber(pay["close-amount"]) ?? 0);
    if (involved && quote && amount > 0) {
      out.push({
        usd: toMicroUsd(amount, ALGO_DECIMALS, quote.usd),
        counterparty: counterparty(address, sender, receiver),
      });
    }
  }
  const axfer = asRecord(tx["asset-transfer-transaction"]);
  if (axfer) {
    const receiver = asString(axfer.receiver) ?? asString(axfer["close-to"]);
    const involved = sender === address || receiver === address;
    const assetId = asNumber(axfer["asset-id"]);
    const quote = assetId === null ? undefined : prices.get(asaPriceId(assetId));
    const amount = (asNumber(axfer.amount) ?? 0) + (asNumber(axfer["close-amount"]) ?? 0);
    if (involved && quote && amount > 0) {
      out.push({
        usd: toMicroUsd(amount, quote.decimals, quote.usd),
        counterparty: counterparty(address, sender, receiver),
      });
    }
  }
  return out;
}

function walkTx(
  tx: Record<string, unknown>,
  address: string,
  prices: Map<string, AssetPrice>,
  inheritedMs: number | null,
  topLevel: boolean,
  into: ParsedTx[],
): void {
  const roundTime = asNumber(tx["round-time"]);
  const ms = roundTime !== null ? roundTime * 1000 : inheritedMs;
  const volume = collectTransfers(tx, address, prices);
  const counterparties = volume
    .map((row) => row.counterparty)
    .filter((value): value is string => Boolean(value));
  if (topLevel && ms !== null) {
    into.push({ ms, volume, counterparties });
  } else if (!topLevel && volume.length > 0 && into.length > 0) {
    const parent = into[into.length - 1];
    parent.volume.push(...volume);
    parent.counterparties.push(...counterparties);
  }
  const inners = tx["inner-txns"];
  if (Array.isArray(inners)) {
    for (const inner of inners) {
      const row = asRecord(inner);
      if (row) {
        walkTx(row, address, prices, ms, false, into);
      }
    }
  }
}

function emptyWindows(): Record<WindowId, WindowMetrics> {
  return {
    "24h": { volumeUsd: 0, activeDays: 0 },
    "7d": { volumeUsd: 0, activeDays: 0 },
    "30d": { volumeUsd: 0, activeDays: 0 },
    since_registration: { volumeUsd: 0, activeDays: 0 },
  };
}

export async function snapshotAlgorand(
  address: string,
  opts: {
    fetchFn: FetchFn;
    indexerBase?: string;
    prices: PriceLookup;
    registeredAt?: string;
    now?: Date;
  },
): Promise<Snapshot> {
  if (!isAlgorandAddress(address)) {
    throw new Error(`not an Algorand address: ${address}`);
  }

  const indexerBase = (opts.indexerBase ?? NODELY_INDEXER_BASE).replace(/\/$/, "");
  const now = opts.now ?? new Date();
  const nowMs = now.getTime();
  const registeredAtMs = opts.registeredAt ? Date.parse(opts.registeredAt) : nowMs - LOOKBACK_MS;
  const after = new Date(nowMs - LOOKBACK_MS).toISOString().replace(/\.\d{3}Z$/, "Z");

  const accountPayload = asRecord(await fetchJson(opts.fetchFn, `${indexerBase}/v2/accounts/${address}`, "account"));
  const account = asRecord(accountPayload?.account);
  if (!account) {
    throw new Error(`indexer returned no account for ${address}`);
  }

  const priceIds = [ALGO_PRICE_ID, ...parseAssets(account).map((row) => asaPriceId(row.assetId))];
  const prices = await opts.prices(priceIds);
  const heldUsd = equityUsd(account, prices);

  const parsed: ParsedTx[] = [];
  let next: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      "after-time": after,
    });
    if (next) {
      params.set("next", next);
    }
    const payload = asRecord(
      await fetchJson(opts.fetchFn, `${indexerBase}/v2/accounts/${address}/transactions?${params}`, "transactions"),
    );
    const rows = Array.isArray(payload?.transactions) ? payload.transactions : [];
    for (const row of rows) {
      const tx = asRecord(row);
      if (tx) {
        walkTx(tx, address, prices, null, true, parsed);
      }
    }
    const token = asString(payload?.["next-token"]);
    if (!token || rows.length < PAGE_SIZE) {
      break;
    }
    next = token;
  }

  parsed.sort((a, b) => a.ms - b.ms);
  const timestamps = parsed.map((row) => row.ms).slice(-MAX_TIMESTAMPS);
  const activeDaySet = new Set(timestamps.map(utcDay));
  const activeDays = [...activeDaySet].sort();
  const lastMs = timestamps.length ? timestamps[timestamps.length - 1] : null;
  const counterparties = new Set<string>();
  for (const row of parsed) {
    for (const party of row.counterparties) {
      counterparties.add(party);
    }
  }

  const windows = emptyWindows();
  for (const windowId of WINDOWS) {
    const start = windowStartMs(windowId, nowMs, Number.isFinite(registeredAtMs) ? registeredAtMs : nowMs - LOOKBACK_MS);
    const inWindow = parsed.filter((row) => row.ms >= start);
    const days = new Set(inWindow.map((row) => utcDay(row.ms)));
    windows[windowId] = {
      volumeUsd: inWindow.reduce((sum, row) => sum + row.volume.reduce((inner, xfer) => inner + xfer.usd, 0), 0),
      activeDays: days.size,
    };
  }

  return {
    chain: "algorand",
    address,
    capturedAt: now.toISOString(),
    equityUsd: heldUsd,
    peakEquityUsd: heldUsd,
    lastSeenAt: lastMs ? new Date(lastMs).toISOString() : null,
    longestQuietGapDays: longestQuietGapDays(activeDays, nowMs),
    counterparties: counterparties.size,
    windows,
    activeDays,
    txTimestamps: timestamps,
  };
}

export class AlgorandIndexer implements ChainIndexer {
  readonly chain = "algorand" as const;

  constructor(
    private readonly opts: {
      fetchFn: FetchFn;
      indexerBase?: string;
      prices: PriceLookup;
    },
  ) {}

  snapshot(address: string, extra?: SnapshotOpts): Promise<Snapshot> {
    return snapshotAlgorand(address, {
      fetchFn: this.opts.fetchFn,
      indexerBase: this.opts.indexerBase,
      prices: this.opts.prices,
      registeredAt: extra?.registeredAt,
      now: extra?.now,
    });
  }
}
