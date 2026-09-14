import {
  AKELA_NFD_PARENT_APP_ID,
  AKELA_NFD_ROOT,
  NFD_API_BASE,
  fetchNfdByName,
  listSegmentsOfParent,
  nfdSegmentLocked,
  nfdSegmentPriceUsdCents,
  rankedAddressFromNfd,
  type FetchFn,
} from "@akela/identity";
import { upsertNfdSegment } from "./db";

export type IngestResult = {
  root: string;
  parentAppId: number;
  scanned: number;
  created: number;
  updated: number;
  skipped: number;
};

function nfdFetch(): FetchFn {
  return (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(10_000) });
}

function nfdOpts(env: CloudflareBindings) {
  return {
    apiBase: env.NFD_API_BASE || NFD_API_BASE,
    parentAppId: Number(env.NFD_PARENT_APP_ID || AKELA_NFD_PARENT_APP_ID),
    rootName: env.NFD_PARENT_NAME || AKELA_NFD_ROOT,
  };
}

export async function readNfdRoot(env: CloudflareBindings) {
  const { apiBase, rootName, parentAppId } = nfdOpts(env);
  const nfd = await fetchNfdByName(nfdFetch(), rootName, { apiBase, view: "full" });
  if (!nfd) {
    return null;
  }
  const cents = nfdSegmentPriceUsdCents(nfd);
  const locked = nfdSegmentLocked(nfd);
  return {
    name: nfd.name,
    appID: nfd.appID,
    expectedAppID: parentAppId,
    owner: nfd.owner,
    segmentLocked: locked,
    unlocked: !locked,
    segmentPriceUsdCents: cents,
    segmentPriceUsd: cents === null ? null : cents / 100,
  };
}

export async function ingestAkelaSegments(env: CloudflareBindings): Promise<IngestResult> {
  const { apiBase, parentAppId, rootName } = nfdOpts(env);
  const segments = await listSegmentsOfParent(nfdFetch(), { parentAppId, rootName, apiBase });
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const nfd of segments) {
    const address = rankedAddressFromNfd(nfd);
    if (!address) {
      skipped += 1;
      continue;
    }
    const result = await upsertNfdSegment(env.DB, {
      name: nfd.name,
      address,
      proof: `nfd:${nfd.appID}`,
    });
    if (result.created) {
      created += 1;
    } else {
      updated += 1;
    }
  }

  return {
    root: rootName,
    parentAppId,
    scanned: segments.length,
    created,
    updated,
    skipped,
  };
}
