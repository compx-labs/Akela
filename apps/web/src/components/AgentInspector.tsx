import { useMemo, useState } from "react";
import { agentLastSeen, agentSparkValues, modelValue, SPARK, VALUE_A, VALUE_B } from "../lib/mockSeries";
import { formatDelta, formatMult, formatScore, formatUsd } from "../lib/format";
import type { AgentSummary } from "../types";
import ChainGlyphs from "./ChainGlyphs";
import Sparkline from "./Sparkline";
import StatusGlyph from "./StatusGlyph";

type SparkWindow = "7d" | "30d";

export default function AgentInspector({ agent }: { agent: AgentSummary }) {
  const [windowId, setWindowId] = useState<SparkWindow>("7d");
  const [copied, setCopied] = useState(false);
  const [nfd, setNfd] = useState(false);

  const valueSpark = useMemo(() => agentSparkValues(agent, "value", windowId), [agent, windowId]);
  const volumeSpark = useMemo(() => agentSparkValues(agent, "volume", windowId), [agent, windowId]);
  const scoreSpark = useMemo(() => agentSparkValues(agent, "score", windowId), [agent, windowId]);
  const modeled = modelValue(agent.held, agent.volumeUsd, agent.consistency);

  const copyName = async () => {
    try {
      await navigator.clipboard.writeText(agent.name);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto text-[12px]">
      <header className="flex h-6 shrink-0 items-center gap-2 border-b border-hair px-2">
        <h2 className="truncate font-semibold text-fg">{agent.name}</h2>
        <ChainGlyphs chains={agent.chains} />
        <span className="ml-auto">
          <StatusGlyph status={agent.status} />
        </span>
      </header>

      <div className="grid shrink-0 grid-cols-3 border-b border-hair">
        <Hero label="Value $" value={formatUsd(agent.valueUsd)} accent />
        <Hero label="Score" value={formatScore(agent.score)} />
        <Hero
          label="Cons"
          value={formatMult(agent.consistency)}
          tone={agent.consistency >= 1 ? "up" : "down"}
        />
      </div>

      <div className="grid shrink-0 grid-cols-3 border-b border-hair">
        <Hero label="Held / Trust $" value={formatUsd(agent.held)} compact />
        <Hero label="Volume $" value={formatUsd(agent.volumeUsd)} compact />
        <Hero
          label="Rising"
          value={formatDelta(agent.rising7d)}
          compact
          tone={agent.rising7d >= 0 ? "up" : "down"}
        />
      </div>

      <div className="shrink-0 border-b border-hair">
        <div className="flex h-5 items-center gap-1 px-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-label">Series</span>
          <div className="ml-auto flex gap-1">
            {(["7d", "30d"] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => setWindowId(id)}
                className={[
                  "h-4 min-w-[36px] border px-1.5 text-[10px] font-bold uppercase",
                  windowId === id ? "border-fg bg-fg text-black" : "border-hair bg-void text-muted hover:text-fg",
                ].join(" ")}
              >
                {id}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-px bg-hair">
          <SparkCell label="Value" color={SPARK.value} values={valueSpark} />
          <SparkCell label="Volume" color={SPARK.volume} values={volumeSpark} />
          <SparkCell label="Score" color={SPARK.score} values={scoreSpark} />
        </div>
      </div>

      <p className="border-b border-hair px-2 py-1.5 font-medium tabular-nums leading-5 text-fg">
        VALUE = ({VALUE_A}×{formatUsd(agent.held)} + {VALUE_B}×{formatUsd(agent.volumeUsd)}) ×{" "}
        {formatMult(agent.consistency)} = {formatUsd(modeled)}
      </p>
      <p className="border-b border-hair px-2 py-0.5 text-[10px] uppercase tracking-wide text-label">
        model not an offer
      </p>

      <dl className="grid shrink-0 grid-cols-[72px_1fr] gap-x-2 gap-y-0.5 border-b border-hair px-2 py-1.5 text-[11px]">
        <dt className="text-muted">Claim</dt>
        <dd className="text-cyan">REGISTERED</dd>
        <dt className="text-muted">NFD</dt>
        <dd className="text-fg">{agent.name.endsWith(".algo") ? "queued stub" : "n/a"}</dd>
        <dt className="text-muted">Last seen</dt>
        <dd className="text-fg">{agentLastSeen(agent)}</dd>
        <dt className="text-muted">Active</dt>
        <dd className="text-fg">{agent.activity} days</dd>
      </dl>

      <div className="flex gap-1 px-2 py-2">
        <button
          type="button"
          onClick={copyName}
          className="inline-flex h-6 min-w-[84px] items-center justify-center border border-fg bg-void px-2 text-[10px] font-bold uppercase text-fg hover:bg-fg hover:text-black"
        >
          {copied ? "Copied" : "Copy name"}
        </button>
        <button
          type="button"
          onClick={() => {
            setNfd(true);
            window.setTimeout(() => setNfd(false), 1200);
          }}
          className="inline-flex h-6 min-w-[84px] items-center justify-center border border-cyan bg-void px-2 text-[10px] font-bold uppercase text-cyan hover:bg-cyan hover:text-cyan-ink"
        >
          {nfd ? "Nfd stub" : "Open NFD"}
        </button>
      </div>
    </div>
  );
}

function Hero({
  label,
  value,
  accent = false,
  compact = false,
  tone,
}: {
  label: string;
  value: string;
  accent?: boolean;
  compact?: boolean;
  tone?: "up" | "down";
}) {
  const valueClass = tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-fg";
  return (
    <div className="border-r border-hair px-2 py-1 last:border-r-0">
      <p className={`text-[10px] font-semibold uppercase tracking-wider ${accent ? "text-label" : "text-muted"}`}>
        {label}
      </p>
      <p className={`${compact ? "text-[12px]" : "text-[16px]"} font-semibold tabular-nums leading-tight ${valueClass}`}>
        {value}
      </p>
    </div>
  );
}

function SparkCell({ label, color, values }: { label: string; color: string; values: number[] }) {
  return (
    <div className="bg-panel px-2 py-1">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <Sparkline values={values} color={color} className="mt-0.5 h-8 w-full" />
    </div>
  );
}
