import type { Request, Response } from "express";
import type { HealthService } from "../services/healthService.js";

export interface HealthController {
  getHealth(req: Request, res: Response): void;
}

export function createHealthController(service: HealthService): HealthController {
  return {
    getHealth(req: Request, res: Response): void {
      res.status(200).json(service.getStatus());
    },
  };
}
