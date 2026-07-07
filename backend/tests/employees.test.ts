import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/server.js";
import { employees } from "../src/db/schema.js";
import { createInMemoryDb, type TestDb } from "./testDb.js";

interface RowOverrides {
  department: string;
  country: string;
}

let nextEmployeeId = 1;

function buildRows(count: number, overrides: RowOverrides) {
  return Array.from({ length: count }, (_, offset) => {
    const index = nextEmployeeId++;

    return {
      employeeCode: `EMP-${String(index).padStart(6, "0")}`,
      name: `Employee ${index}`,
      department: overrides.department,
      country: overrides.country,
      currencyCode: "USD",
      salaryAmount: 50_000,
      joinedAt: new Date(`2020-01-${String((index % 28) + 1).padStart(2, "0")}`),
    };
  });
}

describe("GET /employees", () => {
  let db: TestDb;

  // Explicit named buckets (not a modular-arithmetic formula) so counts are
  // verifiable by reading a variable name and array length.
  const engineeringCanada = buildRows(3, { department: "Engineering", country: "Canada" });
  const engineeringUS = buildRows(9, { department: "Engineering", country: "United States" });
  const salesCanada = buildRows(2, { department: "Sales", country: "Canada" });
  const salesUS = buildRows(11, { department: "Sales", country: "United States" });
  engineeringUS[engineeringUS.length - 1].name = "Zephyr Unique";
  const fixture = [...engineeringCanada, ...engineeringUS, ...salesCanada, ...salesUS];

  beforeAll(() => {
    db = createInMemoryDb();
    db.insert(employees).values(fixture).run();
  });

  afterAll(() => {
    db.$client.close();
  });

  it("returns page 1 with the default pageSize and the correct envelope shape", async () => {
    const app = createApp(db);

    const response = await request(app).get("/employees");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(20);
    expect(response.body.data[0]).toMatchObject({
      employeeCode: "EMP-000001",
      name: "Employee 1",
      department: "Engineering",
      country: "Canada",
    });
    expect(response.body.pagination).toEqual({
      page: 1,
      pageSize: 20,
      total: fixture.length,
      totalPages: Math.ceil(fixture.length / 20),
    });
  });

  it("respects an explicit page and pageSize", async () => {
    const app = createApp(db);

    const response = await request(app).get("/employees").query({ page: 2, pageSize: 10 });

    expect(response.body.data).toHaveLength(10);
    expect(response.body.data[0].employeeCode).toBe("EMP-000011");
    expect(response.body.pagination).toEqual({
      page: 2,
      pageSize: 10,
      total: fixture.length,
      totalPages: Math.ceil(fixture.length / 10),
    });
  });

  it("clamps pageSize above the hard cap instead of rejecting it", async () => {
    const app = createApp(db);

    const response = await request(app).get("/employees").query({ pageSize: 500 });

    expect(response.body.pagination.pageSize).toBe(100);
    expect(response.body.data).toHaveLength(fixture.length);
  });

  it("falls back to the default page for invalid page values", async () => {
    const app = createApp(db);

    for (const invalidPage of [0, -1, "abc"]) {
      const response = await request(app).get("/employees").query({ page: invalidPage });
      expect(response.body.pagination.page).toBe(1);
    }
  });

  it("filters by department alone", async () => {
    const app = createApp(db);

    const response = await request(app).get("/employees").query({ department: "Engineering", pageSize: 100 });

    expect(response.body.pagination.total).toBe(engineeringCanada.length + engineeringUS.length);
  });

  it("filters by country alone", async () => {
    const app = createApp(db);

    const response = await request(app).get("/employees").query({ country: "Canada", pageSize: 100 });

    expect(response.body.pagination.total).toBe(engineeringCanada.length + salesCanada.length);
  });

  it("combines department and country with AND, not OR", async () => {
    const app = createApp(db);

    const response = await request(app)
      .get("/employees")
      .query({ department: "Engineering", country: "Canada", pageSize: 100 });

    expect(response.body.pagination.total).toBe(engineeringCanada.length);
    expect(response.body.data.every((employee: { department: string; country: string }) =>
      employee.department === "Engineering" && employee.country === "Canada",
    )).toBe(true);
  });

  it("matches a partial, case-insensitive substring of name", async () => {
    const app = createApp(db);

    const response = await request(app).get("/employees").query({ search: "zephyr" });

    expect(response.body.pagination.total).toBe(1);
    expect(response.body.data[0].name).toBe("Zephyr Unique");
  });

  it("returns no matches for a filter combination that matches nothing", async () => {
    const app = createApp(db);

    const response = await request(app)
      .get("/employees")
      .query({ department: "Engineering", country: "Germany" });

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(response.body.pagination.total).toBe(0);
  });

  it("computes total and totalPages correctly against the full fixture", async () => {
    const app = createApp(db);

    const response = await request(app).get("/employees").query({ pageSize: 7 });

    expect(response.body.pagination.total).toBe(fixture.length);
    expect(response.body.pagination.totalPages).toBe(Math.ceil(fixture.length / 7));
  });

  it("echoes an out-of-range but valid page instead of clamping it", async () => {
    const app = createApp(db);

    const response = await request(app).get("/employees").query({ page: 999 });

    expect(response.body.pagination.page).toBe(999);
    expect(response.body.data).toEqual([]);
  });
});
