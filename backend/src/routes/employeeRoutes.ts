import { Router } from "express";
import type { EmployeeController } from "../controllers/employeeController.js";

export function createEmployeeRouter(controller: EmployeeController): Router {
  const router = Router();
  router.get("/", (req, res) => controller.listEmployees(req, res));
  router.get("/filters", (req, res) => controller.listFilters(req, res));
  router.post("/", (req, res) => controller.createEmployee(req, res));
  router.patch("/:id", (req, res) => controller.updateEmployee(req, res));
  return router;
}
