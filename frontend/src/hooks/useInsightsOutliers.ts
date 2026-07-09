import { useQuery } from "@tanstack/react-query";
import { fetchInsightsOutliers } from "../api/insights";

const INSIGHTS_STALE_TIME_MS = 5 * 60 * 1000;

export function useInsightsOutliers() {
  return useQuery({
    queryKey: ["insightsOutliers"] as const,
    queryFn: fetchInsightsOutliers,
    staleTime: INSIGHTS_STALE_TIME_MS,
  });
}
