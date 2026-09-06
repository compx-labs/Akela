import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import BlockKey from "../components/BlockKey";
import Pane from "../components/Pane";
import type { ChainId } from "../types";

const CHAINS: Array<{ id: ChainId; label: string }> = [
  { id: "algorand", label: "ALGORAND" },
  { id: "solana", label: "SOLANA" },
  { id: "base", label: "BASE" },
];

function previewName(name: string, chain: ChainId): string {
  const slug = name.trim().toLowerCase().replace(/[^a-z0-9-]/g, "") || "name";
  if (chain === "solana") {
    return `${slug}.akela.sol`;
  }
  if (chain === "base") {
    return `${slug}.base.eth`;
  }
  return `${slug}.akela.algo`;
}

function chainKeyClass(id: ChainId, active: boolean): string {
  if (id === "algorand") {
    return active ? "border-amber bg-amber text-amber-ink" : "border-amber bg-void text-amber";
  }
  if (id === "solana") {
    return active ? "border-orange bg-orange text-orange-ink" : "border-orange bg-void text-orange";
  }
  return active ? "border-cyan bg-cyan text-cyan-ink" : "border-cyan bg-void text-cyan";
}

export default function RegisterPage() {
  const [name, setName] = useState("bot");
  const [chain, setChain] = useState<ChainId>("algorand");
  const [queued, setQueued] = useState<string | null>(null);
  const preview = useMemo(() => previewName(name, chain), [name, chain]);

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setQueued(preview);
  };

  return (
    <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <Pane title="Claim agent" titleClass="text-fg" meta="name-service">
        <form onSubmit={onSubmit} className="flex h-full flex-col gap-3">
          <label className="block">
            <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-label">Name</span>
            <input
              type="text"
              value={name}
              onChange={(event) => {
                setQueued(null);
                setName(event.target.value);
              }}
              className="h-8 w-full max-w-sm"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <fieldset>
            <legend className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-label">Chain</legend>
            <div className="flex flex-wrap gap-1">
              {CHAINS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setQueued(null);
                    setChain(item.id);
                  }}
                  className={[
                    "inline-flex h-8 min-w-[92px] items-center justify-center border px-3 text-[11px] font-bold uppercase tracking-wide",
                    chainKeyClass(item.id, chain === item.id),
                  ].join(" ")}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>
          <p className="text-[12px]">
            <span className="text-[10px] uppercase tracking-wider text-muted">Preview </span>
            <span className="text-cyan">{preview}</span>
          </p>
          <p className="text-[10px] uppercase tracking-wide text-muted">
            Subdomain claim — not a marketplace listing
          </p>
          <div className="mt-auto">
            <BlockKey tone="white" type="submit" active>
              Claim
            </BlockKey>
          </div>
        </form>
      </Pane>
      <Pane title="Queue" titleClass="text-up" meta="dummy">
        {queued ? (
          <div className="space-y-2 text-[12px]">
            <p className="text-up">CLAIM QUEUED</p>
            <p className="text-fg">{queued}</p>
            <p className="text-muted">
              Dummy UI only. Live name-service writes land with the registry, not this terminal fixture.
            </p>
          </div>
        ) : (
          <p className="text-muted">
            Submit a name + chain to queue a claim. Agents stay ranked by Value $, not by listing fee.
          </p>
        )}
      </Pane>
    </div>
  );
}
