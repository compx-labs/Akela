import { CHART_CAP } from "../lib/mockSeries";
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
          {capped.map((item) => {
            if (item.values.length < 2) {
              return null;
            }
            const d = item.values
              .map((value, index) => {
                const x = (index / (item.values.length - 1)) * 100;
                const y = 100 - ((value - min) / range) * 100;
                return `${index === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
              })
              .join(" ");
            return (
              <path
                key={item.id}
                d={d}
                fill="none"
                stroke={item.color}
                strokeWidth="1.25"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
      </div>
      <div className="flex flex-wrap gap-x-2 gap-y-0.5 pt-1">
        {capped.map((item) => (
          <span key={item.id} className="inline-flex items-center gap-1 text-[10px] text-muted">
            <span className="inline-block h-1.5 w-1.5 shrink-0" style={{ background: item.color }} />
            {shortAgent(item.name)}
          </span>
        ))}
      </div>
    </div>
  );
}
