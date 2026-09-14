import type { ReactNode } from "react";

export default function SplitInspect({ list, detail }: { list: ReactNode; detail: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-1">
      <div className="flex min-h-0 w-[58%] min-w-0 flex-col">{list}</div>
      <aside className="flex min-h-0 w-[42%] min-w-0 flex-col border-l border-hair bg-panel">{detail}</aside>
    </div>
  );
}

export function InspectorEmpty({ hint = "↑ ↓ move  ·  click to select" }: { hint?: string }) {
  return (
    <div className="anim-fade flex h-full flex-col items-center justify-center gap-2">
      <p className="inline-flex items-center gap-2 text-[12px] text-muted">
        <span className="caret text-label" aria-hidden="true" />
        SELECT AN AGENT →
      </p>
      <p className="text-[10px] uppercase tracking-wide text-muted/60">{hint}</p>
    </div>
  );
}
