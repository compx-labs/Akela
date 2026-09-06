import type { Metric } from "../types";

export function formatMetricValue(metric: Metric, value = metric.current): string {
  switch (metric.unit) {
    case "usd":
      return formatUsd(value);
    case "score":
      return value.toFixed(1);
    case "count":
      return new Intl.NumberFormat("en-US").format(Math.round(value));
    case "multiplier":
      return formatMult(value);
    case "delta":
      return formatDelta(value);
    default:
      return String(value);
  }
}

export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDelta(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(1)}%`;
}

export function formatMult(value: number): string {
  return `${value.toFixed(2)}×`;
}

export function formatScore(value: number): string {
  return value.toFixed(1);
}
