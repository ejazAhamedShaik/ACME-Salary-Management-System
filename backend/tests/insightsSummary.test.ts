import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/server.js";
import { employees } from "../src/db/schema.js";
import { createInMemoryDb, type TestDb } from "./testDb.js";

// Amounts are chosen so USD conversion (rates: GBP 1.27, EUR 1.09, INR 0.012)
// produces hand-verifiable totals/averages. Engineering's average is the one
// deliberate exception — 21,700 / 3 = 7,233.333... — used to prove rounding.
const fixture = [
  {
    employeeCode: "EMP-000001",
    name: "Employee One",
    department: "Engineering",
    country: "India",
    currencyCode: "INR",
    salaryAmount: 250_000, // USD 3,000
    joinedAt: new Date("2021-01-01"),
  },
  {
    employeeCode: "EMP-000002",
    name: "Employee Two",
    department: "Engineering",
    country: "India",
    currencyCode: "INR",
    salaryAmount: 500_000, // USD 6,000
    joinedAt: new Date("2021-01-02"),
  },
  {
    employeeCode: "EMP-000003",
    name: "Employee Three",
    department: "Engineering",
    country: "United Kingdom",
    currencyCode: "GBP",
    salaryAmount: 10_000, // USD 12,700
    joinedAt: new Date("2021-01-03"),
  },
  {
    employeeCode: "EMP-000004",
    name: "Employee Four",
    department: "Sales",
    country: "United Kingdom",
    currencyCode: "GBP",
    salaryAmount: 20_000, // USD 25,400
    joinedAt: new Date("2021-01-04"),
  },
  {
    employeeCode: "EMP-000005",
    name: "Employee Five",
    department: "Sales",
    country: "Germany",
    currencyCode: "EUR",
    salaryAmount: 100_000, // USD 109,000
    joinedAt: new Date("2021-01-05"),
  },
];

describe("GET /insights/summary", () => {
  let db: TestDb;

  beforeAll(() => {
    db = createInMemoryDb();
    db.insert(employees).values(fixture).run();
  });

  afterAll(() => {
    db.$client.close();
  });

  it("returns totalPayrollUSD matching the hand-computed sum across mixed currencies", async () => {
    const app = createApp(db);

    const response = await request(app).get("/insights/summary");

    expect(response.status).toBe(200);
    // 3,000 + 6,000 + 12,700 + 25,400 + 109,000
    expect(response.body.totalPayrollUSD).toBe(156_100);
  });

  it("returns avgSalaryByDepartmentUSD and avgSalaryByCountryUSD matching hand-computed values", async () => {
    const app = createApp(db);

    const response = await request(app).get("/insights/summary");

    expect(response.body.avgSalaryByDepartmentUSD).toEqual({
      Engineering: 7_233, // (3,000 + 6,000 + 12,700) / 3, rounded
      Sales: 67_200, // (25,400 + 109,000) / 2
    });
    expect(response.body.avgSalaryByCountryUSD).toEqual({
      India: 4_500, // (3,000 + 6,000) / 2
      "United Kingdom": 19_050, // (12,700 + 25,400) / 2
      Germany: 109_000,
    });
  });

  it("returns headcountByDepartment and headcountByCountry matching the fixture counts exactly", async () => {
    const app = createApp(db);

    const response = await request(app).get("/insights/summary");

    expect(response.body.headcountByDepartment).toEqual({ Engineering: 3, Sales: 2 });
    expect(response.body.headcountByCountry).toEqual({
      India: 2,
      "United Kingdom": 2,
      Germany: 1,
    });
  });

  it("rounds monetary figures to whole units, never raw floats", async () => {
    const app = createApp(db);

    const response = await request(app).get("/insights/summary");

    expect(response.body.avgSalaryByDepartmentUSD.Engineering).toBe(7_233);
    expect(Number.isInteger(response.body.totalPayrollUSD)).toBe(true);
    for (const value of Object.values(response.body.totalPayrollByCountryUSD)) {
      expect(Number.isInteger(value)).toBe(true);
    }
    for (const value of Object.values(response.body.avgSalaryByDepartmentUSD)) {
      expect(Number.isInteger(value)).toBe(true);
    }
  });
});
