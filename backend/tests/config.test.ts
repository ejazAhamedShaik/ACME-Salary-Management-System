import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/server.js";
import { createInMemoryDb } from "./testDb.js";

describe("GET /config/currencies", () => {
  it("returns both currencies and countryCurrencyDefaults with the right shape", async () => {
    const app = createApp(createInMemoryDb());

    const response = await request(app).get("/config/currencies");

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.currencies)).toBe(true);
    expect(response.body.currencies.length).toBeGreaterThan(0);
    expect(typeof response.body.countryCurrencyDefaults).toBe("object");
    expect(response.body.countryCurrencyDefaults).not.toBeNull();
  });

  it("has every countryCurrencyDefaults value present in currencies", async () => {
    const app = createApp(createInMemoryDb());

    const response = await request(app).get("/config/currencies");

    const { currencies, countryCurrencyDefaults } = response.body;
    for (const currencyCode of Object.values(countryCurrencyDefaults) as string[]) {
      expect(currencies).toContain(currencyCode);
    }
  });
});
