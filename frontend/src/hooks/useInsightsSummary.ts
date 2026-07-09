import { useQuery } from "@tanstack/react-query";
import { fetchInsightsSummary } from "../api/insights";

const INSIGHTS_STALE_TIME_MS = 5 * 60 * 1000;

export function useInsightsSummary() {
  return useQuery({
    queryKey: ["insightsSummary"] as const,
    queryFn: fetchInsightsSummary,
    staleTime: INSIGHTS_STALE_TIME_MS,
  });
}
