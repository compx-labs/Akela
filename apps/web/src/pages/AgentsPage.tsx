import { useMemo, useState, type CSSProperties, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import AgentInspector from "../components/AgentInspector";
import ChainGlyphs from "../components/ChainGlyphs";
import MarkKeys from "../components/MarkKeys";
import SplitInspect, { InspectorEmpty } from "../components/SplitInspect";
import StatusGlyph from "../components/StatusGlyph";
import { useMarks } from "../hooks/useMarks";
import { agentRowClass, useAgentSelection } from "../hooks/useAgentSelection";
import { formatScore, formatUsd } from "../lib/format";
import { listAgents } from "../lib/mockSeries";

export default function AgentsPage() {
  const [query, setQuery] = useState("");
  const agents = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = listAgents();
    if (!q) {
      return list;
    }
    return list.filter(
      (agent) =>
        agent.name.toLowerCase().includes(q) ||
        agent.chains.some((chain) => chain.includes(q)) ||
        agent.status.includes(q),
    );
  }, [query]);
  const { markedIds, toggleMark, clearMarks } = useMarks();
  const { selected, selectedId, select } = useAgentSelection(agents, { onSpace: toggleMark });

  const onSelect = (id: string, event: MouseEvent<HTMLTableRowElement>) => {
    if (event.shiftKey) {
      toggleMark(id);
    }
    select(id);
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="group flex h-8 shrink-0 items-center gap-2 border-b border-hair px-2 transition-colors focus-within:bg-panel">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-up">Find</span>
        <span className="text-muted transition-colors group-focus-within:text-label" aria-hidden="true">
          &gt;
        </span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="name, chain, live|idle|dead"
          className="h-6 min-w-0 flex-1 border-0 bg-transparent px-1 text-[12px] text-fg caret-label placeholder:text-muted focus:ring-0"
          autoComplete="off"
          spellCheck={false}
          aria-label="Find agent"
        />
        <span key={agents.length} className="anim-fade text-[10px] tabular-nums text-muted">
          {agents.length} shown
        </span>
        <Link
          to="/register"
          className="group/reg inline-flex h-6 items-center gap-1 border border-fg bg-void px-2 text-[10px] font-bold uppercase text-fg hover:bg-fg hover:text-black"
        >
          Register
          <span aria-hidden="true" className="transition-transform duration-150 group-hover/reg:translate-x-0.5">
            →
          </span>
        </Link>
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
            <div className="min-h-0 flex-1 overflow-auto">
              <table className="w-full border-collapse text-left text-[12px]">
                <thead className="sticky top-0 z-10 bg-panel">
                  <tr className="border-b border-hair text-[10px] font-semibold uppercase tracking-wider text-muted">
                    <th className="px-2 py-1">Agent</th>
                    <th className="px-2 py-1">Chains</th>
                    <th className="px-2 py-1">Status</th>
                    <th className="px-2 py-1 text-right text-label">Value $</th>
                    <th className="px-2 py-1 text-right">Score</th>
                    <th className="px-2 py-1">Claim</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent, index) => {
                    const on = agent.id === selectedId;
                    const marked = markedIds.includes(agent.id);
                    return (
                      <tr
                        key={agent.id}
                        data-agent-id={agent.id}
                        aria-selected={on}
                        onClick={(event) => onSelect(agent.id, event)}
                        className={`anim-row ${agentRowClass(on, marked)}`}
                        style={{ "--i": index } as CSSProperties}
                      >
                        <td className={`px-2 ${on ? "" : "text-fg"}`}>
                          {marked ? <span className="anim-fade mr-1 inline-block text-cyan">[*]</span> : null}
                          {agent.name}
                        </td>
                        <td className="px-2">
                          <ChainGlyphs chains={agent.chains} />
                        </td>
                        <td className="px-2">
                          <StatusGlyph status={agent.status} />
                        </td>
                        <td className={`px-2 text-right tabular-nums ${on ? "" : "text-fg"}`}>
                          {formatUsd(agent.valueUsd)}
                        </td>
                        <td className={`px-2 text-right tabular-nums ${on ? "" : "text-fg"}`}>
                          {formatScore(agent.score)}
                        </td>
                        <td className={`px-2 text-[10px] uppercase ${on ? "" : "text-cyan"}`}>registered</td>
                      </tr>
                    );
                  })}
                  {agents.length === 0 ? (
                    <tr className="anim-fade">
                      <td colSpan={6} className="px-2 py-6 text-center text-[11px] uppercase tracking-wide text-down">
                        No match for “{query.trim()}”
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
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
