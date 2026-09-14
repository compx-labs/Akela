import type { ReactNode } from "react";
import { useTickFlash } from "../hooks/useMotion";

type TickValueProps = {
  /** Raw numeric value; direction of change drives the flash colour. */
  value: number;
  children: ReactNode;
  className?: string;
};

/** Wraps a formatted figure and flashes green/red when the underlying number moves. */
export default function TickValue({ value, children, className = "" }: TickValueProps) {
  const tick = useTickFlash(value);
  return (
    <span key={tick?.n ?? 0} className={`-mx-0.5 px-0.5 ${tick ? `tick-${tick.dir}` : ""} ${className}`}>
      {children}
    </span>
  );
}
