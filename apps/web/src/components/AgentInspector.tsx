import { VALUE_A, VALUE_B, modelValue } from "@akela/core";
import { useMemo, useState } from "react";
import { useAgentDetail } from "../hooks/useAkela";
import { lastSeenLabel, sparkFromSnapshots } from "../lib/api";
import { SPARK } from "../lib/chart";
import { formatMult, formatRising, formatScore, formatUsd } from "../lib/format";
import type { AgentSummary } from "../types";
import ChainGlyphs from "./ChainGlyphs";
import Sparkline from "./Sparkline";
import StatusGlyph from "./StatusGlyph";
import TickValue from "./TickValue";

type SparkWindow = "7d" | "30d";

const NFD_APP = "https://app.nf.domains/name";

export default function AgentInspector({ agent }: { agent: AgentSummary }) {
  const [windowId, setWindowId] = useState<SparkWindow>("7d");
  const [copied, setCopied] = useState(false);
  const detail = useAgentDetail(agent.id);
  const nfd = agent.name.endsWith(".algo");

  const valueSpark = useMemo(
    () => sparkFromSnapshots(detail.data, "value", windowId, agent.valueUsd),
    [agent.valueUsd, detail.data, windowId],
  );
  const volumeSpark = useMemo(
    () => sparkFromSnapshots(detail.data, "volume", windowId, agent.volumeUsd),
    [agent.volumeUsd, detail.data, windowId],
  );
  const scoreSpark = useMemo(
    () => sparkFromSnapshots(detail.data, "score", windowId, agent.score),
    [agent.score, detail.data, windowId],
  );
  const modeled = modelValue(agent.held, agent.volumeUsd, agent.consistency);
  const latest = detail.data?.snapshots
    .slice()
    .sort((a, b) => Date.parse(b.capturedAt) - Date.parse(a.capturedAt))[0];
  const activeDays = latest?.windows[windowId]?.activeDays;

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
        <h2 key={agent.id} className="anim-fade truncate font-semibold text-fg" title={agent.name}>
          {agent.name}
        </h2>
        <ChainGlyphs chains={agent.chains} />
        <span className="ml-auto">
          <StatusGlyph status={agent.status} />
        </span>
      </header>

      <div className="relative z-20 grid shrink-0 grid-cols-3 border-b border-hair">
        <Hero label="Value $" raw={agent.valueUsd} value={formatUsd(agent.valueUsd)} accent />
        <Hero
          label="Score"
          raw={agent.score}
          value={formatScore(agent.score)}
          hint="Composite 0–100 rank: 35% activity + 40% usefulness + 25% trust."
        />
        <Hero
          label="Consistency"
          raw={agent.consistency}
          value={formatMult(agent.consistency)}
          tone={agent.consistency >= 1 ? "up" : "down"}
          hintAlign="end"
          hint="Consistency multiplier, clipped to 0.50–1.20. ≥ 1.00 is a tight cadence; below 1.00 is gappy / bursty."
        />
      </div>

      <div className="relative z-10 grid shrink-0 grid-cols-3 border-b border-hair">
        <Hero
          label="Held / Trust $"
          raw={agent.held}
          value={formatUsd(agent.held)}
          compact
          hint="Current equity held (wallet value). Also the trust pillar's main input."
        />
        <Hero
          label="Volume $"
          raw={agent.volumeUsd}
          value={formatUsd(agent.volumeUsd)}
          compact
          hint="USD volume in the selected scoring window."
        />
        <Hero
          label="Rising"
          raw={agent.rising7d}
          value={formatRising(agent.rising7d)}
          compact
          tone={agent.rising7d >= 1 ? "up" : "down"}
          hintAlign="end"
          hint="7-day volume pace vs 30-day pace: (vol7/7) ÷ (vol30/30), shown as % vs 1.0. Negative means recent daily volume has cooled."
        />
      </div>

      <div className="shrink-0 border-b border-hair">
        <div className="flex h-5 items-center gap-1 px-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-label">Series</span>
          <div className="ml-auto flex gap-1" role="tablist" aria-label="Series window">
            {(["7d", "30d"] as const).map((id) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={windowId === id}
                onClick={() => setWindowId(id)}
                className={[
                  "h-4 min-w-[36px] border px-1.5 text-[10px] font-bold uppercase",
                  windowId === id ? "border-fg bg-fg text-black" : "border-hair bg-void text-muted hover:border-muted hover:text-fg",
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
        {formatMult(agent.consistency)} ={" "}
        <TickValue value={modeled} className="font-semibold">
          {formatUsd(modeled)}
        </TickValue>
      </p>

      <dl className="grid shrink-0 grid-cols-[84px_1fr] gap-x-2 gap-y-0.5 border-b border-hair px-2 py-1.5 text-[11px]">
        <dt className="text-muted">Claim</dt>
        <dd className="text-cyan">REGISTERED</dd>
        <dt className="text-muted">NFD</dt>
        <dd className="text-fg">{nfd ? "live" : "n/a"}</dd>
        <dt className="text-muted">Last seen</dt>
        <dd className="text-fg">{lastSeenLabel(agent.lastSeenAt)}</dd>
        <dt className="text-muted">Activity</dt>
        <dd className="text-fg">{formatScore(agent.activity)}</dd>
        <dt className="text-muted">Active days</dt>
        <dd className="text-fg">{activeDays ?? "—"}</dd>
        <dt className="text-muted">Eligible</dt>
        <dd className={agent.eligible ? "text-up" : "text-down"}>{agent.eligible ? "yes" : "no"}</dd>
      </dl>

      <div className="flex gap-1 px-2 py-2">
        <button
          type="button"
          onClick={copyName}
          aria-live="polite"
          className={[
            "inline-flex h-6 min-w-[84px] items-center justify-center border bg-void px-2 text-[10px] font-bold uppercase",
            copied ? "border-up text-up" : "border-fg text-fg hover:bg-fg hover:text-black",
          ].join(" ")}
        >
          {copied ? "Copied ✓" : "Copy name"}
        </button>
        {nfd ? (
          <a
            href={`${NFD_APP}/${encodeURIComponent(agent.name)}`}
            target="_blank"
            rel="noreferrer"
            className="group inline-flex h-6 min-w-[84px] items-center justify-center gap-1 border border-cyan bg-void px-2 text-[10px] font-bold uppercase text-cyan hover:bg-cyan hover:text-cyan-ink"
          >
            Open NFD
            <span aria-hidden="true" className="transition-transform duration-150 group-hover:translate-x-0.5">
              →
            </span>
          </a>
        ) : null}
      </div>
    </div>
  );
}

function Hero({
  label,
  value,
  raw,
  accent = false,
  compact = false,
  tone,
  hint,
  hintAlign = "start",
}: {
  label: string;
  value: string;
  raw: number;
  accent?: boolean;
  compact?: boolean;
  tone?: "up" | "down";
  hint?: string;
  hintAlign?: "start" | "end";
}) {
  const valueClass = tone === "up" ? "text-up" : tone === "down" ? "text-down" : "text-fg";
  return (
    <div className="border-r border-hair px-2 py-1 last:border-r-0">
      <p
        className={`flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider ${accent ? "text-label" : "text-muted"}`}
      >
        <span className="truncate">{label}</span>
        {hint ? <HintMark text={hint} align={hintAlign} /> : null}
      </p>
      <p className={`${compact ? "text-[12px]" : "text-[16px]"} font-semibold tabular-nums leading-tight ${valueClass}`}>
        <TickValue value={raw}>{value}</TickValue>
      </p>
    </div>
  );
}

function HintMark({ text, align }: { text: string; align: "start" | "end" }) {
  return (
    <span className="group relative inline-flex shrink-0">
      <button
        type="button"
        aria-label="About this metric"
        className="inline-flex h-3.5 w-3.5 cursor-help items-center justify-center border border-hair text-[8px] font-bold leading-none text-muted hover:border-muted hover:text-fg"
      >
        ?
      </button>
      <span
        role="tooltip"
        className={[
          "pointer-events-none invisible absolute top-full z-30 mt-1 w-max max-w-[220px] border border-hair bg-panel px-1.5 py-1 text-left text-[10px] font-medium normal-case leading-snug tracking-normal text-fg group-hover:visible group-focus-within:visible",
          align === "end" ? "right-0" : "left-0",
        ].join(" ")}
      >
        {text}
      </span>
    </span>
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
