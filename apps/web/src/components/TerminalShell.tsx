import { type ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMarks } from "../hooks/useMarks";
import { VIEWS, viewByPath } from "../lib/nav";
import CommandStrip from "./CommandStrip";
import HelpOverlay from "./HelpOverlay";
import StatusBar from "./StatusBar";
import ViewKeys from "./ViewKeys";

export default function TerminalShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [help, setHelp] = useState(false);
  const { clearMarks } = useMarks();

  useEffect(() => {
    document.title = `AKELA · ${viewByPath(pathname).label}`;
  }, [pathname]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (help) {
          setHelp(false);
          return;
        }
        clearMarks();
        return;
      }
      if (event.key === "F1") {
        event.preventDefault();
        setHelp((open) => !open);
        return;
      }
      const view = VIEWS.find((item) => item.hint === event.key);
      if (view) {
        event.preventDefault();
        setHelp(false);
        navigate(view.to);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, help, clearMarks]);

  return (
    <div className="relative flex h-screen min-w-[1280px] flex-col bg-void text-fg">
      <CommandStrip />
      <div className="relative shrink-0">
        <ViewKeys />
        {/* Route sweep: a 1px amber line runs the width of the key row on every view change. */}
        <div key={pathname} aria-hidden="true" className="anim-sweep pointer-events-none absolute inset-x-0 bottom-0 h-px bg-label" />
      </div>
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div key={pathname} className="anim-view flex min-h-0 flex-1 flex-col">
          {children}
        </div>
      </main>
      <StatusBar pathname={pathname} />
      {help ? <HelpOverlay onClose={() => setHelp(false)} /> : null}
    </div>
  );
}
