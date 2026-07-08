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

export interface OutlierEmployee {
  id: number;
  employeeCode: string;
  name: string;
  country: string;
  currencyCode: string;
  salaryAmount: number;
  salaryUSD: number;
}

export interface DepartmentOutlier {
  department: string;
  highest: OutlierEmployee;
  lowest: OutlierEmployee;
}

export interface InsightsOutliers {
  outliersByDepartment: DepartmentOutlier[];
}

export interface InsightsService {
  getSummary(): InsightsSummary;
  getOutliers(): InsightsOutliers;
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

    getOutliers() {
      const rows = repository.findEmployeesForOutliers();
      const byDepartment = new Map<string, OutlierEmployee[]>();

      for (const row of rows) {
        const salaryUSD = convertToUSD(row.salaryAmount, row.currencyCode);
        if (salaryUSD === null) {
          continue;
        }

        const employee: OutlierEmployee = {
          id: row.id,
          employeeCode: row.employeeCode,
          name: row.name,
          country: row.country,
          currencyCode: row.currencyCode,
          salaryAmount: row.salaryAmount,
          salaryUSD: Math.round(salaryUSD),
        };

        const departmentEmployees = byDepartment.get(row.department) ?? [];
        departmentEmployees.push(employee);
        byDepartment.set(row.department, departmentEmployees);
      }

      const outliersByDepartment = [...byDepartment.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([department, departmentEmployees]) => ({
          department,
          highest: departmentEmployees.reduce((max, employee) =>
            employee.salaryUSD > max.salaryUSD ? employee : max,
          ),
          lowest: departmentEmployees.reduce((min, employee) =>
            employee.salaryUSD < min.salaryUSD ? employee : min,
          ),
        }));

      return { outliersByDepartment };
    },
  };
}
