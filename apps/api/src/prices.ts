import { ALGO_DECIMALS, ALGO_PRICE_ID, type AssetPrice } from "@akela/indexers";

const SOURCE_KEY = "source";
const LLAMA_PRICES = "https://coins.llama.fi/prices/current";
const PRICE_TTL_SECONDS = 600;

export type PriceQuote = {
  usd: number;
  source: string;
  asOf: string;
  decimals?: number;
};

/** KV price cache. Missing key = unpriced = neutral. Never invent a USD number. */
export async function getUsdPrice(kv: KVNamespace, assetId: string): Promise<PriceQuote | null> {
  const raw = await kv.get(`usd:${assetId}`);
  if (!raw) {
    return null;
  }
  return JSON.parse(raw) as PriceQuote;
}

export async function putUsdPrice(kv: KVNamespace, assetId: string, quote: PriceQuote): Promise<void> {
  await kv.put(`usd:${assetId}`, JSON.stringify(quote), { expirationTtl: PRICE_TTL_SECONDS });
}

export async function getPriceSource(kv: KVNamespace): Promise<string | null> {
  return kv.get(SOURCE_KEY);
}

export async function putPriceSource(kv: KVNamespace, source: string): Promise<void> {
  await kv.put(SOURCE_KEY, source);
}

function llamaBase(envBase?: string): string {
  return (envBase || LLAMA_PRICES).replace(/\/$/, "");
}

type LlamaCoin = {
  price?: number;
  decimals?: number;
};

/** Fetch DefiLlama quotes for missing ids. Unreturned coins stay absent (neutral). */
export async function loadPriceBook(
  kv: KVNamespace,
  ids: string[],
  opts?: { apiBase?: string },
): Promise<Map<string, AssetPrice>> {
  const unique = [...new Set(ids.filter(Boolean))];
  const book = new Map<string, AssetPrice>();
  const missing: string[] = [];

  for (const id of unique) {
    const cached = await getUsdPrice(kv, id);
    const decimals = cached?.decimals ?? (id === ALGO_PRICE_ID ? ALGO_DECIMALS : undefined);
    if (cached && typeof decimals === "number" && decimals >= 0) {
      book.set(id, { usd: cached.usd, decimals });
    } else {
      missing.push(id);
    }
  }

  if (missing.length === 0) {
    return book;
  }

  const url = `${llamaBase(opts?.apiBase)}/${missing.join(",")}`;
  const res = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "Akela/0.1 (prices)" },
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new Error(`price source failed ${res.status}`);
  }
  const payload = (await res.json()) as { coins?: Record<string, LlamaCoin> };
  const asOf = new Date().toISOString();

  for (const id of missing) {
    const coin = payload.coins?.[id];
    const usd = coin?.price;
    const decimals = id === ALGO_PRICE_ID ? ALGO_DECIMALS : coin?.decimals;
    if (typeof usd !== "number" || !Number.isFinite(usd) || typeof decimals !== "number" || decimals < 0) {
      continue;
    }
    const quote: PriceQuote = { usd, source: "defillama", asOf, decimals };
    await putUsdPrice(kv, id, quote);
    book.set(id, { usd, decimals });
  }

  return book;
}
