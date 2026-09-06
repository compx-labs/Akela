import { useContext } from "react";
import { MarksContext, type MarksContextValue } from "../context/marks";

export function useMarks(): MarksContextValue {
  const ctx = useContext(MarksContext);
  if (!ctx) {
    throw new Error("useMarks requires MarksProvider");
  }
  return ctx;
}
