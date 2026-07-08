import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createApp } from "../src/server.js";
import { employees } from "../src/db/schema.js";
import { createInMemoryDb, type TestDb } from "./testDb.js";

const seedRow = {
  employeeCode: "EMP-000001",
  name: "Ada Lovelace",
  department: "Engineering",
  country: "United Kingdom",
  currencyCode: "GBP",
  salaryAmount: 85_000,
  joinedAt: new Date("2024-01-15"),
};

describe("PATCH /employees/:id", () => {
  let db: TestDb;
  let employeeId: number;

  beforeEach(() => {
    db = createInMemoryDb();
    const [inserted] = db.insert(employees).values(seedRow).returning().all();
    employeeId = inserted.id;
  });

  afterEach(() => {
    db.$client.close();
  });

  function fetchRow() {
    return db.select().from(employees).where(eq(employees.id, employeeId)).get();
  }

  it("updates a single field and leaves every other field unchanged", async () => {
    const app = createApp(db);

    const response = await request(app)
      .patch(`/employees/${employeeId}`)
      .send({ department: "Finance" });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: employeeId,
      employeeCode: "EMP-000001",
      name: "Ada Lovelace",
      department: "Finance",
      country: "United Kingdom",
      currencyCode: "GBP",
      salaryAmount: 85_000,
    });
  });

  it("applies multiple field updates from a single request", async () => {
    const app = createApp(db);

    const response = await request(app)
      .patch(`/employees/${employeeId}`)
      .send({ name: "Grace Hopper", salaryAmount: 95_000 });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      name: "Grace Hopper",
      salaryAmount: 95_000,
      department: "Engineering",
      country: "United Kingdom",
    });
  });

  it("returns 400 and leaves the record unchanged for an unknown currencyCode", async () => {
    const app = createApp(db);

    const response = await request(app)
      .patch(`/employees/${employeeId}`)
      .send({ currencyCode: "XYZ" });

    expect(response.status).toBe(400);
    expect(response.body.errors).toHaveProperty("currencyCode");
    expect(fetchRow()).toMatchObject({ currencyCode: "GBP" });
  });

  it.each([0, -5])(
    "returns 400 and leaves the record unchanged when salaryAmount is %i",
    async (salaryAmount) => {
      const app = createApp(db);

      const response = await request(app)
        .patch(`/employees/${employeeId}`)
        .send({ salaryAmount });

      expect(response.status).toBe(400);
      expect(response.body.errors).toHaveProperty("salaryAmount");
      expect(fetchRow()).toMatchObject({ salaryAmount: 85_000 });
    },
  );

  it("returns 404 for a non-existent id", async () => {
    const app = createApp(db);

    const response = await request(app)
      .patch("/employees/999999")
      .send({ department: "Finance" });

    expect(response.status).toBe(404);
  });

  it("ignores a client-supplied employeeCode and id, updating only the intended field", async () => {
    const app = createApp(db);

    const response = await request(app)
      .patch(`/employees/${employeeId}`)
      .send({ employeeCode: "EMP-999999", id: 42, name: "New Name" });

    expect(response.status).toBe(200);
    expect(response.body.employeeCode).toBe("EMP-000001");
    expect(response.body.id).toBe(employeeId);
    expect(response.body.name).toBe("New Name");
  });

  it("returns 200 with the record unchanged for an empty body", async () => {
    const app = createApp(db);

    const response = await request(app).patch(`/employees/${employeeId}`).send({});

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      id: employeeId,
      employeeCode: "EMP-000001",
      name: "Ada Lovelace",
      department: "Engineering",
      country: "United Kingdom",
      currencyCode: "GBP",
      salaryAmount: 85_000,
    });
  });
});
