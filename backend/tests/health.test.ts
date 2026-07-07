import request from "supertest";
import { beforeAll, describe, expect, it } from "vitest";
import { createApp } from "../src/server.js";
import { createInMemoryDb, type TestDb } from "./testDb.js";

describe("GET /health", () => {
  let db: TestDb;

  beforeAll(() => {
    db = createInMemoryDb();
  });

  it("responds with 200 and status ok", async () => {
    const app = createApp(db);

    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });
});
