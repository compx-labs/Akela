import {
  CONSISTENCY_CURVE,
  CONSISTENCY_MAX,
  CONSISTENCY_MIN,
  SCORE_FORMULA,
  SCORE_WEIGHTS,
  VALUE_A,
  VALUE_B,
  VALUE_FORMULA,
} from "@akela/core";
import Pane from "../components/Pane";
import { useFormula } from "../hooks/useAkela";

export default function FormulaPage() {
  const query = useFormula();
  const value = query.data?.value;
  const score = query.data?.score;
  const a = value?.a ?? VALUE_A;
  const b = value?.b ?? VALUE_B;
  const cMin = value?.consistency.min ?? CONSISTENCY_MIN;
  const cMax = value?.consistency.max ?? CONSISTENCY_MAX;
  const weights = score?.weights ?? SCORE_WEIGHTS;
  const valueFormula = value?.formula ?? VALUE_FORMULA;
  const scoreFormula = score?.formula ?? SCORE_FORMULA;
  const curve = value?.consistency.formula ?? CONSISTENCY_CURVE;
  const meta = query.isLoading ? "loading knobs" : query.isError ? "api unreachable · core defaults" : "live knobs";

  return (
    <div className="grid min-h-0 flex-1 grid-cols-2 grid-rows-2 overflow-hidden [&>*]:-mb-px [&>*]:-mr-px">
      <Pane title="Value $" titleClass="text-label" meta={meta} index={0}>
        <p className="font-semibold tabular-nums text-fg">{valueFormula}</p>
        <dl className="mt-2 grid grid-cols-[64px_1fr] gap-x-2 gap-y-1 text-[12px]">
          <dt className="text-label">a</dt>
          <dd className="text-fg">{a.toFixed(2)} — held / avg equity weighted higher</dd>
          <dt className="text-label">b</dt>
          <dd className="text-fg">{b.toFixed(2)} — window USD volume</dd>
          <dt className="text-muted">held</dt>
          <dd className="text-fg">average equity held (trust)</dd>
          <dt className="text-cyan">vol</dt>
          <dd className="text-fg">USD volume in the selected window</dd>
        </dl>
      </Pane>
      <Pane title="Akela Score" titleClass="text-fg" meta="0–100" index={1}>
        <p className="font-semibold text-fg">{scoreFormula}</p>
        <ul className="mt-2 space-y-1 text-[12px] text-fg">
          <li>
            <span className="text-up">Activity</span> — {weights.activity.toFixed(2)} · tx cadence, active days
          </li>
          <li>
            <span className="text-cyan">Usefulness</span> — {weights.usefulness.toFixed(2)} · service / interaction
            quality proxy
          </li>
          <li>
            <span className="text-orange">Trust</span> — {weights.trust.toFixed(2)} · held equity, not a reputation
            marketplace
          </li>
        </ul>
      </Pane>
      <Pane title="Consistency multiplier" titleClass="text-label" meta={`${cMin.toFixed(2)}–${cMax.toFixed(2)}`} index={2}>
        <p className="text-fg">
          First-class multiplier from on-chain proxies: coverage, gap penalty, cadence, last-seen.
        </p>
        <p className="mt-2 tabular-nums text-fg">{curve}</p>
        <ul className="mt-2 space-y-1 text-[12px]">
          <li className="text-up">&gt;= 1.00 tight cadence</li>
          <li className="text-down">&lt; 1.00 gapped / bursty</li>
        </ul>
      </Pane>
      <Pane title="Scope" titleClass="text-cyan" meta="not a marketplace" index={3}>
        <ul className="space-y-1 text-[12px] text-fg">
          <li>Registry + ranking only. No listings, no custody, no wallet product.</li>
          <li>Agents mint segments on NFD. This terminal does not register them.</li>
          <li>Unpriced assets stay neutral — never guessed. Fair path is Algorand.</li>
          <li className="text-label">Ranks and inspector math come from D1, not fixtures.</li>
        </ul>
      </Pane>
    </div>
  );
}
