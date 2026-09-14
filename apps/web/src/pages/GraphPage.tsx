import { useQueries } from "@tanstack/react-query";
import { useMemo, type CSSProperties } from "react";
import BarRank, { type BarRow } from "../components/BarRank";
import OverlayLines, { type OverlaySeries } from "../components/OverlayLines";
import { useBoard } from "../hooks/useAkela";
import { useMarks } from "../hooks/useMarks";
import { fetchAgent, sparkFromSnapshots } from "../lib/api";
import { CHART_CAP, MARK_LIMIT } from "../lib/chart";
import { COMPARE_COLORS } from "../lib/compare";
import { formatMult, formatRising, formatUsd } from "../lib/format";
import type { AgentSummary } from "../types";

type Quad = {
  title: string;
  spark: "value" | "volume" | "score";
  format: (agent: AgentSummary) => string;
  value: (agent: AgentSummary) => number;
  tone?: (agent: AgentSummary) => BarRow["tone"];
  signed?: boolean;
};

const QUADS: Quad[] = [
  {
    title: "Value $",
    spark: "value",
    format: (agent) => formatUsd(agent.valueUsd),
    value: (agent) => agent.valueUsd,
  },
  {
    title: "Rising %",
    spark: "volume",
    format: (agent) => formatRising(agent.rising7d),
    value: (agent) => (agent.rising7d - 1) * 100,
    tone: (agent) => (agent.rising7d >= 1 ? "up" : "down"),
    signed: true,
  },
  {
    title: "Trust / Held $",
    spark: "value",
    format: (agent) => formatUsd(agent.held),
    value: (agent) => agent.held,
    tone: () => "orange",
  },
  {
    title: "Consistency",
    spark: "score",
    format: (agent) => formatMult(agent.consistency),
    value: (agent) => agent.consistency,
    tone: (agent) => (agent.consistency >= 1 ? "up" : "fg"),
  },
];

export default function GraphPage() {
  const query = useBoard("value", "7d");
  const agents = query.data ?? [];
  const { markedIds, clearMarks } = useMarks();
  const marked = useMemo(
    () => agents.filter((agent) => markedIds.includes(agent.id)).slice(0, MARK_LIMIT),
    [agents, markedIds],
  );
  const compare = marked.length >= 2;
  const details = useQueries({
    queries: marked.map((agent) => ({
      queryKey: ["agent", agent.id],
      queryFn: () => fetchAgent(agent.id),
      enabled: compare,
    })),
  });

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-6 shrink-0 items-center gap-2 border-b border-hair px-2">
        <h1 key={`h-${compare ? marked.length : "top"}`} className="anim-fade text-[10px] font-semibold uppercase tracking-wider text-graph">
          {compare ? `Compare · ${marked.length} agents` : "Top 10"}
        </h1>
        <span key={`s-${compare ? "cmp" : "top"}`} className="anim-fade text-[10px] uppercase tracking-wide text-muted">
          {query.isLoading
            ? "loading ranks…"
            : query.isError
              ? "api unreachable"
              : compare
                ? "marked set · 7d overlay"
                : agents.length
                  ? "showing live ranks · full board on boards"
                  : "no live agents yet"}
        </span>
        {compare ? (
          <button
            type="button"
            onClick={clearMarks}
            className="ml-auto inline-flex h-5 items-center border border-fg px-2 text-[10px] font-bold uppercase text-fg hover:bg-fg hover:text-black"
          >
            Clear marks
          </button>
        ) : null}
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 overflow-hidden [&>*]:-mb-px [&>*]:-mr-px">
        {QUADS.map((quad, index) => (
          <QuadPane
            key={quad.title}
            quad={quad}
            compare={compare}
            marked={marked}
            details={details.map((item) => item.data)}
            agents={agents}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

function QuadPane({
  quad,
  compare,
  marked,
  details,
  agents,
  index,
}: {
  quad: Quad;
  compare: boolean;
  marked: AgentSummary[];
  details: Array<Awaited<ReturnType<typeof fetchAgent>> | undefined>;
  agents: AgentSummary[];
  index: number;
}) {
  const rows: BarRow[] = useMemo(() => {
    return [...agents]
      .sort((a, b) => quad.value(b) - quad.value(a))
      .slice(0, CHART_CAP)
      .map((agent) => ({
        id: agent.id,
        name: agent.name,
        value: quad.value(agent),
        display: quad.format(agent),
        tone: quad.tone?.(agent) ?? "amber",
      }));
  }, [agents, quad]);

  const series: OverlaySeries[] = useMemo(() => {
    return marked.map((agent, agentIndex) => ({
      id: agent.id,
      name: agent.name,
      color: COMPARE_COLORS[agentIndex] ?? "#ececec",
      values: sparkFromSnapshots(details[agentIndex], quad.spark, "7d", quad.value(agent)),
    }));
  }, [details, marked, quad]);

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
