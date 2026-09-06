import { Link } from "react-router-dom";
import { toneClass } from "../lib/keyTone";

type MarkKeysProps = {
  canMark: boolean;
  markCount: number;
  onMark: () => void;
  onClear: () => void;
};

export default function MarkKeys({ canMark, markCount, onMark, onClear }: MarkKeysProps) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={onMark}
        disabled={!canMark}
        className={[
          "inline-flex h-6 min-w-[56px] items-center justify-center border px-2 text-[10px] font-bold uppercase tracking-wide",
          canMark ? toneClass("cyan", false) : "cursor-not-allowed border-hair text-muted",
        ].join(" ")}
      >
        Mark
      </button>
      <button
        type="button"
        onClick={onClear}
        className="inline-flex h-6 min-w-[72px] items-center justify-center border border-fg bg-void px-2 text-[10px] font-bold uppercase text-fg hover:bg-fg hover:text-black"
      >
        Clear marks
      </button>
      <Link
        to="/graph"
        className={[
          "inline-flex h-6 min-w-[72px] items-center justify-center border px-2 text-[10px] font-bold uppercase tracking-wide",
          toneClass("violet", markCount >= 2),
        ].join(" ")}
      >
        Compare
      </Link>
      <span className="px-1 text-[10px] tabular-nums text-cyan">{markCount}/8</span>
    </div>
  );
}
