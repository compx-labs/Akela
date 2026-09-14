import { useMemo, useState } from "react";
import AgentInspector from "../components/AgentInspector";
import MetricPane from "../components/MetricPane";
import RankTable from "../components/RankTable";
import SplitInspect, { InspectorEmpty } from "../components/SplitInspect";
import { useBoard } from "../hooks/useAkela";
import { useAgentSelection } from "../hooks/useAgentSelection";
import { boardMetrics } from "../lib/api";
import type { MetricId, WindowId } from "../types";

const PANE_IDS: MetricId[] = ["value", "held", "volume", "score", "rising", "consistency", "usefulness"];
const WINDOWS: WindowId[] = ["24h", "7d", "30d"];

export default function DashboardPage() {
  const [windowId, setWindowId] = useState<WindowId>("7d");
  const query = useBoard("value", windowId);
  const agents = query.data ?? [];
  const metrics = useMemo(() => boardMetrics(agents), [agents]);
  const { selected, selectedId, select } = useAgentSelection(agents);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-[108px] shrink-0 grid-cols-8 overflow-hidden">
        {PANE_IDS.map((id, index) => {
          const metric = metrics.find((item) => item.id === id);
          if (!metric) {
            return null;
          }
          return (
            <MetricPane
              key={id}
              metric={metric}
              windowId={windowId}
              hero={id === "value"}
              index={index}
              className={id === "value" ? "-mb-px -mr-px col-span-2" : "-mb-px -mr-px"}
            />
          );
        })}
      </div>
      <section className="flex min-h-0 flex-1 flex-col border-t-0 border-hair">
        <header className="flex h-6 shrink-0 items-center gap-2 border-x border-b border-hair px-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider text-label">Ranked by Value $</h2>
          <span className="text-[10px] text-muted">{query.isLoading ? "loading" : `${agents.length} agents`}</span>
          {query.isError ? <span className="text-[10px] uppercase text-down">api unreachable</span> : null}
          <div className="ml-auto flex gap-1" role="tablist" aria-label="Window">
            {WINDOWS.map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={windowId === id}
                onClick={() => setWindowId(id)}
                className={[
                  "h-5 min-w-[40px] border px-2 text-[10px] font-bold uppercase",
                  windowId === id
                    ? "border-fg bg-fg text-black"
                    : "border-hair bg-void text-muted hover:border-muted hover:text-fg",
                ].join(" ")}
              >
                {id}
              </button>
            ))}
          </div>
        </header>
        <div className="flex min-h-0 flex-1 border-x border-hair">
          <SplitInspect
            list={
              agents.length ? (
                <RankTable agents={agents} highlight="value" selectedId={selectedId} onSelect={select} />
              ) : (
                <EmptyRanks loading={query.isLoading} error={query.isError} />
              )
            }
            detail={selected ? <AgentInspector agent={selected} /> : <InspectorEmpty />}
          />
        </div>
      </section>
    </div>
  );
}

function EmptyRanks({ loading, error }: { loading: boolean; error: boolean }) {
  return (
    <p className="flex flex-1 items-center justify-center px-4 text-center text-[11px] uppercase tracking-wide text-muted">
      {loading ? "loading ranks…" : error ? "api unreachable — start the local worker" : "no live agents yet — mint a *.akela.algo segment"}
    </p>
  );
}
