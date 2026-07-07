import { and, asc, eq, like, or, sql } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { employees } from "../db/schema.js";

export type Employee = typeof employees.$inferSelect;

export interface EmployeeFilter {
  department?: string;
  country?: string;
  search?: string;
}

export interface PageWindow {
  limit: number;
  offset: number;
}

export interface FilterOptions {
  departments: string[];
  countries: string[];
}

export interface EmployeeRepository {
  findMany(filter: EmployeeFilter, page: PageWindow): { rows: Employee[]; total: number };
  findFilterOptions(): FilterOptions;
}

function buildWhereClause(filter: EmployeeFilter) {
  const conditions = [];

  if (filter.department) {
    conditions.push(eq(employees.department, filter.department));
  }
  if (filter.country) {
    conditions.push(eq(employees.country, filter.country));
  }
  if (filter.search) {
    const term = `%${filter.search.toLowerCase()}%`;
    conditions.push(
      or(
        like(sql`lower(${employees.name})`, term),
        like(sql`lower(${employees.employeeCode})`, term),
      ),
    );
  }

  return conditions.length > 0 ? and(...conditions) : undefined;
}

export function createEmployeeRepository(
  db: BetterSQLite3Database<Record<string, unknown>>,
): EmployeeRepository {
  return {
    findMany(filter, page) {
      const whereClause = buildWhereClause(filter);

      const rows = db
        .select()
        .from(employees)
        .where(whereClause)
        .orderBy(asc(employees.id))
        .limit(page.limit)
        .offset(page.offset)
        .all();

      const [{ total }] = db
        .select({ total: sql<number>`count(*)` })
        .from(employees)
        .where(whereClause)
        .all();

      return { rows, total };
    },

    findFilterOptions() {
      const departmentRows = db
        .selectDistinct({ department: employees.department })
        .from(employees)
        .orderBy(asc(employees.department))
        .all();

      const countryRows = db
        .selectDistinct({ country: employees.country })
        .from(employees)
        .orderBy(asc(employees.country))
        .all();

      return {
        departments: departmentRows.map((row) => row.department),
        countries: countryRows.map((row) => row.country),
      };
    },
  };
}
