import { API_BASE_URL } from "./apiClient";
import type {
  CreateEmployeePayload,
  Employee,
  EmployeeFilters,
  PaginatedResponse,
  UpdateEmployeePayload,
} from "./types";

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

export class ApiFieldError extends Error {
  errors: Record<string, string>;

  constructor(errors: Record<string, string>) {
    super("Request validation failed");
    this.name = "ApiFieldError";
    this.errors = errors;
  }
}

export async function createEmployee(payload: CreateEmployeePayload): Promise<Employee> {
  const response = await fetch(`${API_BASE_URL}/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (response.status === 400) {
    const body = (await response.json()) as { errors: Record<string, string> };
    throw new ApiFieldError(body.errors);
  }

  if (!response.ok) {
    throw new Error(`Failed to create employee: ${response.status}`);
  }

  return response.json() as Promise<Employee>;
}

export async function deleteEmployee(id: number): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`Failed to delete employee: ${response.status}`);
  }
}

export async function updateEmployee(
  id: number,
  payload: UpdateEmployeePayload,
): Promise<Employee> {
  const response = await fetch(`${API_BASE_URL}/employees/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (response.status === 400) {
    const body = (await response.json()) as { errors: Record<string, string> };
    throw new ApiFieldError(body.errors);
  }

  if (!response.ok) {
    throw new Error(`Failed to update employee: ${response.status}`);
  }

  return response.json() as Promise<Employee>;
}
