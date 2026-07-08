export interface Employee {
  id: number;
  employeeCode: string;
  name: string;
  department: string;
  country: string;
  currencyCode: string;
  salaryAmount: number;
  joinedAt: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

export interface EmployeeFilters {
  departments: string[];
  countries: string[];
}

export interface CurrencyConfig {
  currencies: string[];
  countryCurrencyDefaults: Record<string, string>;
}

export interface CreateEmployeePayload {
  name: string;
  department: string;
  country: string;
  currencyCode: string;
  salaryAmount: number;
  joinedAt: string;
}

export type UpdateEmployeePayload = Partial<CreateEmployeePayload>;
