import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createApp } from "../src/server.js";
import { employees } from "../src/db/schema.js";
import { createInMemoryDb, type TestDb } from "./testDb.js";

const baseRow = {
  department: "Engineering",
  country: "United Kingdom",
  currencyCode: "GBP",
  salaryAmount: 85_000,
  joinedAt: new Date("2024-01-15"),
};

describe("DELETE /employees/:id", () => {
  let db: TestDb;

  beforeEach(() => {
    db = createInMemoryDb();
  });

  afterEach(() => {
    db.$client.close();
  });

  it("removes the employee — a subsequent lookup for that id returns nothing", async () => {
    const [inserted] = db
      .insert(employees)
      .values({ ...baseRow, employeeCode: "EMP-000001", name: "Ada Lovelace" })
      .returning()
      .all();
    const app = createApp(db);

    const response = await request(app).delete(`/employees/${inserted.id}`);

    expect(response.status).toBe(204);
    expect(response.body).toEqual({});
    const row = db.select().from(employees).where(eq(employees.id, inserted.id)).get();
    expect(row).toBeUndefined();
  });

  it("removes exactly the targeted record, leaving siblings untouched", async () => {
    const [first, second] = db
      .insert(employees)
      .values([
        { ...baseRow, employeeCode: "EMP-000001", name: "Ada Lovelace" },
        { ...baseRow, employeeCode: "EMP-000002", name: "Grace Hopper" },
      ])
      .returning()
      .all();
    const app = createApp(db);

    await request(app).delete(`/employees/${first.id}`);

    const remaining = db.select().from(employees).all();
    expect(remaining).toHaveLength(1);
    expect(remaining[0]).toMatchObject({ id: second.id, name: "Grace Hopper" });
  });

  it("returns 404 for a non-existent id", async () => {
    const app = createApp(db);

    const response = await request(app).delete("/employees/999999");

    expect(response.status).toBe(404);
  });

  it("returns 400 for a non-numeric id, not a 500", async () => {
    const app = createApp(db);

    const response = await request(app).delete("/employees/abc");

    expect(response.status).toBe(400);
  });

  it("keeps generating unique employeeCodes after a delete leaves a gap", async () => {
    db.insert(employees)
      .values([
        { ...baseRow, employeeCode: "EMP-000001", name: "Employee One" },
        { ...baseRow, employeeCode: "EMP-000002", name: "Employee Two" },
        { ...baseRow, employeeCode: "EMP-000003", name: "Employee Three" },
      ])
      .run();
    const [middle] = db
      .select()
      .from(employees)
      .where(eq(employees.employeeCode, "EMP-000002"))
      .all();
    const app = createApp(db);

    await request(app).delete(`/employees/${middle.id}`);

    const response = await request(app).post("/employees").send({
      name: "Employee Four",
      department: "Engineering",
      country: "United Kingdom",
      currencyCode: "GBP",
      salaryAmount: 90_000,
      joinedAt: "2024-02-01",
    });

    expect(response.status).toBe(201);
    expect(response.body.employeeCode).toBe("EMP-000004");
  });
});
