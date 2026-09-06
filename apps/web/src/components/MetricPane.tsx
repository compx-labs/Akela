import { formatMetricValue } from "../lib/format";
import { sparkRows } from "../lib/mockSeries";
import type { Metric, WindowId } from "../types";
import Delta from "./Delta";
import Pane from "./Pane";
import Sparkline from "./Sparkline";

type MetricPaneProps = {
  metric: Metric;
  windowId: WindowId;
  hero?: boolean;
  className?: string;
};

export default function MetricPane({ metric, windowId, hero = false, className = "" }: MetricPaneProps) {
  const spark = sparkRows(metric, windowId);
  const color =
    metric.unit === "delta" ? (metric.current >= 0 ? "#3cff6b" : "#ff4d4f") : metric.spark;
  const valueClass = hero
    ? "text-[18px] font-semibold leading-none text-fg"
    : "text-[12px] font-medium leading-none text-fg";

  return (
    <Pane title={metric.label} className={className} meta={windowId.toUpperCase()}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`${valueClass} tabular-nums`}>{formatMetricValue(metric)}</p>
          {metric.unit === "delta" ? <Delta value={metric.current} className="text-[10px]" /> : null}
          {metric.id === "consistency" ? (
            <span className={`text-[10px] ${metric.current >= 1 ? "text-up" : "text-down"}`}>
              {metric.current >= 1 ? "TIGHT" : "GAPPED"}
            </span>
          ) : null}
        </div>
        {metric.id === "value" ? (
          <p className="mt-0.5 text-[10px] uppercase tracking-wide text-label">model not an offer</p>
        ) : null}
        <Sparkline values={spark.map((point) => point.v)} color={color} className="mt-1 h-9 w-full" />
      </div>
    </Pane>
  );
}
