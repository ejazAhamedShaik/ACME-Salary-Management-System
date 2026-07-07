import { and, asc, eq, like, sql } from "drizzle-orm";
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

export interface EmployeeRepository {
  findMany(filter: EmployeeFilter, page: PageWindow): { rows: Employee[]; total: number };
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
    conditions.push(like(sql`lower(${employees.name})`, `%${filter.search.toLowerCase()}%`));
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
  };
}
