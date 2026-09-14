import { useMemo, type MouseEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AgentInspector from "../components/AgentInspector";
import MarkKeys from "../components/MarkKeys";
import RankTable from "../components/RankTable";
import SplitInspect, { InspectorEmpty } from "../components/SplitInspect";
import { useBoard } from "../hooks/useAkela";
import { useMarks } from "../hooks/useMarks";
import { useAgentSelection } from "../hooks/useAgentSelection";
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
  value: "Akela Value $",
  score: "Akela Score  ·  0.35 act + 0.40 use + 0.25 trust",
  rising: "7d volume pace vs 30d daily avg",
  trusted: "Trust (held)  ·  average equity held",
  active: "Activity  ·  on-chain cadence / active days",
};

function asBoard(raw: string | undefined): BoardId {
  return BOARDS.some((item) => item.id === raw) ? (raw as BoardId) : "value";
}

export default function BoardsPage() {
  const { boardId } = useParams();
  const navigate = useNavigate();
  const board = asBoard(boardId);
  const query = useBoard(board, "7d");
  const agents = query.data ?? [];
  const { markedIds, toggleMark, clearMarks } = useMarks();
  const { selected, selectedId, select } = useAgentSelection(agents, { onSpace: toggleMark });

  const onSelect = (id: string, event: MouseEvent<HTMLTableRowElement>) => {
    if (event.shiftKey) {
      toggleMark(id);
    }
    select(id);
  };

  const empty = useMemo(() => {
    if (query.isLoading) {
      return "loading ranks…";
    }
    if (query.isError) {
      return "api unreachable — start the local worker";
    }
    return "no live agents yet — mint a *.akela.algo segment";
  }, [query.isError, query.isLoading]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-1 border-b border-hair px-1 py-1">
        {BOARDS.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={board === item.id}
            onClick={() => navigate(`/boards/${item.id}`)}
            className={[
              "inline-flex h-8 min-w-[84px] items-center justify-center border px-3 text-[11px] font-bold uppercase tracking-wide",
              toneClass(item.tone, board === item.id),
            ].join(" ")}
          >
            {item.label}
          </button>
        ))}
        <p key={board} className="anim-fade ml-2 min-w-0 flex-1 truncate text-[10px] uppercase tracking-wide text-muted">
          {COPY[board]}
        </p>
        <MarkKeys
          canMark={Boolean(selectedId)}
          markCount={markedIds.length}
          onMark={() => {
            if (selectedId) {
              toggleMark(selectedId);
            }
          }}
          onClear={clearMarks}
        />
      </div>
      <div className="flex min-h-0 flex-1 border-x border-hair">
        <SplitInspect
          list={
            agents.length ? (
              <RankTable
                agents={agents}
                highlight={board}
                showStatus
                selectedId={selectedId}
                markedIds={markedIds}
                onSelect={onSelect}
              />
            ) : (
              <p className="flex flex-1 items-center justify-center px-4 text-center text-[11px] uppercase tracking-wide text-muted">
                {empty}
              </p>
            )
          }
          detail={
            selected ? (
              <AgentInspector agent={selected} />
            ) : (
              <InspectorEmpty hint="↑ ↓ move  ·  space / ⇧click mark  ·  esc clear" />
            )
          }
        />
      </div>
    </div>
  );
}
