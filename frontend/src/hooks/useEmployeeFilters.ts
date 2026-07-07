import { useQuery } from "@tanstack/react-query";
import { fetchEmployeeFilters } from "../api/employees";

const FILTERS_STALE_TIME_MS = 5 * 60 * 1000;

export function useEmployeeFilters() {
  return useQuery({
    queryKey: ["employeeFilters"] as const,
    queryFn: fetchEmployeeFilters,
    staleTime: FILTERS_STALE_TIME_MS,
  });
}
