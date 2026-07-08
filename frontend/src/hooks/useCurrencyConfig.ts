import { useQuery } from "@tanstack/react-query";
import { fetchCurrencyConfig } from "../api/config";

export function useCurrencyConfig() {
  return useQuery({
    queryKey: ["currencyConfig"] as const,
    queryFn: fetchCurrencyConfig,
    staleTime: Infinity,
  });
}
