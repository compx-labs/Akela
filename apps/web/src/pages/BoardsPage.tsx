import { useMemo, useState } from "react";
import AgentInspector from "../components/AgentInspector";
import RankTable from "../components/RankTable";
import SplitInspect, { InspectorEmpty } from "../components/SplitInspect";
import { useAgentSelection } from "../hooks/useAgentSelection";
import { rankedAgents } from "../lib/mockSeries";
import type { BoardId } from "../types";
import type { ViewTone } from "../lib/nav";
import { toneClass } from "../lib/keyTone";

const BOARDS: Array<{ id: BoardId; label: string; tone: ViewTone }> = [
  { id: "value", label: "VALUE", tone: "amber" },
  { id: "score", label: "SCORE", tone: "white" },
  { id: "rising", label: "RISING", tone: "green" },
  { id: "trusted", label: "TRUSTED", tone: "orange" },
  { id: "active", label: "ACTIVE", tone: "cyan" },
];

const COPY: Record<BoardId, string> = {
  value: "Akela Value $  ·  (a×held + b×volume) × consistency  ·  model not an offer",
  score: "Akela Score  ·  0.35 activity + 0.40 usefulness + 0.25 trust",
  rising: "7d Value delta  ·  green up / red down",
  trusted: "Trust (held)  ·  average equity held",
  active: "Activity  ·  on-chain cadence / active days",
};

export default function BoardsPage() {
  const [board, setBoard] = useState<BoardId>("value");
  const agents = useMemo(() => rankedAgents(board), [board]);
  const { selected, selectedId, select } = useAgentSelection(agents);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-1 border-b border-hair px-1 py-1">
        {BOARDS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setBoard(item.id)}
            className={[
              "inline-flex h-8 min-w-[84px] items-center justify-center border px-3 text-[11px] font-bold uppercase tracking-wide",
              toneClass(item.tone, board === item.id),
            ].join(" ")}
          >
            {item.label}
          </button>
        ))}
        <p className="ml-3 truncate text-[10px] uppercase tracking-wide text-muted">{COPY[board]}</p>
      </div>
      <div className="flex min-h-0 flex-1 border-x border-hair">
        <SplitInspect
          list={<RankTable agents={agents} highlight={board} showStatus selectedId={selectedId} onSelect={select} />}
          detail={selected ? <AgentInspector agent={selected} /> : <InspectorEmpty />}
        />
      </div>
    </div>
  );
}
