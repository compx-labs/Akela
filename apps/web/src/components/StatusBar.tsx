import { listAgents } from "../lib/mockSeries";
import { viewByPath } from "../lib/nav";

export default function StatusBar({ pathname }: { pathname: string }) {
  const view = viewByPath(pathname);
  const n = listAgents().length;

  return (
    <footer className="flex h-6 shrink-0 items-center gap-3 border-t border-hair bg-void px-2 text-[10px] uppercase tracking-wide">
      <span className="text-up">live</span>
      <span className="text-hair">|</span>
      <span className="text-muted">{n} agents</span>
      <span className="text-hair">|</span>
      <span className="text-muted">{view.label}</span>
      <span className="ml-auto text-label">akela value $ is a model, not an offer</span>
    </footer>
  );
}
