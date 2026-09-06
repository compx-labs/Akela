import type { ReactNode } from "react";

export default function SplitInspect({ list, detail }: { list: ReactNode; detail: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-1">
      <div className="flex min-h-0 w-[58%] min-w-0 flex-col">{list}</div>
      <aside className="flex min-h-0 w-[42%] min-w-0 flex-col border-l border-hair bg-panel">{detail}</aside>
    </div>
  );
}

export function InspectorEmpty() {
  return (
    <div className="flex h-full items-center justify-center">
      <p className="text-[12px] text-muted">SELECT AN AGENT →</p>
    </div>
  );
}
