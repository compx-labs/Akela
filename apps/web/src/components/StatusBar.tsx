import { useMarks } from "../hooks/useMarks";
import { listAgents } from "../lib/mockSeries";
import { viewByPath } from "../lib/nav";

export default function StatusBar({ pathname }: { pathname: string }) {
  const view = viewByPath(pathname);
  const n = listAgents().length;
  const { markedIds, flash } = useMarks();

  return (
    <footer className="flex h-6 shrink-0 items-center gap-3 border-t border-hair bg-void px-2 text-[10px] uppercase tracking-wide">
      <span className="text-up">live</span>
      <span className="text-hair">|</span>
      <span className="text-muted">{n} agents</span>
      <span className="text-hair">|</span>
      <span className="text-muted">{view.label}</span>
      {markedIds.length > 0 ? (
        <>
          <span className="text-hair">|</span>
          <span className="text-cyan">marks {markedIds.length}/8</span>
        </>
      ) : null}
      {flash ? (
        <>
          <span className="text-hair">|</span>
          <span className="text-down">{flash}</span>
        </>
      ) : null}
      <span className="ml-auto text-label">akela value $ is a model, not an offer</span>
    </footer>
  );
}
