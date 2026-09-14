import { useQuery } from "@tanstack/react-query";
import { fetchAgent, fetchBoard, fetchFormula, toAgentSummary } from "../lib/api";
import type { BoardId, WindowId } from "../types";

export function useBoard(board: BoardId, windowId: WindowId) {
  return useQuery({
    queryKey: ["board", board, windowId],
    queryFn: async () => {
      const payload = await fetchBoard(board, windowId);
      return payload.agents.map(toAgentSummary);
    },
  });
}

export function useAgentDetail(id: string | undefined) {
  return useQuery({
    queryKey: ["agent", id],
    queryFn: () => fetchAgent(id as string),
    enabled: Boolean(id),
  });
}

export function useFormula() {
  return useQuery({
    queryKey: ["formula"],
    queryFn: fetchFormula,
  });
}
