import { sql } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { employees } from "../src/db/schema.js";
import { seedDatabase } from "../src/db/seed.js";
import { createInMemoryDb, type TestDb } from "./testDb.js";

describe("seedDatabase", () => {
  let db: TestDb;
  let seededCount: number;

  beforeAll(() => {
    db = createInMemoryDb();
    seededCount = seedDatabase(db);
  }, 15_000);

  afterAll(() => {
    db.$client.close();
  });

  it("reports seeding exactly 10,000 employees", () => {
    expect(seededCount).toBe(10_000);
  });

  it("persists exactly 10,000 employee rows", () => {
    const [{ count }] = db.select({ count: sql<number>`count(*)` }).from(employees).all();
    expect(count).toBe(10_000);
  });

  it("gives every employee a unique employeeCode", () => {
    const [{ total, distinctCodes }] = db
      .select({
        total: sql<number>`count(*)`,
        distinctCodes: sql<number>`count(distinct ${employees.employeeCode})`,
      })
      .from(employees)
      .all();

    expect(distinctCodes).toBe(total);
  });
});
