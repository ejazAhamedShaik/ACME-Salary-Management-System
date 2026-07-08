import { describe, expect, it } from "vitest";
import { convertToUSD } from "../src/services/currencyConversion.js";

describe("convertToUSD", () => {
  it("converts a known amount/currency pair to the expected USD value", () => {
    // GBP rate is 1.27; 10000 is a clean multiple of 100 so the product has no remainder.
    expect(convertToUSD(10_000, "GBP")).toBe(12_700);
    // INR rate is 0.012; 250000 is a clean multiple of 250 so the product has no remainder.
    expect(convertToUSD(250_000, "INR")).toBe(3_000);
  });

  it("does not throw for an unrecognized currency code", () => {
    expect(() => convertToUSD(1_000, "XYZ")).not.toThrow();
    expect(convertToUSD(1_000, "XYZ")).toBeNull();
  });
});
