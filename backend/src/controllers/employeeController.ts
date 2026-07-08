import type { Request, Response } from "express";
import type { ZodError } from "zod";
import type { EmployeeService } from "../services/employeeService.js";
import { createEmployeeSchema, updateEmployeeSchema } from "../validation/employeeValidation.js";

export interface EmployeeController {
  listEmployees(req: Request, res: Response): void;
  listFilters(req: Request, res: Response): void;
  createEmployee(req: Request, res: Response): void;
  updateEmployee(req: Request, res: Response): void;
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

function formatZodErrors(error: ZodError): Record<string, string> {
  const fieldErrors = error.flatten().fieldErrors as Record<string, string[] | undefined>;
  const errors: Record<string, string> = {};
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (messages && messages.length > 0) {
      errors[field] = messages[0]!;
    }
  }
  return errors;
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

    listFilters(req: Request, res: Response): void {
      res.status(200).json(service.listFilters());
    },

    createEmployee(req: Request, res: Response): void {
      const result = createEmployeeSchema.safeParse(req.body);

      if (!result.success) {
        res.status(400).json({ errors: formatZodErrors(result.error) });
        return;
      }

      res.status(201).json(service.createEmployee(result.data));
    },

    updateEmployee(req: Request, res: Response): void {
      const id = Number(req.params.id);
      if (!Number.isInteger(id)) {
        res.status(404).end();
        return;
      }

      const result = updateEmployeeSchema.safeParse(req.body);
      if (!result.success) {
        res.status(400).json({ errors: formatZodErrors(result.error) });
        return;
      }

      const updated = service.updateEmployee(id, result.data);
      if (!updated) {
        res.status(404).end();
        return;
      }

      res.status(200).json(updated);
    },
  };
}
