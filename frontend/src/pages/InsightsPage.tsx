import { Alert, Divider, Empty, Spin } from "antd";
import { InsightsSummaryView } from "../components/InsightsSummaryView";
import { OutliersTable } from "../components/OutliersTable";
import { useInsightsSummary } from "../hooks/useInsightsSummary";
import { useInsightsOutliers } from "../hooks/useInsightsOutliers";

export function InsightsPage() {
  const summaryQuery = useInsightsSummary();
  const outliersQuery = useInsightsOutliers();

  const isSummaryEmpty =
    !!summaryQuery.data && Object.keys(summaryQuery.data.headcountByDepartment).length === 0;
  const isOutliersEmpty = !!outliersQuery.data && outliersQuery.data.outliersByDepartment.length === 0;

  return (
    <div data-testid="insights-page">
      <Divider orientation="left">Summary</Divider>
      {summaryQuery.isLoading ? (
        <div data-testid="summary-loading">
          <Spin />
        </div>
      ) : summaryQuery.isError ? (
        <div data-testid="summary-error">
          <Alert type="error" showIcon message="Couldn't load insights summary. Please try again." />
        </div>
      ) : isSummaryEmpty ? (
        <div data-testid="summary-empty">
          <Empty description="No insights available." />
        </div>
      ) : (
        <div data-testid="summary-content">
          <InsightsSummaryView summary={summaryQuery.data!} />
        </div>
      )}

      <Divider orientation="left">Outliers</Divider>
      {outliersQuery.isLoading ? (
        <div data-testid="outliers-loading">
          <Spin />
        </div>
      ) : outliersQuery.isError ? (
        <div data-testid="outliers-error">
          <Alert type="error" showIcon message="Couldn't load insights outliers. Please try again." />
        </div>
      ) : isOutliersEmpty ? (
        <div data-testid="outliers-empty">
          <Empty description="No insights available." />
        </div>
      ) : (
        <div data-testid="outliers-content">
          <OutliersTable outliersByDepartment={outliersQuery.data!.outliersByDepartment} />
        </div>
      )}
    </div>
  );
}
