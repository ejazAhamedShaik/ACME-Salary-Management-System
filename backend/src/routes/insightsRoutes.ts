import { Router } from "express";
import type { InsightsController } from "../controllers/insightsController.js";

export function createInsightsRouter(controller: InsightsController): Router {
  const router = Router();
  router.get("/summary", (req, res) => controller.getSummary(req, res));
  router.get("/outliers", (req, res) => controller.getOutliers(req, res));
  return router;
}
