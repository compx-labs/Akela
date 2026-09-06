import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { HINTS, viewByPath } from "../lib/nav";
import WolfMark from "./WolfMark";

export default function CommandStrip() {
  const { pathname } = useLocation();
  const view = viewByPath(pathname);
  const [clock, setClock] = useState(() => stamp());

  useEffect(() => {
    const id = window.setInterval(() => setClock(stamp()), 1000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <header className="flex h-7 shrink-0 items-center gap-3 border-b border-hair bg-void px-2 text-[10px] uppercase tracking-wide">
      <WolfMark className="h-6 w-6 shrink-0" />
      <span className="font-semibold text-label">Akela</span>
      <span className="text-muted">agent terminal</span>
      <span className="text-hair">|</span>
      <span className="hidden truncate text-muted lg:inline">{HINTS.join(" · ")}</span>
      <span className="ml-auto text-cyan">algorand · solana · base</span>
      <span className="text-hair">|</span>
      <span className="text-label">{view.label}</span>
      <span className="text-hair">|</span>
      <span className="tabular-nums text-up">{clock}</span>
    </header>
  );
}

function stamp(): string {
  return new Date().toISOString().slice(11, 19) + "Z";
}
