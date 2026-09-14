import type { ChainId } from "@akela/core";

export type { ChainId };
export {
  AKELA_NFD_PARENT_APP_ID,
  AKELA_NFD_ROOT,
  NFD_API_BASE,
  fetchNfdByName,
  isAkelaSegment,
  listSegmentsOfParent,
  nfdSegmentLocked,
  nfdSegmentPriceUsdCents,
  rankedAddressFromNfd,
} from "./nfd";
export type { FetchFn, NfdRecord } from "./nfd";

export type NameSystem = "nfd" | "sns" | "basename" | "ens";

/** Claim draft the API will persist after proof verification (NEO-363 / 373 / 374). */
export type NameClaim = {
  chain: ChainId;
  system: NameSystem;
  name: string;
  address: string;
};

export type ClaimProof = {
  claim: NameClaim;
  /** Signed message or name-system control proof. Verifiers land in follow-up tickets. */
  signature: string;
};
