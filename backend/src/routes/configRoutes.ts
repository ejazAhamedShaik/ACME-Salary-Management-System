import { Router } from "express";
import type { ConfigController } from "../controllers/configController.js";

export function createConfigRouter(controller: ConfigController): Router {
  const router = Router();
  router.get("/currencies", (req, res) => controller.getCurrencies(req, res));
  return router;
}
