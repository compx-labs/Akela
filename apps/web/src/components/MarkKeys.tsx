import { Link } from "react-router-dom";
import { toneClass } from "../lib/keyTone";

type MarkKeysProps = {
  canMark: boolean;
  markCount: number;
  onMark: () => void;
  onClear: () => void;
};

export default function MarkKeys({ canMark, markCount, onMark, onClear }: MarkKeysProps) {
  const armed = markCount >= 2;
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={onMark}
        disabled={!canMark}
        className={[
          "inline-flex h-6 min-w-[56px] items-center justify-center border px-2 text-[10px] font-bold uppercase tracking-wide",
          canMark ? toneClass("cyan", false) : "cursor-not-allowed border-hair text-muted/60",
        ].join(" ")}
      >
        Mark
      </button>
      <button
        type="button"
        onClick={onClear}
        disabled={markCount === 0}
        className={[
          "inline-flex h-6 min-w-[72px] items-center justify-center border px-2 text-[10px] font-bold uppercase",
          markCount > 0
            ? "border-fg bg-void text-fg hover:bg-fg hover:text-black"
            : "cursor-not-allowed border-hair text-muted/60",
        ].join(" ")}
      >
        Clear marks
      </button>
      <Link
        to="/graph"
        aria-disabled={!armed}
        className={[
          "group inline-flex h-6 min-w-[72px] items-center justify-center gap-1 border px-2 text-[10px] font-bold uppercase tracking-wide",
          armed ? toneClass("violet", true) : toneClass("violet", false),
        ].join(" ")}
      >
        Compare
        {armed ? (
          <span aria-hidden="true" className="anim-fade transition-transform duration-150 group-hover:translate-x-0.5">
            →
          </span>
        ) : null}
      </Link>
      <span className="px-1 text-[10px] tabular-nums text-cyan">
        <span key={markCount} className="anim-fade inline-block">
          {markCount}
        </span>
        /8
      </span>
    </div>
  );
}
