import { Router } from "express";
import type { HealthController } from "../controllers/healthController.js";

export function createHealthRouter(controller: HealthController): Router {
  const router = Router();
  router.get("/", (req, res) => controller.getHealth(req, res));
  return router;
}
