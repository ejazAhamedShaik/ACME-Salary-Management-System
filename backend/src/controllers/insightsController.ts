import type { Request, Response } from "express";
import type { InsightsService } from "../services/insightsService.js";

export interface InsightsController {
  getSummary(req: Request, res: Response): void;
}

export function createInsightsController(service: InsightsService): InsightsController {
  return {
    getSummary(req: Request, res: Response): void {
      res.status(200).json(service.getSummary());
    },
  };
}
