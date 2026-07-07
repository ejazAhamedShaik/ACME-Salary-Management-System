import type { Request, Response } from "express";
import type { EmployeeService } from "../services/employeeService.js";

export interface EmployeeController {
  listEmployees(req: Request, res: Response): void;
}

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function parsePage(value: unknown): number {
  if (typeof value !== "string") {
    return DEFAULT_PAGE;
  }
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : DEFAULT_PAGE;
}

function parsePageSize(value: unknown): number {
  if (typeof value !== "string") {
    return DEFAULT_PAGE_SIZE;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(parsed, MAX_PAGE_SIZE);
}

function parseOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

export function createEmployeeController(service: EmployeeService): EmployeeController {
  return {
    listEmployees(req: Request, res: Response): void {
      const result = service.listEmployees({
        page: parsePage(req.query.page),
        pageSize: parsePageSize(req.query.pageSize),
        department: parseOptionalString(req.query.department),
        country: parseOptionalString(req.query.country),
        search: parseOptionalString(req.query.search),
      });

      res.status(200).json(result);
    },
  };
}
