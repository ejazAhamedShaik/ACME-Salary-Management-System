import { Router } from "express";
import type { EmployeeController } from "../controllers/employeeController.js";

export function createEmployeeRouter(controller: EmployeeController): Router {
  const router = Router();
  router.get("/", (req, res) => controller.listEmployees(req, res));
  return router;
}
