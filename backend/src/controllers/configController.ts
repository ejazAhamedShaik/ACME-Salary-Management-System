import type { Request, Response } from "express";
import type { ConfigService } from "../services/configService.js";

export interface ConfigController {
  getCurrencies(req: Request, res: Response): void;
}

export function createConfigController(service: ConfigService): ConfigController {
  return {
    getCurrencies(req: Request, res: Response): void {
      res.status(200).json(service.getCurrencyConfig());
    },
  };
}
