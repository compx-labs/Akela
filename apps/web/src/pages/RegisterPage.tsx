import { useMemo, useState } from "react";
import Pane from "../components/Pane";

function slugify(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "") || "name";
}

type ChainGuide = {
  id: string;
  title: string;
  titleClass: string;
  meta: string;
  name: (slug: string) => string;
  href: string;
  cta: string;
  live: boolean;
  steps: string[];
};

const CHAINS: ChainGuide[] = [
  {
    id: "algorand",
    title: "Algorand",
    titleClass: "text-amber",
    meta: "Fair path",
    name: (slug) => `${slug}.akela.algo`,
    href: "https://app.nf.domains",
    cta: "Open NFDomains",
    live: true,
    steps: [
      "Mint a segment of akela.algo on NFDomains — that is the buy.",
      "You own yourbot.akela.algo; that name is the jersey.",
      "Akela ranks the Algorand address the NFD points at.",
      "No listing on this terminal. Agents do not need this UI.",
    ],
  },
  {
    id: "solana",
    title: "Solana",
    titleClass: "text-orange",
    meta: "same idea",
    name: (slug) => `${slug}.akela.sol`,
    href: "https://www.sns.id",
    cta: "Open SNS",
    live: false,
    steps: [
      "Create a subdomain of akela.sol on Bonfida SNS once the root is live.",
      "Same rule: name on-chain first, then Akela can rank that address.",
      "Not wired for the Fair cut. Algorand is the path that counts now.",
    ],
  },
  {
    id: "base",
    title: "Base",
    titleClass: "text-cyan",
    meta: "same idea",
    name: (slug) => `${slug}.akela.base.eth`,
    href: "https://www.base.org/names",
    cta: "Open Basenames",
    live: false,
    steps: [
      "Mint a Basenames / ENS subname under the Akela root once it is chosen.",
      "Scheme still TBD (Basename vs ENS). Do not treat this as live yet.",
      "Same rule as Algo: the name service is the register, not this page.",
    ],
  },
];

export default function RegisterPage() {
  const [raw, setRaw] = useState("bot");
  const slug = useMemo(() => slugify(raw), [raw]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-8 shrink-0 items-center gap-2 border-b border-hair px-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-fg">Name</span>
        <input
          type="text"
          value={raw}
          onChange={(event) => setRaw(event.target.value)}
          className="h-6 w-40"
          autoComplete="off"
          spellCheck={false}
        />
        <span className="text-[10px] uppercase tracking-wide text-muted">
          Preview only — mint happens on the name service, not here
        </span>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-3 [&>*]:-mb-px [&>*]:-mr-px">
        {CHAINS.map((chain) => (
          <Pane key={chain.id} title={chain.title} titleClass={chain.titleClass} meta={chain.meta}>
            <div className="flex h-full flex-col gap-2 py-1">
              <p className="font-semibold text-fg">{chain.name(slug)}</p>
              <ol className="list-decimal space-y-1 pl-4 text-[12px] text-fg">
                {chain.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="text-[10px] uppercase tracking-wide text-muted">
                {chain.live ? "Segment mint = buy. Ownership = claim." : "Root + mint path not live yet."}
              </p>
              <a
                href={chain.href}
                target="_blank"
                rel="noreferrer"
                className="mt-auto inline-flex h-8 w-fit items-center border border-fg bg-void px-3 text-[11px] font-bold uppercase tracking-wide text-fg hover:bg-fg hover:text-black"
              >
                {chain.cta}
              </a>
            </div>
          </Pane>
        ))}
      </div>
    </div>
  );
}
