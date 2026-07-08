/**
 * Default currency for each seeded country. Used only to auto-suggest a
 * starting currencyCode when creating an employee — see ARCHITECTURE.md,
 * "country-currency defaulting is a suggestion, not a constraint": the
 * currencyCode Select this feeds always stays editable, never disabled.
 * NOT a whitelist — POST /employees accepts any non-empty country string.
 * Kept separate from currencyRates.ts, which is scoped specifically to FX
 * conversion rates, a different concern.
 */
export const COUNTRY_CURRENCY_DEFAULTS: Record<string, string> = {
  "United States": "USD",
  "United Kingdom": "GBP",
  Germany: "EUR",
  India: "INR",
  Canada: "CAD",
  Australia: "AUD",
};
