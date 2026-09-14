import type { CSSProperties } from "react";
import { CHART_CAP } from "../lib/mockSeries";
import { shortAgent } from "../lib/format";

export type BarRow = {
  id: string;
  name: string;
  value: number;
  display: string;
  tone?: "up" | "down" | "amber" | "orange" | "fg";
};

const TONE: Record<NonNullable<BarRow["tone"]>, string> = {
  up: "bg-up",
  down: "bg-down",
  amber: "bg-amber",
  orange: "bg-orange",
  fg: "bg-fg",
};

export default function BarRank({ rows, signed = false }: { rows: BarRow[]; signed?: boolean }) {
  const capped = rows.slice(0, CHART_CAP);
  const peak = Math.max(...capped.map((row) => Math.abs(row.value)), 0.0001);

  return (
    <div className="flex h-full min-h-0 flex-col justify-between gap-[3px] py-0.5">
      {capped.map((row, index) => {
        const pct = Math.max(2, (Math.abs(row.value) / peak) * 100);
        const fill = TONE[row.tone ?? "amber"];
        const positive = row.value >= 0;
        return (
          <div
            key={row.id}
            className="group -mx-1 flex h-[18px] min-h-0 items-center gap-1.5 px-1 transition-colors duration-75 hover:bg-fg/[0.05]"
            style={{ "--i": index } as CSSProperties}
          >
            <span
              className="w-[78px] shrink-0 truncate text-[11px] text-muted transition-colors group-hover:text-fg"
              title={row.name}
            >
              {shortAgent(row.name)}
            </span>
            <div className="relative h-2.5 min-w-0 flex-1 bg-void">
              {signed ? (
                <>
                  <div className="absolute inset-y-0 left-1/2 w-px bg-hair" />
                  <div
                    className={`bar-grow absolute top-0 h-full ${fill} ${positive ? "bar-grow-left" : "bar-grow-right"}`}
                    style={positive ? { left: "50%", width: `${pct / 2}%` } : { right: "50%", width: `${pct / 2}%` }}
                  />
                </>
              ) : (
                <div className={`bar-grow bar-grow-left h-full ${fill}`} style={{ width: `${pct}%` }} />
              )}
            </div>
            <span
              className={`w-[68px] shrink-0 text-right text-[11px] tabular-nums ${
                row.tone === "up" ? "text-up" : row.tone === "down" ? "text-down" : "text-fg"
              }`}
            >
              {row.display}
            </span>
          </div>
        );
      })}
    </div>
  );
}
