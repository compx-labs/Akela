/** Live root: https://api.nf.domains/nfd/akela.algo */

export const AKELA_NFD_ROOT = "akela.algo";
export const AKELA_NFD_PARENT_APP_ID = 3_698_150_696;
export const NFD_API_BASE = "https://api.nf.domains";

const PAGE_SIZE = 100;
const MAX_PAGES = 20;

export type FetchFn = (
  input: string,
  init?: { method?: string; headers?: Record<string, string> },
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

export type NfdRecord = {
  name: string;
  appID: number;
  owner: string;
  depositAccount?: string;
  parentAppID?: number | null;
  state?: string;
  segmentLocked?: boolean | number;
  segmentPriceUsd?: number;
  caAlgo?: string[];
  properties?: {
    verified?: Record<string, unknown>;
    internal?: Record<string, string>;
  };
};

export type NfdSearchPage = {
  total: number;
  nfds: NfdRecord[];
};

export function isAkelaSegment(name: string, root = AKELA_NFD_ROOT): boolean {
  const n = name.trim().toLowerCase();
  const r = root.trim().toLowerCase();
  return n.endsWith(`.${r}`) && n !== r;
}

/** Address Akela ranks: verified caAlgo, else NFD owner. */
export function rankedAddressFromNfd(nfd: NfdRecord): string {
  if (Array.isArray(nfd.caAlgo) && typeof nfd.caAlgo[0] === "string" && nfd.caAlgo[0]) {
    return nfd.caAlgo[0];
  }
  const verified = nfd.properties?.verified?.caAlgo;
  if (typeof verified === "string" && verified) {
    return verified;
  }
  if (Array.isArray(verified) && typeof verified[0] === "string" && verified[0]) {
    return verified[0];
  }
  return nfd.owner;
}

function internalFlag(nfd: NfdRecord, key: string): string | number | boolean | undefined {
  if (nfd.properties?.internal?.[key] !== undefined) {
    return nfd.properties.internal[key];
  }
  const top = nfd as unknown as Record<string, unknown>;
  const value = top[key];
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  return undefined;
}

export function nfdSegmentLocked(nfd: NfdRecord): boolean {
  const raw = internalFlag(nfd, "segmentLocked") ?? nfd.segmentLocked;
  return raw === true || raw === 1 || raw === "1";
}

export function nfdSegmentPriceUsdCents(nfd: NfdRecord): number | null {
  const raw = internalFlag(nfd, "segmentPriceUsd") ?? nfd.segmentPriceUsd;
  if (raw === undefined || raw === null || raw === "") {
    return null;
  }
  const cents = Number(raw);
  return Number.isFinite(cents) ? cents : null;
}

export function parseNfdRecord(data: unknown): NfdRecord | null {
  if (!data || typeof data !== "object") {
    return null;
  }
  const row = data as Record<string, unknown>;
  if (typeof row.name !== "string" || typeof row.appID !== "number" || typeof row.owner !== "string") {
    return null;
  }
  return row as NfdRecord;
}

export function parseSearchPage(data: unknown): NfdSearchPage {
  if (!data || typeof data !== "object") {
    return { total: 0, nfds: [] };
  }
  const row = data as Record<string, unknown>;
  const nfds = Array.isArray(row.nfds)
    ? row.nfds.map(parseNfdRecord).filter((nfd): nfd is NfdRecord => nfd !== null)
    : [];
  return {
    total: typeof row.total === "number" ? row.total : nfds.length,
    nfds,
  };
}

async function fetchJson(fetchFn: FetchFn, url: string): Promise<unknown> {
  const res = await fetchFn(url, {
    headers: { accept: "application/json", "user-agent": "Akela/0.1 (nfd-ingest)" },
  });
  if (!res.ok) {
    throw new Error(`NFD request failed ${res.status} ${url}`);
  }
  return res.json();
}

export async function fetchNfdByName(
  fetchFn: FetchFn,
  name: string,
  opts?: { apiBase?: string; view?: "tiny" | "brief" | "full" },
): Promise<NfdRecord | null> {
  const apiBase = (opts?.apiBase ?? NFD_API_BASE).replace(/\/$/, "");
  const view = opts?.view ?? "brief";
  const url = `${apiBase}/nfd/${encodeURIComponent(name)}?view=${view}`;
  const data = await fetchJson(fetchFn, url);
  return parseNfdRecord(data);
}

export async function listSegmentsOfParent(
  fetchFn: FetchFn,
  opts: { parentAppId: number; rootName?: string; apiBase?: string },
): Promise<NfdRecord[]> {
  const apiBase = (opts.apiBase ?? NFD_API_BASE).replace(/\/$/, "");
  const rootName = opts.rootName ?? AKELA_NFD_ROOT;
  const out: NfdRecord[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const offset = page * PAGE_SIZE;
    const params = new URLSearchParams({
      parentAppID: String(opts.parentAppId),
      segmentRoot: "false",
      state: "owned",
      view: "brief",
      limit: String(PAGE_SIZE),
      offset: String(offset),
      sort: "nameAsc",
    });
    const data = await fetchJson(fetchFn, `${apiBase}/nfd/v2/search?${params}`);
    const pageData = parseSearchPage(data);
    for (const nfd of pageData.nfds) {
      if (isAkelaSegment(nfd.name, rootName)) {
        out.push(nfd);
      }
    }
    if (pageData.nfds.length < PAGE_SIZE) {
      break;
    }
  }

  return out;
}
