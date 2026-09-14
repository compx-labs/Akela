import type { CSSProperties, MouseEvent } from "react";
import type { AgentSummary, BoardId } from "../types";
import { formatMult, formatScore, formatUsd } from "../lib/format";
import { agentRowClass } from "../hooks/useAgentSelection";
import ChainGlyphs from "./ChainGlyphs";
import Delta from "./Delta";
import StatusGlyph from "./StatusGlyph";

type ColId = "rank" | "agent" | "chains" | "status" | "value" | "score" | "rising" | "trust" | "activity" | "consistency";

type RankTableProps = {
  agents: AgentSummary[];
  highlight?: BoardId | "value";
  showStatus?: boolean;
  selectedId?: string | null;
  markedIds?: string[];
  onSelect?: (id: string, event: MouseEvent<HTMLTableRowElement>) => void;
};

const COLS: Array<{ id: ColId; label: string; align: "left" | "right"; board?: BoardId }> = [
  { id: "rank", label: "#", align: "left" },
  { id: "agent", label: "Agent", align: "left" },
  { id: "chains", label: "Ch", align: "left" },
  { id: "status", label: "St", align: "left" },
  { id: "value", label: "Value $", align: "right", board: "value" },
  { id: "score", label: "Score", align: "right", board: "score" },
  { id: "rising", label: "Rising", align: "right", board: "rising" },
  { id: "trust", label: "Trust", align: "right", board: "trusted" },
  { id: "activity", label: "Active", align: "right", board: "active" },
  { id: "consistency", label: "Cons.", align: "right" },
];

export default function RankTable({
  agents,
  highlight = "value",
  showStatus = false,
  selectedId = null,
  markedIds = [],
  onSelect,
}: RankTableProps) {
  const cols = COLS.filter((col) => col.id !== "status" || showStatus);

  return (
    <div className="min-h-0 flex-1 overflow-auto">
      <table className="w-full border-collapse text-left text-[12px]">
        <thead className="sticky top-0 z-10 bg-panel">
          <tr className="border-b border-hair">
            {cols.map((col) => {
              const ranked = col.board === highlight;
              return (
                <th
                  key={col.id}
                  aria-sort={ranked ? "descending" : undefined}
                  className={[
                    "px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition-colors duration-150",
                    col.align === "right" ? "text-right" : "text-left",
                    ranked ? "text-label" : "text-muted",
                  ].join(" ")}
                >
                  {col.label}
                  {ranked ? (
                    <span aria-hidden="true" className="anim-fade ml-0.5 inline-block text-[8px]">
                      ▼
                    </span>
                  ) : null}
                </th>
              );
            })}
          </tr>
        </thead>
        {/* Keyed on the ranked column so a board switch replays the stagger. */}
        <tbody key={highlight}>
          {agents.map((agent, index) => {
            const selected = agent.id === selectedId;
            const marked = markedIds.includes(agent.id);
            return (
              <tr
                key={agent.id}
                data-agent-id={agent.id}
                aria-selected={selected}
                onClick={(event) => onSelect?.(agent.id, event)}
                className={`anim-row ${agentRowClass(selected, marked)}`}
                style={{ "--i": index } as CSSProperties}
              >
                <td
                  className={`w-8 px-2 font-medium tabular-nums ${selected ? "" : index === 0 ? "text-label" : "text-muted"}`}
                >
                  {index + 1}
                </td>
                <td className={`max-w-0 truncate px-2 ${selected ? "" : "text-fg"}`} title={agent.name}>
                  {marked ? <span className="anim-fade mr-1 inline-block text-cyan">[*]</span> : null}
                  {agent.name}
                </td>
                <td className="w-16 px-2">
                  <ChainGlyphs chains={agent.chains} />
                </td>
                {showStatus ? (
                  <td className="w-12 px-2">
                    <StatusGlyph status={agent.status} />
                  </td>
                ) : null}
                <td className={`px-2 text-right tabular-nums ${selected ? "" : "text-fg"}`}>
                  {formatUsd(agent.valueUsd)}
                </td>
                <td className={`px-2 text-right tabular-nums ${selected ? "" : "text-fg"}`}>
                  {formatScore(agent.score)}
                </td>
                <td className="px-2 text-right tabular-nums">
                  <Delta value={agent.rising7d} inherit={selected} />
                </td>
                <td className={`px-2 text-right tabular-nums ${selected ? "" : "text-fg"}`}>
                  {formatUsd(agent.trust)}
                </td>
                <td className={`px-2 text-right tabular-nums ${selected ? "" : "text-fg"}`}>{agent.activity}</td>
                <td
                  className={`px-2 text-right tabular-nums ${selected ? "" : agent.consistency >= 1 ? "text-up" : "text-muted"}`}
                >
                  {formatMult(agent.consistency)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
