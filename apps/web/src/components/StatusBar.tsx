import { useBoard } from "../hooks/useAkela";
import { useMarks } from "../hooks/useMarks";
import { viewByPath } from "../lib/nav";

export default function StatusBar({ pathname }: { pathname: string }) {
  const view = viewByPath(pathname);
  const query = useBoard("value", "7d");
  const n = query.data?.length ?? 0;
  const { markedIds, flash } = useMarks();

  return (
    <footer className="flex h-6 shrink-0 items-center gap-3 border-t border-hair bg-void px-2 text-[10px] uppercase tracking-wide">
      {query.isError ? (
        <span className="text-down">api down</span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-up">
          <span className="live-dot" aria-hidden="true" />
          live
        </span>
      )}
      <span className="text-hair">|</span>
      <span className="text-muted">{query.isLoading ? "loading" : `${n} agents`}</span>
      <span className="text-hair">|</span>
      <span key={view.id} className="anim-fade text-muted">
        {view.label}
      </span>
      {markedIds.length > 0 ? (
        <span className="anim-fade inline-flex items-center gap-3">
          <span className="text-hair">|</span>
          <span className="text-cyan">
            marks <span key={markedIds.length} className="anim-fade inline-block tabular-nums">{markedIds.length}</span>/8
          </span>
        </span>
      ) : null}
      {flash ? (
        <span key={flash} className="inline-flex items-center gap-3" role="status">
          <span className="text-hair">|</span>
          <span className="anim-flash font-semibold text-down">{flash}</span>
        </span>
      ) : null}
      <span className="ml-auto text-label">akela value $ is a model, not an offer</span>
    </footer>
  );
}
