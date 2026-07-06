/**
 * Fixed, illustrative currency conversion rates relative to USD, used only to
 * produce demo-scale, cross-country aggregates (e.g. total payroll cost).
 * These are NOT live FX rates and must never be treated as production-accurate
 * — see REQUIREMENTS.md's "Deliberately Out of Scope" table.
 */
export const currencyRatesToUsd: Record<string, number> = {
  USD: 1,
  GBP: 1.27,
  EUR: 1.09,
  INR: 0.012,
  CAD: 0.74,
  AUD: 0.66,
};
