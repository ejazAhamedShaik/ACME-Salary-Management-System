import { beforeEach, describe, expect, it, vi } from "vitest";
import { screen, within } from "@testing-library/react";
import { InsightsPage } from "../src/pages/InsightsPage";
import { renderWithProviders } from "./testUtils";
import { fetchInsightsOutliers, fetchInsightsSummary } from "../src/api/insights";
import type { InsightsOutliers, InsightsSummary } from "../src/api/types";

vi.mock("../src/api/insights", () => ({
  fetchInsightsSummary: vi.fn(),
  fetchInsightsOutliers: vi.fn(),
}));

const fetchInsightsSummaryMock = vi.mocked(fetchInsightsSummary);
const fetchInsightsOutliersMock = vi.mocked(fetchInsightsOutliers);

const summaryFixture: InsightsSummary = {
  totalPayrollUSD: 1_234_567,
  totalPayrollByCountryUSD: { India: 500_000, "United Kingdom": 734_567 },
  avgSalaryByDepartmentUSD: { Engineering: 95_000, Sales: 88_000 },
  avgSalaryByCountryUSD: { India: 40_000, "United Kingdom": 130_000 },
  headcountByDepartment: { Engineering: 10, Sales: 8 },
  headcountByCountry: { India: 9, "United Kingdom": 9 },
};

const emptySummaryFixture: InsightsSummary = {
  totalPayrollUSD: 0,
  totalPayrollByCountryUSD: {},
  avgSalaryByDepartmentUSD: {},
  avgSalaryByCountryUSD: {},
  headcountByDepartment: {},
  headcountByCountry: {},
};

const outliersFixture: InsightsOutliers = {
  outliersByDepartment: [
    {
      department: "Engineering",
      highest: {
        id: 1,
        employeeCode: "EMP-000001",
        name: "Alice Adams",
        country: "United Kingdom",
        currencyCode: "GBP",
        salaryAmount: 100_000,
        salaryUSD: 127_000,
      },
      lowest: {
        id: 2,
        employeeCode: "EMP-000002",
        name: "Bob Baker",
        country: "India",
        currencyCode: "INR",
        salaryAmount: 3_000_000,
        salaryUSD: 36_000,
      },
    },
    {
      department: "Solo Dept",
      highest: {
        id: 3,
        employeeCode: "EMP-000003",
        name: "Carol Chen",
        country: "Germany",
        currencyCode: "EUR",
        salaryAmount: 60_000,
        salaryUSD: 65_400,
      },
      lowest: {
        id: 3,
        employeeCode: "EMP-000003",
        name: "Carol Chen",
        country: "Germany",
        currencyCode: "EUR",
        salaryAmount: 60_000,
        salaryUSD: 65_400,
      },
    },
  ],
};

const emptyOutliersFixture: InsightsOutliers = { outliersByDepartment: [] };

beforeEach(() => {
  fetchInsightsSummaryMock.mockReset();
  fetchInsightsOutliersMock.mockReset();
});

describe("InsightsPage", () => {
  it("renders a loading state for each section independently before data resolves", () => {
    fetchInsightsSummaryMock.mockReturnValue(new Promise(() => {}));
    fetchInsightsOutliersMock.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<InsightsPage />);

    expect(screen.getByTestId("summary-loading")).toBeInTheDocument();
    expect(screen.getByTestId("outliers-loading")).toBeInTheDocument();
  });

  it("renders summary figures correctly formatted once data resolves", async () => {
    fetchInsightsSummaryMock.mockResolvedValue(summaryFixture);
    fetchInsightsOutliersMock.mockResolvedValue(emptyOutliersFixture);

    renderWithProviders(<InsightsPage />);

    const summarySection = await screen.findByTestId("summary-content");
    expect(within(summarySection).getByText("$1,234,567")).toBeInTheDocument();
    expect(within(summarySection).getByText("$95,000")).toBeInTheDocument();
    expect(within(summarySection).getByText("10")).toBeInTheDocument();
  });

  it("renders the outliers table with correct highest/lowest per department", async () => {
    fetchInsightsSummaryMock.mockResolvedValue(emptySummaryFixture);
    fetchInsightsOutliersMock.mockResolvedValue(outliersFixture);

    renderWithProviders(<InsightsPage />);

    const outliersSection = await screen.findByTestId("outliers-content");
    const engineeringRow = within(outliersSection).getByText("Engineering").closest("tr")!;
    expect(within(engineeringRow).getByText(/Alice Adams/)).toBeInTheDocument();
    expect(within(engineeringRow).getByText("$127,000")).toBeInTheDocument();
    expect(within(engineeringRow).getByText(/Bob Baker/)).toBeInTheDocument();
    expect(within(engineeringRow).getByText("$36,000")).toBeInTheDocument();
  });

  it("renders a single-employee department clearly, without looking like a duplication bug", async () => {
    fetchInsightsSummaryMock.mockResolvedValue(emptySummaryFixture);
    fetchInsightsOutliersMock.mockResolvedValue(outliersFixture);

    renderWithProviders(<InsightsPage />);

    const outliersSection = await screen.findByTestId("outliers-content");
    const soloRow = within(outliersSection).getByText("Solo Dept").closest("tr")!;
    expect(within(soloRow).getByText(/Carol Chen/)).toBeInTheDocument();
    expect(within(soloRow).getByText(/sole employee/i)).toBeInTheDocument();
  });

  it("renders the Empty state for a zero-employee response, not broken/NaN output", async () => {
    fetchInsightsSummaryMock.mockResolvedValue(emptySummaryFixture);
    fetchInsightsOutliersMock.mockResolvedValue(emptyOutliersFixture);

    renderWithProviders(<InsightsPage />);

    expect(await screen.findByTestId("summary-empty")).toBeInTheDocument();
    expect(await screen.findByTestId("outliers-empty")).toBeInTheDocument();
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
  });

  it("keeps rendering the other section normally when one query errors", async () => {
    fetchInsightsSummaryMock.mockResolvedValue(summaryFixture);
    fetchInsightsOutliersMock.mockRejectedValue(new Error("network down"));

    renderWithProviders(<InsightsPage />);

    expect(await screen.findByTestId("outliers-error")).toBeInTheDocument();
    const summarySection = await screen.findByTestId("summary-content");
    expect(within(summarySection).getByText("$1,234,567")).toBeInTheDocument();
  });
});
