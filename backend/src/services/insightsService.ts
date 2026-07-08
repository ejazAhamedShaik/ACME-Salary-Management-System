import type { InsightsRepository } from "../repositories/insightsRepository.js";
import { convertToUSD } from "./currencyConversion.js";

export interface InsightsSummary {
  totalPayrollUSD: number;
  totalPayrollByCountryUSD: Record<string, number>;
  avgSalaryByDepartmentUSD: Record<string, number>;
  avgSalaryByCountryUSD: Record<string, number>;
  headcountByDepartment: Record<string, number>;
  headcountByCountry: Record<string, number>;
}

export interface InsightsService {
  getSummary(): InsightsSummary;
}

function roundValues(record: Record<string, number>): Record<string, number> {
  const rounded: Record<string, number> = {};
  for (const [key, value] of Object.entries(record)) {
    rounded[key] = Math.round(value);
  }
  return rounded;
}

function addTo(record: Record<string, number>, key: string, amount: number): void {
  record[key] = (record[key] ?? 0) + amount;
}

function computeAverages(
  usdSumByKey: Record<string, number>,
  convertedCountByKey: Record<string, number>,
): Record<string, number> {
  const averages: Record<string, number> = {};
  for (const [key, usdSum] of Object.entries(usdSumByKey)) {
    averages[key] = usdSum / convertedCountByKey[key]!;
  }
  return averages;
}

export function createInsightsService(repository: InsightsRepository): InsightsService {
  return {
    getSummary() {
      const groups = repository.findSalaryGroups();

      let totalPayrollUSD = 0;
      const totalPayrollByCountryUSD: Record<string, number> = {};
      const headcountByDepartment: Record<string, number> = {};
      const headcountByCountry: Record<string, number> = {};

      const usdSumByDepartment: Record<string, number> = {};
      const convertedCountByDepartment: Record<string, number> = {};
      const usdSumByCountry: Record<string, number> = {};
      const convertedCountByCountry: Record<string, number> = {};

      for (const group of groups) {
        // Headcount needs no currency conversion, so every group's count is
        // included unconditionally, even one whose currencyCode can't be converted.
        addTo(headcountByDepartment, group.department, group.count);
        addTo(headcountByCountry, group.country, group.count);

        const usd = convertToUSD(group.totalAmount, group.currencyCode);
        if (usd === null) {
          continue;
        }

        totalPayrollUSD += usd;
        addTo(totalPayrollByCountryUSD, group.country, usd);

        addTo(usdSumByDepartment, group.department, usd);
        addTo(convertedCountByDepartment, group.department, group.count);
        addTo(usdSumByCountry, group.country, usd);
        addTo(convertedCountByCountry, group.country, group.count);
      }

      return {
        totalPayrollUSD: Math.round(totalPayrollUSD),
        totalPayrollByCountryUSD: roundValues(totalPayrollByCountryUSD),
        avgSalaryByDepartmentUSD: roundValues(
          computeAverages(usdSumByDepartment, convertedCountByDepartment),
        ),
        avgSalaryByCountryUSD: roundValues(computeAverages(usdSumByCountry, convertedCountByCountry)),
        headcountByDepartment,
        headcountByCountry,
      };
    },
  };
}
