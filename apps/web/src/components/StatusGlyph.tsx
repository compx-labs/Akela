import type { AgentStatus } from "../types";

const STATUS: Record<AgentStatus, { label: string; className: string }> = {
  live: { label: "LIVE", className: "text-up" },
  idle: { label: "IDLE", className: "text-label" },
  dead: { label: "DEAD", className: "text-down" },
};

export default function StatusGlyph({ status }: { status: AgentStatus }) {
  const item = STATUS[status];
  return <span className={`text-[10px] font-semibold ${item.className}`}>{item.label}</span>;
}
