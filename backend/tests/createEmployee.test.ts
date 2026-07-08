import request from "supertest";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createApp } from "../src/server.js";
import { createInMemoryDb, type TestDb } from "./testDb.js";

const validPayload = {
  name: "Ada Lovelace",
  department: "Engineering",
  country: "United Kingdom",
  currencyCode: "GBP",
  salaryAmount: 85_000,
  joinedAt: "2024-01-15",
};

describe("POST /employees", () => {
  let db: TestDb;

  beforeEach(() => {
    db = createInMemoryDb();
  });

  afterEach(() => {
    db.$client.close();
  });

  it("creates an employee and returns 201 with a generated employeeCode", async () => {
    const app = createApp(db);

    const response = await request(app).post("/employees").send(validPayload);

    expect(response.status).toBe(201);
    expect(response.body.employeeCode).toBe("EMP-000001");
    expect(response.body).toMatchObject({
      name: "Ada Lovelace",
      department: "Engineering",
      country: "United Kingdom",
      currencyCode: "GBP",
      salaryAmount: 85_000,
    });
  });

  it("assigns unique, incrementing employeeCodes across sequential creates", async () => {
    const app = createApp(db);

    const first = await request(app).post("/employees").send(validPayload);
    const second = await request(app).post("/employees").send(validPayload);
    const third = await request(app).post("/employees").send(validPayload);

    expect([first.body.employeeCode, second.body.employeeCode, third.body.employeeCode]).toEqual([
      "EMP-000001",
      "EMP-000002",
      "EMP-000003",
    ]);
  });

  it("returns 400 with a field-level error when a required field is missing", async () => {
    const app = createApp(db);
    const { name: _name, ...withoutName } = validPayload;

    const response = await request(app).post("/employees").send(withoutName);

    expect(response.status).toBe(400);
    expect(response.body.errors).toHaveProperty("name");
  });

  it.each([0, -5])("returns 400 when salaryAmount is %i", async (salaryAmount) => {
    const app = createApp(db);

    const response = await request(app)
      .post("/employees")
      .send({ ...validPayload, salaryAmount });

    expect(response.status).toBe(400);
    expect(response.body.errors).toHaveProperty("salaryAmount");
  });

  it("returns 400 for an unknown currencyCode", async () => {
    const app = createApp(db);

    const response = await request(app)
      .post("/employees")
      .send({ ...validPayload, currencyCode: "XYZ" });

    expect(response.status).toBe(400);
    expect(response.body.errors).toHaveProperty("currencyCode");
  });

  it("ignores a client-supplied employeeCode and generates its own", async () => {
    const app = createApp(db);

    const response = await request(app)
      .post("/employees")
      .send({ ...validPayload, employeeCode: "EMP-999999" });

    expect(response.status).toBe(201);
    expect(response.body.employeeCode).toBe("EMP-000001");
  });
});
