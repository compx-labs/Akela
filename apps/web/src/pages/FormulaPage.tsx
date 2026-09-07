import Pane from "../components/Pane";

export default function FormulaPage() {
  return (
    <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 overflow-hidden [&>*]:-mb-px [&>*]:-mr-px">
      <Pane title="Value $" titleClass="text-label" meta="hero metric">
        <p className="font-semibold tabular-nums text-fg">
          Value = (a × avg_equity_held + b × usd_volume) × consistency
        </p>
        <dl className="mt-2 grid grid-cols-[64px_1fr] gap-x-2 gap-y-1 text-[12px]">
          <dt className="text-label">a</dt>
          <dd className="text-fg">0.65 — held / avg equity weighted higher</dd>
          <dt className="text-label">b</dt>
          <dd className="text-fg">0.35 — window USD volume</dd>
          <dt className="text-muted">held</dt>
          <dd className="text-fg">average equity held (trust)</dd>
          <dt className="text-cyan">vol</dt>
          <dd className="text-fg">USD volume in the selected window</dd>
        </dl>
        <p className="mt-3 text-[10px] uppercase tracking-wide text-label">This is a model, not an offer.</p>
      </Pane>
      <Pane title="Akela Score" titleClass="text-fg" meta="0–100">
        <p className="font-semibold text-fg">Score = 0.35 Activity + 0.40 Usefulness + 0.25 Trust</p>
        <ul className="mt-2 space-y-1 text-[12px] text-fg">
          <li>
            <span className="text-up">Activity</span> — tx cadence, active days
          </li>
          <li>
            <span className="text-cyan">Usefulness</span> — service / interaction quality proxy
          </li>
          <li>
            <span className="text-orange">Trust</span> — held equity, not a reputation marketplace
          </li>
        </ul>
      </Pane>
      <Pane title="Consistency multiplier" titleClass="text-label" meta="0.50–1.20">
        <p className="text-fg">
          First-class multiplier from on-chain proxies: active days, gap penalty, cadence.
        </p>
        <p className="mt-2 tabular-nums text-fg">C = clip(0.50, 1.20, f(active_days, gaps, cadence))</p>
        <ul className="mt-2 space-y-1 text-[12px]">
          <li className="text-up">&gt;= 1.00 tight cadence</li>
          <li className="text-down">&lt; 1.00 gapped / bursty</li>
        </ul>
      </Pane>
      <Pane title="Scope" titleClass="text-cyan" meta="not a marketplace">
        <ul className="space-y-1 text-[12px] text-fg">
          <li>Registry + ranking only. No listings, no custody, no wallet product.</li>
          <li>Agents mint segments on NFD / SNS / Basenames. This terminal does not register them.</li>
          <li>Price source TBD. Unpriced assets stay neutral — never guessed.</li>
          <li className="text-label">Dummy figures on this terminal are UI fixtures.</li>
        </ul>
      </Pane>
    </div>
  );
}
