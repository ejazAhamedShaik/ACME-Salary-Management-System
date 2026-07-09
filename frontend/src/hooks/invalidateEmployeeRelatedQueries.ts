import type { QueryClient } from "@tanstack/react-query";

export function invalidateEmployeeRelatedQueries(queryClient: QueryClient): void {
  queryClient.invalidateQueries({ queryKey: ["employees"] });
  queryClient.invalidateQueries({ queryKey: ["insightsSummary"] });
  queryClient.invalidateQueries({ queryKey: ["insightsOutliers"] });
}
