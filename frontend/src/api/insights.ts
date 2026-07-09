import { API_BASE_URL } from "./apiClient";
import type { InsightsOutliers, InsightsSummary } from "./types";

export async function fetchInsightsSummary(): Promise<InsightsSummary> {
  const response = await fetch(`${API_BASE_URL}/insights/summary`);

  if (!response.ok) {
    throw new Error(`Failed to fetch insights summary: ${response.status}`);
  }

  return response.json() as Promise<InsightsSummary>;
}

export async function fetchInsightsOutliers(): Promise<InsightsOutliers> {
  const response = await fetch(`${API_BASE_URL}/insights/outliers`);

  if (!response.ok) {
    throw new Error(`Failed to fetch insights outliers: ${response.status}`);
  }

  return response.json() as Promise<InsightsOutliers>;
}
