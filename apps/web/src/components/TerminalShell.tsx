import { type ReactNode, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMarks } from "../hooks/useMarks";
import { VIEWS } from "../lib/nav";
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
      <ViewKeys />
      <main className="flex min-h-0 flex-1 flex-col overflow-hidden">{children}</main>
      <StatusBar pathname={pathname} />
      {help ? <HelpOverlay onClose={() => setHelp(false)} /> : null}
    </div>
  );
}
