import { useCountUp } from "../hooks/useMotion";
import { formatMetricValue } from "../lib/format";
import { sparkRows } from "../lib/mockSeries";
import type { Metric, WindowId } from "../types";
import Pane from "./Pane";
import Sparkline from "./Sparkline";

type MetricPaneProps = {
  metric: Metric;
  windowId: WindowId;
  hero?: boolean;
  className?: string;
  index?: number;
};

export default function MetricPane({ metric, windowId, hero = false, className = "", index = 0 }: MetricPaneProps) {
  const spark = sparkRows(metric, windowId);
  const isDelta = metric.unit === "delta";
  const positive = metric.current >= 0;
  const color = isDelta ? (positive ? "#3cff6b" : "#ff4d4f") : metric.spark;
  const animated = useCountUp(metric.current);

  const valueTone = isDelta ? (positive ? "text-up" : "text-down") : "text-fg";
  const valueClass = hero
    ? `text-[18px] font-semibold leading-none ${valueTone}`
    : `text-[12px] font-medium leading-none ${valueTone}`;

  return (
    <Pane title={metric.label} className={className} meta={windowId.toUpperCase()} index={index}>
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-baseline justify-between gap-2">
          <p className={`${valueClass} tabular-nums`}>
            {isDelta ? (
              <>
                <span aria-hidden="true" className="mr-px text-[0.8em]">
                  {positive ? "▲" : "▼"}
                </span>
                {Math.abs(animated).toFixed(1)}%
              </>
            ) : (
              formatMetricValue(metric, animated)
            )}
          </p>
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
