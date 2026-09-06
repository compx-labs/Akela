import type { ViewTone } from "./nav";

export const TONE: Record<ViewTone, { idle: string; active: string }> = {
  amber: {
    idle: "border-amber bg-void text-amber hover:bg-amber/10",
    active: "border-amber bg-amber text-amber-ink",
  },
  orange: {
    idle: "border-orange bg-void text-orange hover:bg-orange/10",
    active: "border-orange bg-orange text-orange-ink",
  },
  green: {
    idle: "border-up bg-void text-up hover:bg-up/10",
    active: "border-up bg-up text-black",
  },
  cyan: {
    idle: "border-cyan bg-void text-cyan hover:bg-cyan/10",
    active: "border-cyan bg-cyan text-cyan-ink",
  },
  white: {
    idle: "border-fg bg-void text-fg hover:bg-fg/10",
    active: "border-fg bg-fg text-black",
  },
  violet: {
    idle: "border-graph bg-void text-graph hover:bg-graph/10",
    active: "border-graph bg-graph text-graph-ink",
  },
};

export function toneClass(tone: ViewTone, active: boolean): string {
  return active ? TONE[tone].active : TONE[tone].idle;
}
