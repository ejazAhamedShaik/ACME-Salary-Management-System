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

export type NewEmployeeRow = typeof employees.$inferInsert;

export type UpdateEmployeeRow = Partial<{
  name: string;
  department: string;
  country: string;
  currencyCode: string;
  salaryAmount: number;
  joinedAt: Date;
}>;

export interface EmployeeRepository {
  findMany(filter: EmployeeFilter, page: PageWindow): { rows: Employee[]; total: number };
  findFilterOptions(): FilterOptions;
  findMaxEmployeeCodeNumber(): number;
  create(row: NewEmployeeRow): Employee;
  update(id: number, row: UpdateEmployeeRow): Employee | undefined;
  delete(id: number): boolean;
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

    findMaxEmployeeCodeNumber() {
      const [row] = db
        .select({
          maxNumber: sql<number | null>`MAX(CAST(SUBSTR(${employees.employeeCode}, 5) AS INTEGER))`,
        })
        .from(employees)
        .all();
      return row?.maxNumber ?? 0;
    },

    create(row) {
      return db.insert(employees).values(row).returning().get();
    },

    update(id, row) {
      if (Object.keys(row).length === 0) {
        return db.select().from(employees).where(eq(employees.id, id)).get();
      }
      return db.update(employees).set(row).where(eq(employees.id, id)).returning().get();
    },

    delete(id) {
      const result = db.delete(employees).where(eq(employees.id, id)).run();
      return result.changes > 0;
    },
  };
}
