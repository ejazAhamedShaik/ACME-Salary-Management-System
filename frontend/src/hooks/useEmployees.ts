import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { fetchEmployees } from "../api/employees";

export interface UseEmployeesParams {
  page: number;
  pageSize: number;
  search?: string;
}

export function useEmployees(params: UseEmployeesParams) {
  return useQuery({
    queryKey: ["employees", params] as const,
    queryFn: () => fetchEmployees(params),
    placeholderData: keepPreviousData,
  });
}
