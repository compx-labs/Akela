import type { Metric, WindowId } from "../types";

export function sparkRows(metric: Metric, windowId: WindowId) {
  return metric.series[windowId] ?? [];
}
