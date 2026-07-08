import { sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { employees } from "../db/schema.js";

export interface SalaryGroup {
  department: string;
  country: string;
  currencyCode: string;
  totalAmount: number;
  count: number;
}

export interface InsightsRepository {
  findSalaryGroups(): SalaryGroup[];
}

export function createInsightsRepository(
  db: BetterSQLite3Database<Record<string, unknown>>,
): InsightsRepository {
  return {
    findSalaryGroups() {
      return db
        .select({
          department: employees.department,
          country: employees.country,
          currencyCode: employees.currencyCode,
          totalAmount: sql<number>`SUM(${employees.salaryAmount})`,
          count: sql<number>`COUNT(*)`,
        })
        .from(employees)
        .groupBy(employees.department, employees.country, employees.currencyCode)
        .all();
    },
  };
}
