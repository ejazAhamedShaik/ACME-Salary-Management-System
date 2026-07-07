import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/server.js";
import { employees } from "../src/db/schema.js";
import { createInMemoryDb, type TestDb } from "./testDb.js";

describe("GET /employees/filters", () => {
  let db: TestDb;

  // Deliberately non-alphabetical insertion order so a passing "sorted"
  // assertion actually proves an ORDER BY, not accidental insertion order.
  // "Engineering"/"Germany" are shared by 2+ rows (dedup check); "Zzz Solo
  // Dept"/"Zzz Solo Country" belong to a single row (orphan-value check).
  const fixture = [
    {
      employeeCode: "EMP-000001",
      name: "Employee One",
      department: "Finance",
      country: "India",
      currencyCode: "INR",
      salaryAmount: 60_000,
      joinedAt: new Date("2021-03-01"),
    },
    {
      employeeCode: "EMP-000002",
      name: "Employee Two",
      department: "Engineering",
      country: "Germany",
      currencyCode: "EUR",
      salaryAmount: 70_000,
      joinedAt: new Date("2021-03-02"),
    },
    {
      employeeCode: "EMP-000003",
      name: "Employee Three",
      department: "Engineering",
      country: "Germany",
      currencyCode: "EUR",
      salaryAmount: 72_000,
      joinedAt: new Date("2021-03-03"),
    },
    {
      employeeCode: "EMP-000004",
      name: "Employee Four",
      department: "Zzz Solo Dept",
      country: "Zzz Solo Country",
      currencyCode: "USD",
      salaryAmount: 65_000,
      joinedAt: new Date("2021-03-04"),
    },
  ];

  beforeAll(() => {
    db = createInMemoryDb();
    db.insert(employees).values(fixture).run();
  });

  afterAll(() => {
    db.$client.close();
  });

  it("returns each department and country exactly once even when shared by multiple employees", async () => {
    const app = createApp(db);

    const response = await request(app).get("/employees/filters");

    expect(response.status).toBe(200);
    expect(response.body.departments).toEqual(["Engineering", "Finance", "Zzz Solo Dept"]);
    expect(response.body.countries).toEqual(["Germany", "India", "Zzz Solo Country"]);
  });

  it("returns both arrays alphabetically sorted", async () => {
    const app = createApp(db);

    const response = await request(app).get("/employees/filters");

    expect(response.body.departments).toEqual([...response.body.departments].sort());
    expect(response.body.countries).toEqual([...response.body.countries].sort());
  });

  it("includes a department and country held by only one employee, exactly once", async () => {
    const app = createApp(db);

    const response = await request(app).get("/employees/filters");

    const soloDeptCount = response.body.departments.filter(
      (department: string) => department === "Zzz Solo Dept",
    ).length;
    const soloCountryCount = response.body.countries.filter(
      (country: string) => country === "Zzz Solo Country",
    ).length;

    expect(soloDeptCount).toBe(1);
    expect(soloCountryCount).toBe(1);
  });
});
