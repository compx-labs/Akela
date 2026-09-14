import type { CSSProperties } from "react";
import { CHART_CAP } from "../lib/chart";
import { shortAgent } from "../lib/format";

export type OverlaySeries = {
  id: string;
  name: string;
  color: string;
  values: number[];
};

export default function OverlayLines({ series }: { series: OverlaySeries[] }) {
  const capped = series.slice(0, CHART_CAP);
  const all = capped.flatMap((item) => item.values);
  const min = all.length ? Math.min(...all) : 0;
  const max = all.length ? Math.max(...all) : 1;
  const range = max - min || 1;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full" aria-hidden="true">
          {/* Faint quartile guides so the overlay reads as a chart, not a doodle. */}
          {[25, 50, 75].map((y) => (
            <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="#3a3a3a" strokeWidth="1" vectorEffect="non-scaling-stroke" strokeDasharray="1 3" opacity="0.6" />
          ))}
          {capped.map((item, index) => {
            if (item.values.length < 2) {
              return null;
            }
            const d = item.values
              .map((value, i) => {
                const x = (i / (item.values.length - 1)) * 100;
                const y = 100 - ((value - min) / range) * 100;
                return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
              })
              .join(" ");
            return (
              <path
                key={`${item.id}-${d}`}
                d={d}
                fill="none"
                stroke={item.color}
                strokeWidth="1.25"
                vectorEffect="non-scaling-stroke"
                className="spark-line"
                style={{ animationDelay: `${index * 70}ms` }}
              />
            );
          })}
        </svg>
      </div>
      <div className="flex flex-wrap gap-x-2 gap-y-0.5 pt-1">
        {capped.map((item, index) => (
          <span
            key={item.id}
            className="anim-rise inline-flex items-center gap-1 text-[10px] text-muted"
            style={{ "--i": index } as CSSProperties}
          >
            <span className="inline-block h-1.5 w-1.5 shrink-0" style={{ background: item.color }} />
            {shortAgent(item.name)}
          </span>
        ))}
      </div>
    </div>
  );
}
