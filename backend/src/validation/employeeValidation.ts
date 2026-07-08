import { z } from "zod";
import { currencyRatesToUsd } from "../config/currencyRates.js";

export const createEmployeeSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  department: z.string().trim().min(1, "Department is required"),
  country: z.string().trim().min(1, "Country is required"),
  currencyCode: z
    .string()
    .min(1, "Currency code is required")
    .refine((code) => code in currencyRatesToUsd, "Unknown currency code"),
  salaryAmount: z
    .number()
    .int("Salary amount must be a whole number")
    .positive("Salary amount must be greater than zero"),
  joinedAt: z
    .string()
    .min(1, "Joined date is required")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Joined date must be a valid date"),
});

export type CreateEmployeeRequest = z.infer<typeof createEmployeeSchema>;
