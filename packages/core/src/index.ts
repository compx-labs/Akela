export type ChainId = "algorand" | "solana" | "base";

export type WindowId = "24h" | "7d" | "30d" | "since_registration";

/** Held weight — higher than volume so empty hyperactive wallets don't dominate. */
export const VALUE_A = 0.65;

/** Window USD volume weight. */
export const VALUE_B = 0.35;

export const SCORE_WEIGHTS = {
  activity: 0.35,
  usefulness: 0.4,
  trust: 0.25,
} as const;

export const CONSISTENCY_MIN = 0.5;
export const CONSISTENCY_MAX = 1.2;

export const VALUE_FORMULA =
  "Value = (a × avg_equity_held + b × usd_volume) × consistency";

export const SCORE_FORMULA = "Score = 0.35 Activity + 0.40 Usefulness + 0.25 Trust";

/**
 * Blue-book Akela Value. Model, not an offer.
 * Consistency sleeve (NEO-378) still lives in a later ticket; pass the multiplier in.
 */
export function modelValue(held: number, volume: number, consistency: number): number {
  return (VALUE_A * held + VALUE_B * volume) * consistency;
}
