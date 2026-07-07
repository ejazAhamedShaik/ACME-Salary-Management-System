import { API_BASE_URL } from "./apiClient";
import type { Employee, EmployeeFilters, PaginatedResponse } from "./types";

export interface FetchEmployeesParams {
  page: number;
  pageSize: number;
  search?: string;
  department?: string;
  country?: string;
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

  if (params.department) {
    query.set("department", params.department);
  }

  if (params.country) {
    query.set("country", params.country);
  }

  const response = await fetch(`${API_BASE_URL}/employees?${query.toString()}`);

  if (!response.ok) {
    throw new Error(`Failed to fetch employees: ${response.status}`);
  }

  return response.json() as Promise<PaginatedResponse<Employee>>;
}

export async function fetchEmployeeFilters(): Promise<EmployeeFilters> {
  const response = await fetch(`${API_BASE_URL}/employees/filters`);

  if (!response.ok) {
    throw new Error(`Failed to fetch employee filters: ${response.status}`);
  }

  return response.json() as Promise<EmployeeFilters>;
}
