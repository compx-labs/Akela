import type { ChainId } from "../types";

const CHAIN: Record<ChainId, { mark: string; className: string; title: string }> = {
  algorand: { mark: "A", className: "border-cyan text-cyan", title: "Algorand" },
  solana: { mark: "S", className: "border-label text-label", title: "Solana" },
  base: { mark: "B", className: "border-fg/70 text-fg", title: "Base" },
};

export default function ChainGlyphs({ chains }: { chains: ChainId[] }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {chains.map((chain) => {
        const item = CHAIN[chain];
        return (
          <span
            key={chain}
            title={item.title}
            className={`inline-flex h-3.5 w-3.5 items-center justify-center border text-[9px] font-semibold leading-none ${item.className}`}
          >
            {item.mark}
          </span>
        );
      })}
    </span>
  );
}
