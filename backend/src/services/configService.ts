import { currencyRatesToUsd } from "../config/currencyRates.js";
import { COUNTRY_CURRENCY_DEFAULTS } from "../config/countryCurrencyDefaults.js";

export interface CurrencyConfig {
  currencies: string[];
  countryCurrencyDefaults: Record<string, string>;
}

export interface ConfigService {
  getCurrencyConfig(): CurrencyConfig;
}

export function createConfigService(): ConfigService {
  return {
    getCurrencyConfig(): CurrencyConfig {
      return {
        currencies: Object.keys(currencyRatesToUsd),
        countryCurrencyDefaults: COUNTRY_CURRENCY_DEFAULTS,
      };
    },
  };
}
