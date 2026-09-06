import { useCallback, useMemo, useRef, useState, type ReactNode } from "react";
import { MARK_LIMIT } from "../lib/mockSeries";
import { MarksContext } from "./marks";

export default function MarksProvider({ children }: { children: ReactNode }) {
  const [markedIds, setMarkedIds] = useState<string[]>([]);
  const [flash, setFlash] = useState<string | null>(null);
  const timer = useRef<number>(0);

  const showFlash = useCallback((message: string) => {
    setFlash(message);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setFlash(null), 2200);
  }, []);

  const toggleMark = useCallback(
    (id: string) => {
      setMarkedIds((prev) => {
        if (prev.includes(id)) {
          return prev.filter((item) => item !== id);
        }
        if (prev.length >= MARK_LIMIT) {
          window.setTimeout(() => showFlash("MARK LIMIT 8"), 0);
          return prev;
        }
        return [...prev, id];
      });
    },
    [showFlash],
  );

  const clearMarks = useCallback(() => {
    setMarkedIds([]);
    setFlash(null);
  }, []);

  const isMarked = useCallback((id: string) => markedIds.includes(id), [markedIds]);

  const value = useMemo(
    () => ({ markedIds, flash, toggleMark, clearMarks, isMarked }),
    [markedIds, flash, toggleMark, clearMarks, isMarked],
  );

  return <MarksContext.Provider value={value}>{children}</MarksContext.Provider>;
}
