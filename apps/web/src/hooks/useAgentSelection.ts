import { useCallback, useEffect, useMemo, useState } from "react";
import type { AgentSummary } from "../types";

const F_KEYS = new Set(["F1", "F2", "F3", "F4", "F5", "F6"]);

export function useAgentSelection(agents: AgentSummary[]) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = useMemo(
    () => agents.find((agent) => agent.id === selectedId) ?? null,
    [agents, selectedId],
  );

  const select = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (F_KEYS.has(event.key) || event.metaKey || event.ctrlKey || event.altKey) {
        return;
      }
      if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
        return;
      }
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) {
        return;
      }
      if (agents.length === 0) {
        return;
      }
      event.preventDefault();
      const index = selectedId ? agents.findIndex((agent) => agent.id === selectedId) : -1;
      let next = index;
      if (event.key === "ArrowDown") {
        next = index < 0 ? 0 : Math.min(agents.length - 1, index + 1);
      } else {
        next = index < 0 ? agents.length - 1 : Math.max(0, index - 1);
      }
      setSelectedId(agents[next].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [agents, selectedId]);

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    const row = document.querySelector(`[data-agent-id="${selectedId}"]`);
    row?.scrollIntoView({ block: "nearest" });
  }, [selectedId, agents]);

  return { selected, selectedId, select };
}

export function agentRowClass(selected: boolean): string {
  return [
    "h-[22px] cursor-pointer border-b border-hair/80",
    selected ? "bg-amber text-amber-ink" : "hover:bg-fg/[0.04]",
  ].join(" ");
}
