import { API_BASE_URL } from "./apiClient";
import type { Employee, PaginatedResponse } from "./types";

export interface FetchEmployeesParams {
  page: number;
  pageSize: number;
  search?: string;
}

export async function fetchEmployees(
  params: FetchEmployeesParams,
): Promise<PaginatedResponse<Employee>> {
  const query = new URLSearchParams({
    page: String(params.page),
    pageSize: String(params.pageSize),
  });

  if (params.search) {
    query.set("search", params.search);
  }

  const response = await fetch(`${API_BASE_URL}/employees?${query.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch employees: ${response.status}`);
  }

  return response.json() as Promise<PaginatedResponse<Employee>>;
}
