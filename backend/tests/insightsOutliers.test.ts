import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/server.js";
import { employees } from "../src/db/schema.js";
import { createInMemoryDb, type TestDb } from "./testDb.js";

// Engineering: a larger native amount (INR) converts to a *smaller* USD value
// than a smaller native amount (GBP) — proves ranking uses salaryUSD, not
// salaryAmount. Solo Dept: exactly one employee, must be both highest and
// lowest. Marketing: one employee with an unrecognized currency code, which
// must be excluded entirely rather than crashing the request.
const fixture = [
  {
    employeeCode: "EMP-000001",
    name: "Employee A",
    department: "Engineering",
    country: "India",
    currencyCode: "INR",
    salaryAmount: 1_000_000, // USD 12,000
    joinedAt: new Date("2021-01-01"),
  },
  {
    employeeCode: "EMP-000002",
    name: "Employee B",
    department: "Engineering",
    country: "United Kingdom",
    currencyCode: "GBP",
    salaryAmount: 10_000, // USD 12,700 — higher than A despite a far smaller native amount
    joinedAt: new Date("2021-01-02"),
  },
  {
    employeeCode: "EMP-000003",
    name: "Employee C",
    department: "Marketing",
    country: "Canada",
    currencyCode: "CAD",
    salaryAmount: 50_000, // USD 37,000
    joinedAt: new Date("2021-01-03"),
  },
  {
    employeeCode: "EMP-000004",
    name: "Employee D",
    department: "Marketing",
    country: "Australia",
    currencyCode: "ZZZ", // unrecognized — must be excluded, not thrown
    salaryAmount: 999_999,
    joinedAt: new Date("2021-01-04"),
  },
  {
    employeeCode: "EMP-000005",
    name: "Employee E",
    department: "Solo Dept",
    country: "Germany",
    currencyCode: "EUR",
    salaryAmount: 50_000, // USD 54,500
    joinedAt: new Date("2021-01-05"),
  },
];

function findDepartment(body: { outliersByDepartment: Array<{ department: string }> }, department: string) {
  return body.outliersByDepartment.find((entry) => entry.department === department);
}

describe("GET /insights/outliers", () => {
  let db: TestDb;

  beforeAll(() => {
    db = createInMemoryDb();
    db.insert(employees).values(fixture).run();
  });

  afterAll(() => {
    db.$client.close();
  });

  it("ranks highest/lowest by converted USD value, not native amount", async () => {
    const app = createApp(db);

    const response = await request(app).get("/insights/outliers");

    expect(response.status).toBe(200);
    const engineering = findDepartment(response.body, "Engineering");
    expect(engineering.highest).toMatchObject({
      employeeCode: "EMP-000002",
      name: "Employee B",
      country: "United Kingdom",
      currencyCode: "GBP",
      salaryAmount: 10_000,
      salaryUSD: 12_700,
    });
    expect(engineering.lowest).toMatchObject({
      employeeCode: "EMP-000001",
      name: "Employee A",
      country: "India",
      currencyCode: "INR",
      salaryAmount: 1_000_000,
      salaryUSD: 12_000,
    });
  });

  it("returns the sole employee as both highest and lowest for a single-employee department", async () => {
    const app = createApp(db);

    const response = await request(app).get("/insights/outliers");

    const soloDept = findDepartment(response.body, "Solo Dept");
    expect(soloDept.highest).toEqual(soloDept.lowest);
    expect(soloDept.highest).toMatchObject({ employeeCode: "EMP-000005", salaryUSD: 54_500 });
  });

  it("excludes a row with an unrecognized currency code, without erroring", async () => {
    const app = createApp(db);

    const response = await request(app).get("/insights/outliers");

    expect(response.status).toBe(200);
    const marketing = findDepartment(response.body, "Marketing");
    expect(marketing.highest).toMatchObject({ employeeCode: "EMP-000003", salaryUSD: 37_000 });
    expect(marketing.lowest).toMatchObject({ employeeCode: "EMP-000003", salaryUSD: 37_000 });

    const allEmployeeCodes = response.body.outliersByDepartment.flatMap(
      (entry: { highest: { employeeCode: string }; lowest: { employeeCode: string } }) => [
        entry.highest.employeeCode,
        entry.lowest.employeeCode,
      ],
    );
    expect(allEmployeeCodes).not.toContain("EMP-000004");
  });
});
