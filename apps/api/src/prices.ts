const SOURCE_KEY = "source";

export type PriceQuote = {
  usd: number;
  source: string;
  asOf: string;
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
  await kv.put(`usd:${assetId}`, JSON.stringify(quote));
}

export async function getPriceSource(kv: KVNamespace): Promise<string | null> {
  return kv.get(SOURCE_KEY);
}

export async function putPriceSource(kv: KVNamespace, source: string): Promise<void> {
  await kv.put(SOURCE_KEY, source);
}
