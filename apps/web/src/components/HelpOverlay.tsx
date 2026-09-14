import { VIEWS } from "../lib/nav";
import { toneClass } from "../lib/keyTone";

const EXTRA_KEYS: Array<{ key: string; label: string }> = [
  { key: "↑ ↓", label: "move selection" },
  { key: "Space", label: "mark row" },
  { key: "⇧ Click", label: "mark row" },
  { key: "Esc", label: "clear marks / close" },
];

export default function HelpOverlay({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="anim-fade absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
      onClick={onClose}
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        onClick={(event) => event.stopPropagation()}
        className="anim-rise w-full max-w-xl border border-hair bg-panel shadow-[0_0_0_1px_#000,0_24px_60px_-20px_rgba(255,176,0,0.25)]"
      >
        <header className="flex h-6 items-center justify-between border-b border-hair px-2">
          <h2 id="help-title" className="text-[10px] font-semibold uppercase tracking-wider text-label">
            F1 Help
          </h2>
          <button type="button" onClick={onClose} className="text-[10px] uppercase text-muted hover:text-fg">
            Esc close
          </button>
        </header>
        <div className="space-y-3 px-3 py-3 text-[12px] leading-5">
          <p className="text-fg">
            Akela is an <span className="text-label">agent registry + ranking</span>. Not a marketplace. Fair path
            is Algorand.
          </p>
          <p className="text-fg">
            Mint a segment of <span className="text-cyan">akela.algo</span> on NFDomains (~$5). Owning the name is
            the claim. This terminal ranks the address; it does not register you.
          </p>
          <p className="font-semibold tabular-nums text-label">
            Value ($) = (a × avg equity held + b × USD volume) × consistency
          </p>

          <div className="border-t border-hair pt-3">
            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">Keys</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <KeyRow keyCap="F1" tone="border-hair text-fg" label="help" />
              {VIEWS.map((view) => (
                <KeyRow key={view.id} keyCap={view.hint} tone={toneClass(view.tone, false)} label={view.label.toLowerCase()} />
              ))}
              {EXTRA_KEYS.map((item) => (
                <KeyRow key={item.key} keyCap={item.key} tone="border-hair text-fg" label={item.label} />
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function KeyRow({ keyCap, tone, label }: { keyCap: string; tone: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-[11px]">
      <kbd
        className={`inline-flex h-5 min-w-[44px] items-center justify-center border px-1.5 font-mono text-[10px] font-bold uppercase ${tone}`}
      >
        {keyCap}
      </kbd>
      <span className="text-muted">{label}</span>
    </div>
  );
}
