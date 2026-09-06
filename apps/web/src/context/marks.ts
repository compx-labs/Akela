import { createContext } from "react";

export type MarksContextValue = {
  markedIds: string[];
  flash: string | null;
  toggleMark: (id: string) => void;
  clearMarks: () => void;
  isMarked: (id: string) => boolean;
};

export const MarksContext = createContext<MarksContextValue | null>(null);
