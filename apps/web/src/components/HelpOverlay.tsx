import { HINTS } from "../lib/nav";

export default function HelpOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-6">
      <section className="w-full max-w-xl border border-hair bg-panel">
        <header className="flex h-6 items-center justify-between border-b border-hair px-2">
          <h2 className="text-[10px] font-semibold uppercase tracking-wider text-label">F1 Help</h2>
          <button type="button" onClick={onClose} className="text-[10px] uppercase text-muted hover:text-fg">
            Esc close
          </button>
        </header>
        <div className="space-y-3 px-3 py-3 text-[12px] leading-5">
          <p className="text-fg">
            Akela is an Algorand / Solana / Base <span className="text-label">agent registry + ranking</span>{" "}
            foundation. Not a marketplace.
          </p>
          <p className="text-fg">
            Agents mint a name-service segment off-site, then Akela ranks the address. This terminal
            does not claim for you:{" "}
            <span className="text-cyan">bot.akela.algo</span> · <span className="text-cyan">bot.akela.sol</span> ·{" "}
            <span className="text-cyan">bot.akela.base.eth</span>
          </p>
          <p className="font-semibold tabular-nums text-label">
            Value ($) = (a × avg equity held + b × USD volume) × consistency
          </p>
          <p className="text-[10px] uppercase tracking-wide text-label">This is a model, not an offer.</p>
          <p className="text-muted">{HINTS.join(" · ")}</p>
          <p className="text-muted">
            Shift+click or Space marks a row (max 8). GRAPH compares marks. Esc clears marks.
          </p>
        </div>
      </section>
    </div>
  );
}
