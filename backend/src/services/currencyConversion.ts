import { currencyRatesToUsd } from "../config/currencyRates.js";

export function convertToUSD(amount: number, currencyCode: string): number | null {
  const rate = currencyRatesToUsd[currencyCode];
  if (rate === undefined) {
    console.warn(`Unknown currency code "${currencyCode}" — excluding from aggregation`);
    return null;
  }
  return amount * rate;
}
