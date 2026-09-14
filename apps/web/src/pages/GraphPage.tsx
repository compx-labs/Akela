import { useMemo, type CSSProperties } from "react";
import BarRank, { type BarRow } from "../components/BarRank";
import OverlayLines, { type OverlaySeries } from "../components/OverlayLines";
import { useMarks } from "../hooks/useMarks";
import { COMPARE_COLORS } from "../lib/compare";
import { formatDelta, formatMult, formatUsd } from "../lib/format";
import {
  agentsByIds,
  agentSparkValues,
  MARK_LIMIT,
  topAgents,
  type AgentSparkKind,
  type RankMetric,
} from "../lib/mockSeries";
import type { AgentSummary } from "../types";

type Quad = {
  title: string;
  metric: RankMetric;
  kind: AgentSparkKind;
  format: (agent: AgentSummary) => string;
  value: (agent: AgentSummary) => number;
  tone?: (agent: AgentSummary) => BarRow["tone"];
  signed?: boolean;
};

const QUADS: Quad[] = [
  {
    title: "Value $",
    metric: "valueUsd",
    kind: "value",
    format: (agent) => formatUsd(agent.valueUsd),
    value: (agent) => agent.valueUsd,
  },
  {
    title: "Rising %",
    metric: "rising7d",
    kind: "rising",
    format: (agent) => formatDelta(agent.rising7d),
    value: (agent) => agent.rising7d,
    tone: (agent) => (agent.rising7d >= 0 ? "up" : "down"),
    signed: true,
  },
  {
    title: "Trust / Held $",
    metric: "trust",
    kind: "trust",
    format: (agent) => formatUsd(agent.trust),
    value: (agent) => agent.trust,
    tone: () => "orange",
  },
  {
    title: "Consistency",
    metric: "consistency",
    kind: "consistency",
    format: (agent) => formatMult(agent.consistency),
    value: (agent) => agent.consistency,
    tone: (agent) => (agent.consistency >= 1 ? "up" : "fg"),
  },
];

export default function GraphPage() {
  const { markedIds, clearMarks } = useMarks();
  const marked = useMemo(() => agentsByIds(markedIds).slice(0, MARK_LIMIT), [markedIds]);
  const compare = marked.length >= 2;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-6 shrink-0 items-center gap-2 border-b border-hair px-2">
        <h1 key={`h-${compare ? marked.length : "top"}`} className="anim-fade text-[10px] font-semibold uppercase tracking-wider text-graph">
          {compare ? `Compare · ${marked.length} agents` : "Top 10"}
        </h1>
        <span key={`s-${compare ? "cmp" : "top"}`} className="anim-fade text-[10px] uppercase tracking-wide text-muted">
          {compare ? "marked set · 7d overlay" : "showing top 10 · full board on boards"}
        </span>
        {compare ? (
          <button
            type="button"
            onClick={clearMarks}
            className="ml-auto inline-flex h-5 items-center border border-fg px-2 text-[10px] font-bold uppercase text-fg hover:bg-fg hover:text-black"
          >
            Clear marks
          </button>
        ) : (
          <span className="ml-auto text-[10px] uppercase tracking-wide text-label">model not an offer</span>
        )}
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 overflow-hidden [&>*]:-mb-px [&>*]:-mr-px">
        {QUADS.map((quad, index) => (
          <QuadPane key={quad.title} quad={quad} compare={compare} marked={marked} index={index} />
        ))}
      </div>
    </div>
  );
}

function QuadPane({
  quad,
  compare,
  marked,
  index,
}: {
  quad: Quad;
  compare: boolean;
  marked: AgentSummary[];
  index: number;
}) {
  const rows: BarRow[] = useMemo(() => {
    return topAgents(quad.metric).map((agent) => ({
      id: agent.id,
      name: agent.name,
      value: quad.value(agent),
      display: quad.format(agent),
      tone: quad.tone?.(agent) ?? "amber",
    }));
  }, [quad]);

  const series: OverlaySeries[] = useMemo(() => {
    return marked.map((agent, index) => ({
      id: agent.id,
      name: agent.name,
      color: COMPARE_COLORS[index] ?? "#ececec",
      values: agentSparkValues(agent, quad.kind, "7d"),
    }));
  }, [marked, quad]);

  return (
    <section
      className="anim-rise flex min-h-0 min-w-0 flex-col border border-hair bg-panel"
      style={{ "--i": index } as CSSProperties}
    >
      <header className="flex h-5 shrink-0 items-center justify-between gap-2 border-b border-hair px-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-wider text-label">{quad.title}</h2>
        <span key={compare ? marked.length : "top"} className="anim-fade text-[10px] uppercase tracking-wide text-muted">
          {compare ? `${marked.length} series` : "Top 10"}
        </span>
      </header>
      <div key={compare ? "overlay" : "bars"} className="anim-fade min-h-0 flex-1 px-2 py-1">
        {compare ? <OverlayLines series={series} /> : <BarRank rows={rows} signed={quad.signed} />}
      </div>
    </section>
  );
}
