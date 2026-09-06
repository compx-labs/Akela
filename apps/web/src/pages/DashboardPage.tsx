import { useMemo, useState } from "react";
import AgentInspector from "../components/AgentInspector";
import MetricPane from "../components/MetricPane";
import RankTable from "../components/RankTable";
import SplitInspect, { InspectorEmpty } from "../components/SplitInspect";
import { useAgentSelection } from "../hooks/useAgentSelection";
import { getMetric, rankedAgents } from "../lib/mockSeries";
import type { MetricId, WindowId } from "../types";

const PANE_IDS: MetricId[] = ["value", "held", "volume", "score", "rising", "consistency", "usefulness"];
const WINDOWS: WindowId[] = ["24h", "7d", "30d"];

export default function DashboardPage() {
  const [windowId, setWindowId] = useState<WindowId>("7d");
  const agents = useMemo(() => rankedAgents("value"), []);
  const { selected, selectedId, select } = useAgentSelection(agents);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="grid min-h-[108px] shrink-0 grid-cols-8 overflow-hidden">
        {PANE_IDS.map((id) => {
          const metric = getMetric(id);
          return (
            <MetricPane
              key={id}
              metric={metric}
              windowId={windowId}
              hero={id === "value"}
              className={id === "value" ? "-mb-px -mr-px col-span-2" : "-mb-px -mr-px"}
            />
          );
        })}
      </div>
      <section className="flex min-h-0 flex-1 flex-col border-t-0 border-hair">
        <header className="flex h-6 shrink-0 items-center gap-2 border-x border-b border-hair px-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider text-label">Ranked by Value $</h2>
          <span className="text-[10px] text-muted">{agents.length} agents</span>
          <span className="text-[10px] uppercase tracking-wide text-label">model not an offer</span>
          <div className="ml-auto flex gap-1">
            {WINDOWS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setWindowId(id)}
                className={[
                  "h-5 min-w-[40px] border px-2 text-[10px] font-bold uppercase",
                  windowId === id ? "border-fg bg-fg text-black" : "border-hair bg-void text-muted hover:text-fg",
                ].join(" ")}
              >
                {id}
              </button>
            ))}
          </div>
        </header>
        <div className="flex min-h-0 flex-1 border-x border-hair">
          <SplitInspect
            list={<RankTable agents={agents} highlight="value" selectedId={selectedId} onSelect={select} />}
            detail={selected ? <AgentInspector agent={selected} /> : <InspectorEmpty />}
          />
        </div>
      </section>
    </div>
  );
}
