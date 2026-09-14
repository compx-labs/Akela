import { useEffect, useRef, useState } from "react";

export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export type Tick = { dir: "up" | "down"; n: number };

/**
 * Bloomberg-style tick flash: returns a token that changes whenever `value`
 * moves, along with the direction of the move. Key an element on `tick.n`
 * and give it `tick-up` / `tick-down` to replay the flash.
 */
export function useTickFlash(value: number): Tick | null {
  const prev = useRef(value);
  const [tick, setTick] = useState<Tick | null>(null);

  useEffect(() => {
    if (prev.current === value) {
      return;
    }
    const dir: Tick["dir"] = value > prev.current ? "up" : "down";
    prev.current = value;
    setTick((current) => ({ dir, n: (current?.n ?? 0) + 1 }));
  }, [value]);

  return tick;
}

/**
 * Eases a number towards `target` on mount and whenever it changes.
 * On first mount it settles in from just below the target so the figure
 * visibly "lands" instead of appearing.
 */
export function useCountUp(target: number, ms = 460): number {
  const from = useRef(target * 0.965);
  const [value, setValue] = useState(from.current);

  useEffect(() => {
    if (prefersReducedMotion()) {
      from.current = target;
      setValue(target);
      return;
    }
    const start = performance.now();
    const origin = from.current;
    let raf = 0;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / ms);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = origin + (target - origin) * eased;
      setValue(next);
      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        from.current = target;
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);

  return value;
}
