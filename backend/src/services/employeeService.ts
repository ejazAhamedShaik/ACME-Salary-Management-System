import type { EmployeeRepository, FilterOptions } from "../repositories/employeeRepository.js";

export interface EmployeeListParams {
  page: number;
  pageSize: number;
  department?: string;
  country?: string;
  search?: string;
}

export interface EmployeeDto {
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

export interface EmployeeListResult {
  data: EmployeeDto[];
  pagination: PaginationMeta;
}

export interface CreateEmployeeInput {
  name: string;
  department: string;
  country: string;
  currencyCode: string;
  salaryAmount: number;
  joinedAt: string;
}

export interface EmployeeService {
  listEmployees(params: EmployeeListParams): EmployeeListResult;
  listFilters(): FilterOptions;
  createEmployee(input: CreateEmployeeInput): EmployeeDto;
}

const EMPLOYEE_CODE_PREFIX = "EMP-";
const EMPLOYEE_CODE_DIGITS = 6;

function nextEmployeeCode(maxNumber: number): string {
  return `${EMPLOYEE_CODE_PREFIX}${String(maxNumber + 1).padStart(EMPLOYEE_CODE_DIGITS, "0")}`;
}

export function createEmployeeService(repository: EmployeeRepository): EmployeeService {
  return {
    listEmployees(params) {
      const { page, pageSize, department, country, search } = params;
      const offset = (page - 1) * pageSize;

      const { rows, total } = repository.findMany(
        { department, country, search },
        { limit: pageSize, offset },
      );

      const data: EmployeeDto[] = rows.map((row) => ({
        id: row.id,
        employeeCode: row.employeeCode,
        name: row.name,
        department: row.department,
        country: row.country,
        currencyCode: row.currencyCode,
        salaryAmount: row.salaryAmount,
        joinedAt: row.joinedAt.toISOString(),
      }));

      return {
        data,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: total === 0 ? 0 : Math.ceil(total / pageSize),
        },
      };
    },

    listFilters() {
      return repository.findFilterOptions();
    },

    createEmployee(input) {
      const employeeCode = nextEmployeeCode(repository.findMaxEmployeeCodeNumber());

      const created = repository.create({
        employeeCode,
        name: input.name,
        department: input.department,
        country: input.country,
        currencyCode: input.currencyCode,
        salaryAmount: input.salaryAmount,
        joinedAt: new Date(input.joinedAt),
      });

      return {
        id: created.id,
        employeeCode: created.employeeCode,
        name: created.name,
        department: created.department,
        country: created.country,
        currencyCode: created.currencyCode,
        salaryAmount: created.salaryAmount,
        joinedAt: created.joinedAt.toISOString(),
      };
    },
  };
}
