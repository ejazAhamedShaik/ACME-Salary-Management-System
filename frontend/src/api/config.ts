import { API_BASE_URL } from "./apiClient";
import type { CurrencyConfig } from "./types";

export async function fetchCurrencyConfig(): Promise<CurrencyConfig> {
  const response = await fetch(`${API_BASE_URL}/config/currencies`);

  if (!response.ok) {
    throw new Error(`Failed to fetch currency config: ${response.status}`);
  }

  return response.json() as Promise<CurrencyConfig>;
}
